const refConfig = require('./config.default.json');
const fs = require('fs');

const merge = function (ref, src) {
    if (typeof ref !== typeof src) {
        return ref;
    } else if (typeof ref === 'object') {
        const out = {};
        Object.keys(ref).forEach(key => out[key] = merge(ref[key], src[key]));
        return out;
    } else {
        return src;
    }
};

module.exports = function () {
    try {
        let configData = fs.readFileSync('./config.json');
        let config = JSON.parse(configData);
        return merge(refConfig, config);
    } catch (error) {
        console.error('Failed to load config.json : '+error);
        return refConfig;
    }
};