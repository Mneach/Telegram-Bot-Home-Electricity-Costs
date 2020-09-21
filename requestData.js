process.env["NTBA_FIX_319"] = 1;

require('dotenv').config();
const Bluebird = require('bluebird');
const _ = require('lodash');
const superagent = Bluebird.promisifyAll(require('superagent'));
const currencyFormat = require('./currencyFormat');
const message = require('./message');
const moment = require('moment');
const momentTimezone = require('moment-timezone');

//TOKEN
const TOKEN_MNEACH = process.env.TOKEN_MNEACH;
const CHATID_YUDA = process.env.CHATID_YUDA;
const CHATID_GROUP_FAMS = process.env.CHATID_GROUP_FAMS;
const TOKEN_FAMS = process.env.TOKEN_FAMS;

//MOMENT JS
var getTimeNow = moment().tz("Asia/Jakarta").format('YYYY-MM-DD');
var getYear = moment().tz("Asia/Jakarta").year();
var getMonth = moment().tz("Asia/Jakarta").month();
var getDay = moment().tz("Asia/Jakarta").get('date');
module.exports.startOfMonth = moment().tz("Asia/Jakarta").startOf('month').format('YYYY-MM-DD');
module.exports.endOfMonth = moment().tz("Asia/Jakarta").endOf('month').format('YYYY-MM-DD');

module.exports.addOneDay = moment([getYear, getMonth, getDay]).add(1, 'days').format('YYYY-MM-DD')
module.exports.subtractOneDay = moment([getYear, getMonth, getDay]).subtract(1, 'days').format('YYYY-MM-DD')

module.exports.startOfDate = (firstDate) => {
  var date = moment([getYear, getMonth, firstDate]).format('YYYY-MM-DD');
  return date;
};

module.exports.endOfDate = (endDate) => {
  var date = moment([getYear, getMonth, endDate]).add(1, 'days').format('YYYY-MM-DD')
  return date;
};

module.exports.StartDateOfMonth = (month) => {
  var date = moment([getYear, month - 1]).startOf('month').format('YYYY-MM-DD');
  return date;
}

module.exports.endDateOfMonth = (month) => {
  var date = moment([getYear, month - 1]).endOf('month').format('YYYY-MM-DD');
  return date
}

//REQUST DATA FOR ELECTRICITY COST
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

var requestDataElectricityCost = async function (startTime, endTime) {
  try {
    const response = await superagent
      .get(`http://192.168.1.200:8086/query?pretty=true&db=home&q=SELECT mean("usage")/1000 * 1500 FROM "electricity" 
      WHERE time >='${startTime}' AND time <= '${endTime}' GROUP BY time(1h) , "location" fill(0) tz('Asia/Jakarta')`)
      .set('Accept', 'application/json')
      .endAsync()
      .then(response => {
        return _.chain(response)
          .get('body.results')
          .first()
          .get('series')
          .value();
      });
    const roomEnergyUsages = _.map(response, electricityMapper);

    const modifiedRoomEnergyUsages = _.map(
      roomEnergyUsages,
      (roomUsage) => mutateUsageByLocation({ roomUsage, roomEnergyUsages })
    );

    const totalElectricityCost = _.sumBy(modifiedRoomEnergyUsages, 'cost');

    const resultInString = _.chain(modifiedRoomEnergyUsages)
      .map(roomUsage => (`${roomUsage.location}: ${currencyFormat.formatRupiah(roomUsage.cost)}`))
      .concat(`Total cost: ${currencyFormat.formatRupiah(totalElectricityCost)}`)
      .join('\n')
      .value();

    return resultInString;
  } catch (error) {
    console.log(error.stack || error);
  }
}

//INDONESIA MONTH NAME
var indoMonthName = [
  { 'month': 'januari', 'numberOfMonth': 01 },
  { 'month': 'februari', 'numberOfMonth': 02 },
  { 'month': 'maret', 'numberOfMonth': 03 },
  { 'month': 'april', 'numberOfMonth': 04 },
  { 'month': 'mei', 'numberOfMonth': 05 },
  { 'month': 'juni', 'numberOfMonth': 06 },
  { 'month': 'juli', 'numberOfMonth': 07 },
  { 'month': 'agustus', 'numberOfMonth': 08 },
  { 'month': 'september', 'numberOfMonth': 09 },
  { 'month': 'oktober', 'numberOfMonth': 10 },
  { 'month': 'november', 'numberOfMonth': 11 },
  { 'month': 'desember', 'numberOfMonth': 12 }
];

//EXPORTS MODULE
module.exports.requestDataElectricityCost = requestDataElectricityCost;
module.exports.indoMonthName = indoMonthName;
module.exports.TOKEN_MNEACH = TOKEN_MNEACH;
module.exports.CHATID_YUDA = CHATID_YUDA;
module.exports.TOKEN_FAMS = TOKEN_FAMS;
module.exports.CHATID_GROUP_FAMS = CHATID_GROUP_FAMS;
module.exports.getTimeNow = getTimeNow;