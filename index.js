process.env["NTBA_FIX_319"] = 1;

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const Bluebird = require('bluebird');
const _ = require('lodash');
const moment = require('moment');
const momentTimezone = require('moment-timezone');
const cron = require('node-cron');
const message = require('./message');
const requestData = require('./requestData');
const Telegraf = require('telegraf');

Bluebird.config({
  cancellation: true,
});

const bot = new Telegraf(requestData.TOKEN_MNEACH);

bot.help((ctx) => {
  ctx.reply(message.help());
});

bot.command('/biayalistrik', (ctx) => {

  const dataFromDB = requestData.requestDataElectricityCost(requestData.startOfMonth, requestData.endOfMonth);
  dataFromDB.then((data) => ctx.reply(data));
});

bot.hears('/biayalistrik_tanggal@Mneach_bot', (ctx) => {
  ctx.reply(message.exampleInputDateRequest());
});

bot.hears('/biayalistrik_bulan@Mneach_bot', (ctx) => {
  ctx.reply(message.exampleInputMonthRequest());
});

bot.hears(/\/biayalistrik_tanggal (.+)/g, (ctx) => {

  const dateRange = ctx.match[1];

  var splitDateRange = dateRange.split("-");

  var mapSplitDateRange = _.map(splitDateRange, (obj) => {
    let checkNumber = Number(obj);

    return checkNumber === 0 ? checkNumber : checkNumber || obj;
  });

  var filterNumber = _.filter(mapSplitDateRange, (data) => {
    return typeof (data) == 'number' && data > 0 && data < 32;
  });

  if (_.isEmpty(filterNumber) || filterNumber.length > 2 || filterNumber[0] > filterNumber[1]) {
    ctx.reply(message.errorInputDateRange())
  } else {
    
    var firstDate;
    var endDate;

    var firstDate = filterNumber[0].toString();

    if (filterNumber.length == 1) {
      var endDate = filterNumber[0].toString();
    } else {
      var endDate = filterNumber[1].toString();
    }

    var dataFromDB = requestData.requestDataElectricityCost(requestData.startOfDate(firstDate), requestData.endOfDate(endDate));
    dataFromDB.then((data) => ctx.reply(data));
  }
});

bot.hears(/\/biayalistrik_bulan (.+)/, (ctx) => {

  var monthRange = ctx.match[1];
  var splitMonthRange = monthRange.split('-');

  var mapInput = _.map(splitMonthRange, (obj) => {
    var output = _.chain(requestData.indoMonthName)
      .find({ 'month': obj })
      .get('numberOfMonth', 0)
      .value();

    return output
  });

  var resultMonthRange = _.compact(mapInput);

  if (mapInput.length > 2 || _.isEmpty(resultMonthRange) || splitMonthRange.length !== resultMonthRange.length) {
    ctx.reply(message.errorInputMonthRange());
  } else {
    
    var starDate;
    var endDate;

    starDate = requestData.StartDateOfMonth(resultMonthRange[0]);

    if (resultMonthRange.length === 1) {
      endDate = requestData.endDateOfMonth(resultMonthRange[0]);
    } else {
      endDate = requestData.endDateOfMonth(resultMonthRange[1]);
    }
    let dataFromDB = requestData.requestDataElectricityCost(starDate, endDate);
    dataFromDB.then((data) => ctx.reply(data));
  }
});

bot.hears(/\/log/, (ctx) => {
  ctx.reply(message.log());
});

bot.hears(/\/version/, (ctx) => {
  ctx.reply(message.version());
});


cron.schedule('00 00 * * *', () => {
  var dataFromDB = requestData.requestDataElectricityCost(requestData.startOfMonth, requestData.endOfMonth);
  dataFromDB.then((data) => bot.telegram.sendMessage(requestData.CHATID_GROUP_FAMS,data));

}, {
  timezone: 'Asia/Jakarta'
});

cron.schedule('01 00 * * *', () => {

  var dataFromDB = requestData.requestDataElectricityCost(requestData.subtractOneDay, requestData.endOfMonth);
  dataFromDB.then((data) => bot.telegram.sendMessage(requestData.CHATID_GROUP_FAMS,`*ELECTRICITY COST YESTERDAY*
${data}`));

}, {
  timezone: 'Asia/Jakarta'
});

bot.launch();