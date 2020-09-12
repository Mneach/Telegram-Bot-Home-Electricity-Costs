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
const Telegraf  = require('telegraf');

Bluebird.config({
  cancellation: true,
});

const bot = new Telegraf(requestData.TOKEN_FAMS);

bot.help((ctx) => {
  ctx.reply(message.help());
});

bot.hears('/biayalistrik', (ctx) => {

  const dataFromDB = requestData.requestDataElectricityCost(requestData.startOfMonth, requestData.endOfMonth);
  dataFromDB.then((data) => ctx.reply(data));
});

bot.hears(/\/biayalistrik-tanggal (.+)/g, (ctx) => {

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

    var firstDate = filterNumber[0].toString();
    var endDate = filterNumber[1].toString();

    if (firstDate.length == 1) {
      firstDate = "0" + firstDate;
    }

    if (endDate.length == 1) {
      endDate = "0" + endDate;
    }

    var dataFromDB = requestData.requestDataElectricityCost(requestData.startOfDate(firstDate), requestData.endOfDate(endDate));
    dataFromDB.then((data) => ctx.reply(data));
  }
});

bot.hears(/\/biayalistrik-bulan (.+)/, (ctx) => {

  var monthRange = ctx.match[1];
  var splitMonthRange = monthRange.split('-');

  var mapInput = _.map(splitMonthRange, (obj) => {
    var output = _.chain(requestData.indoMonthName)
      .find({ 'month': obj })
      .get('numberOfMonth', 0)
      .value();

    return output
  });

  var compact = _.compact(mapInput);

  if (mapInput.length > 2 || _.isEmpty(compact) || splitMonthRange.length !== compact.length) {
    ctx.reply(message.errorInputMonthRange());
  } else {
    if (compact.length === 1) {
      var starDate = moment([2020, compact[0] - 1]).startOf('month').format('YYYY-MM-DD');
      var endDate = moment([2020, compact[0] - 1]).endOf('month').format('YYYY-MM-DD');
    } else {
      var starDate = moment([2020, compact[0] - 1]).startOf('month').format('YYYY-MM-DD');
      var endDate = moment([2020, compact[1] - 1]).endOf('month').format('YYYY-MM-DD');
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

bot.launch();