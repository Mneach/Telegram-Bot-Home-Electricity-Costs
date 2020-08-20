//Rupiah 
const _ = require('lodash');

const thousandSeparatorRegex = /\B(?=(\d{3})+(?!\d))/g;

exports.formatRupiah = (number, prefix, round) => {
    if (_.isNil(number)) {
      return '';
    }
  
    if (!_.isNull(round)) {
      round = Math.pow(10, round || 0);
      number = Math.ceil(Number(number) / round) * round;
    }
  
    if (_.isUndefined(prefix) || _.isNull(prefix)) {
      prefix = 'Rp ';
    }

    return prefix + number.toFixed(0)
      .toString()
      .replace(thousandSeparatorRegex, '.'); 
  };