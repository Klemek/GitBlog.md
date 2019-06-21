const fs = require('fs');
const showdown = require('showdown');
const Prism = require('node-prismjs');

module.exports = (config) => {
  const converter = new showdown.Converter(config['showdown']);
  return {
    render: (file, cb) => {
      fs.readFile(file, {encoding: 'UTF-8'}, (err, data) => {
        if (err)
          return cb(err);

        if (config['modules']['prism']) {
          const codeRegex = /```([\w-]+)\n((?:(?!```)[\s\S])*)\n```/m;
          let match;
          while ((match = codeRegex.exec(data))) {
            const lang = match[1].trim();
            const code = match[2].trim();
            try {
              const block = Prism.highlight(code, Prism.languages[lang] || Prism.languages.autoit, lang);
              data = data.slice(0, match.index) + `<pre><code class="${lang} language-${lang}">` + block + '</code></pre>' + data.slice(match.index + match[0].length);
            } catch (err) {
              console.error(err);
            }
          }
        }


        const html = converter.makeHtml(data);


        cb(null, html);
      });
    }
  };
};

