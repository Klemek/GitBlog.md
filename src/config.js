const refConfig = require('./config.default.json');
const fs = require('fs');

/**
 * Merge resources by reading object keys and keeping reference value only if it's type is different from the source
 * @param ref - reference object/value
 * @param src - source object/value
 * @returns {*}
 */
const merge = (ref, src) => {
  if (typeof ref !== typeof src) {
    return ref;
  } else if (ref.length && !src.length) {
    return ref;
  } else if (ref.length && src.length) {
    return src;
  } else if (typeof ref === 'object') {
    const out = {};
    Object.keys(ref).forEach((key) => out[key] = merge(ref[key], src[key]));
    return out;
  } else {
    return src;
  }
};

module.exports = () => {
  try {
    let configData = fs.readFileSync('config.json', {encoding: 'UTF-8'});
    let config = JSON.parse(configData);
    return merge(refConfig, config);
  } catch (error) {
    console.log('\x1b[33m⚠\x1b[0m %s', 'Failed to load config.json : ' + error);
    return refConfig;
  }
};