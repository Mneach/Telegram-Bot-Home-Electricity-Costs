const fs = require('fs');

exports.version = () => {
    var message = "Bot Electrycity Cost Version 0.8";

    return message;
}

exports.log = () => {
    try {
        var data = fs.readFileSync('log.txt', 'utf-8');
        return data;
    } catch (e) {
        return e.stack;
    }
}

exports.help = () => {
    var message = `/help -> request for see all command
/log -> request for see log update
/version -> request for see version bot
/biayalistrik -> request for check electricity cost until now (from first date of month)

/biayalistrik-tanggal -> request for check electricity cost by date
example input : /biayalistrik_tanggal 12-17

/biayalistrik-bulan -> request for check electricity cost by month
example input : /biayalistrik_bulan januari-oktober`;

    return message;
}

exports.exampleInputDateRequest = () => {
    var message = `example input : /biayalistrik_tanggal 12-17`

    return message;
}

exports.exampleInputMonthRequest = () => {
    var message = `example input : /biayalistrik_bulan januari-oktober`

    return message;
}

exports.errorInputDateRange = () => {
    var message = `Wrong Input Date Range!
rules : 
first date < last date
input date range must be between 1-31
    
example input : /biayalistrik_tanggal 12-17`;

    return message;
};

exports.errorInputMonthRange = () => {
    var message = `Wrong Input Month Range!
rules : 
first month < last month
input must be the name of the month Indonesian 

example input : /biayalistrik_bulan januari-oktober`;

    return message;
};

exports.errorRequestMonth = () => {
    var message = "error";

    return message;
}