//Rupiah 
const _ = require('lodash');

const thousandSeparatorRegex = /\B(?=(\d{3})+(?!\d))/g;

exports.formatRupiah = (number, prefix, round) => {
    if (_.isNil(number)) {
      return '';
    }
  
    if (_.isUndefined(prefix) || _.isNull(prefix)) {
      prefix = 'Rp ';
    }

    return prefix + number.toFixed(2)
      .replace('.',',')
      .toString()
      .replace(thousandSeparatorRegex, '.'); 
  };