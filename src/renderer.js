const fs = require('fs');
const showdown = require('showdown');

module.exports = (config) => {
  const converter = new showdown.Converter(config['showdown']);
  return {
    render: (file, cb) => {
      fs.readFile(file, {encoding: 'UTF-8'}, (err, data) => {
        if (err)
          return cb(err);
        const html = converter.makeHtml(data);
        cb(null, html);
      });
    }
  };
};