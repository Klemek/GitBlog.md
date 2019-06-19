const refConfig = require('./default_config.json');
const fs = require('fs');

const merge = function (ref, src) {
    if (typeof ref !== typeof src) {
        console.log(ref, src, ref);
        return ref;
    } else if (typeof ref === 'object') {
        const out = {};
        Object.keys(ref).forEach(key => out[key] = merge(ref[key], src[key]));
        return out;
    } else {
        console.log(ref, src, src);
        return src;
    }
};

module.exports = function () {
    try {
        let configData = fs.readFileSync('./config.json');
        let config = JSON.parse(configData);
        return merge(refConfig, config);
    } catch (error) {
        console.error('Failed to load config.json');
        return refConfig;
    }
};