const refConfig = require('./default_config.json');
const srcConfig = require('../config.json');

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

module.exports = merge(refConfig, srcConfig);