const exec = require('child_process').exec;
const fs = require('fs');
const request = require('request');
const ethers = require('ethers');

const download = (url, path) => {
    return new Promise((callback) => {
        request(url).pipe(fs.createWriteStream(path)).on('finish', callback);
    });
};

const cmd = (command, callback = () => {}) => {
    exec(command, (error) => {
        if (error) {
            console.log(error);
        } else {
            callback();
        }
    });
};

const toBigNumber = (stringNumber, decimals = 18) => {
    return ethers.utils.parseUnits(stringNumber, decimals);
};

module.exports = {
    cmd,
    download,
    toBigNumber,
};
