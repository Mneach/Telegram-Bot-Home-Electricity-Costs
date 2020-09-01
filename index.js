process.env["NTBA_FIX_319"] = 1;

const TelegramBot = require('node-telegram-bot-api');
const Bluebird = require('bluebird');
const _ = require('lodash');
const superagent = Bluebird.promisifyAll(require('superagent'));
const moment = require('moment');
const momentTimezone = require('moment-timezone');
const currencyFormat = require('./currency format');

Bluebird.config({
    cancellation : true,
});

const startOfMonth = moment().tz("Asia/Jakarta").startOf('month').format('YYYY-MM-DD');
const endOfMonth   = moment().tz("Asia/Jakarta").endOf('month').format('YYYY-MM-DD');

console.log(startOfMonth);
console.log(endOfMonth);
const oneDay = 10 * 60 * 1000;

// Fams Bot Token = '1262884841:AAFowIrtxd0WbNjn2sQQWocfnPe8l2rw_oA'
// Mneach bot Token = '1208385308:AAHWfx0KuGvCobXwIhx9xs2Wvg2-Tp5nDDQ';
const token ='1208385308:AAHWfx0KuGvCobXwIhx9xs2Wvg2-Tp5nDDQ';

const electricityMapper = (obj) => {
  const currentRoomCost = _.chain(obj)
    .get('values')
    .sumBy('1')
    .value();

  return {
    location: obj.tags.location,
    cost: currentRoomCost,
  }
}

const mutatorByLocation = {
  "Yuda's Bedroom": ({ roomUsage, roomUsages }) => {
    const coffeeShopCost = _.chain(roomUsages)
      .find({ location: 'Coffee Shop' })
      .get('cost', 0)
      .value();
      
    return {
      ...roomUsage,
      cost: roomUsage.cost - coffeeShopCost,
    }
  },
};

const mutateUsageByLocation = ({ roomUsage, roomEnergyUsages }) => {
  const mutator = _.get(mutatorByLocation, roomUsage.location);

  if (mutator) {
      return mutator({ roomUsage, roomUsages: roomEnergyUsages });
  }

  return roomUsage;
}
      //Bot Telegram
const bot = new TelegramBot(token , {polling : true});

bot.onText(/\/biayalistrik/,function(msg){ 

  (async () => {
  try {
    const response = await superagent
      .get(`http://192.168.1.200:8086/query?pretty=true&db=home&q=SELECT mean("usage")/1000 * 1500 FROM "electricity" 
      WHERE time >='${startOfMonth}' AND time <= '${endOfMonth}' GROUP BY time(1h) , "location" fill(0) tz('Asia/Jakarta')`)
      .set('Accept', 'application/json')
      .endAsync()
      .then(response => {
        return _.chain(response)
          .get('body.results')
          .first()
          .get('series')
          .value();
      });
      console.log(JSON.stringify(response, null, 2));
      const roomEnergyUsages = _.map(response, electricityMapper);

      const modifiedRoomEnergyUsages = _.map(
        roomEnergyUsages,
        (roomUsage) => mutateUsageByLocation({ roomUsage, roomEnergyUsages })
      );

      const totalElectricityCost = _.sumBy(modifiedRoomEnergyUsages , 'cost');

      const resultInString = _.chain(modifiedRoomEnergyUsages)
      .map(roomUsage => (`${roomUsage.location}: ${currencyFormat.formatRupiah(roomUsage.cost)}`))
      .concat(`Total cost: ${currencyFormat.formatRupiah(totalElectricityCost)}`)
      .join('\n')
      .value();

      var chatId = msg.chat.id;
      var fromId = msg.from.id;
      console.log(fromId);
      bot.sendMessage(chatId, resultInString);
      
      if(fromId) {
        setInterval(() => {
          bot.sendMessage(fromId, resultInString);
          },oneDay); 
        }

    } catch(error) {
      console.log(error.stack || error);
      }
  })()
 }); 