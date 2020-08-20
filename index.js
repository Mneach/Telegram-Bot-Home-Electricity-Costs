process.env["NTBA_FIX_319"] = 1;

const TelegramBot = require('node-telegram-bot-api');
const Bluebird = require('bluebird');
const _ = require('lodash');
const superagent = Bluebird.promisifyAll(require('superagent'));
const moment = require('moment');
const currencyFormat = require('./currency format');

Bluebird.config({
    cancellation : true,
});

const startOfMonth = moment().startOf('month').format('YYYY-MM-DD');
const endOfMonth   = moment().endOf('month').format('YYYY-MM-DD');

// Fams Bot Token = '1262884841:AAFowIrtxd0WbNjn2sQQWocfnPe8l2rw_oA'
// Mneach bot Token = '1208385308:AAHWfx0KuGvCobXwIhx9xs2Wvg2-Tp5nDDQ';
const token = '1262884841:AAFowIrtxd0WbNjn2sQQWocfnPe8l2rw_oA';

(async () => {
    try {
    const response = await superagent
      .get(`http://192.168.1.200:8086/query?pretty=true&db=home&q=SELECT mean("usage")/1000 * 1500 FROM "electricity" 
      WHERE time >='${startOfMonth}' AND time <= '${endOfMonth}' GROUP BY time(1h), "location" fill(0)`)
      .set('Accept', 'application/json')
      .endAsync()
      .then(response => {
        return _.chain(response)
          .get('body.results')
          .first()
          .get('series')
          .value();
      });

    var sumElectricityCost = 0;
    var totalElectricityCost = 0;
    var sendResultToBot = [];
    for(var i = 0; i < response.length; i++)
    {
      for(var x = 0; x < response[i].values.length; x++)
      {
        sumElectricityCost += response[i].values[x][1];
      }
      var electricityPaymentList = response[i].tags.location + " : " + currencyFormat.formatRupiah(sumElectricityCost);
      var totalElectricityCost = totalElectricityCost + sumElectricityCost;
      sendResultToBot.push(electricityPaymentList);
  
      sumElectricityCost = 0;
    }
    sendResultToBot.push("Total Cost : " + currencyFormat.formatRupiah(totalElectricityCost));

    console.log(sendResultToBot.join("\n"));
    //Bot Telegram
    const bot = new TelegramBot(token , {polling : true});

    bot.onText(/\/biayalistrik/,function(msg,match){ 

    var chatId = msg.chat.id;
    
    bot.sendMessage(chatId, sendResultToBot.join("\n"));

    });  

  } catch(error) {
      console.log(error.stack || error);
    }
  })()
