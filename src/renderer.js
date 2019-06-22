const fs = require('fs');
const showdown = require('showdown');

module.exports = (config) => {
  const converter = new showdown.Converter(config['showdown']);

  const renderShowDown = (data, cb) => {
    const html = converter.makeHtml(data);
    cb(html);
  };

  let Prism;
  if (config['modules']['prism'])
    Prism = require('node-prismjs');

  const renderPrism = (data, cb) => {
    if (!config['modules']['prism'])
      return cb(data);
    const codeRegex = /```([\w-]+)\r?\n((?:(?!```)[\s\S])*)\r?\n```/m;
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
    cb(data);
  };

  let mjAPI;
  if (config['modules']['mathjax']) {
    mjAPI = require('mathjax-node');
    mjAPI.config({
      MathJax: {
        tex2jax: {
          inlineMath: [['$', '$']],
          displayMath: [['$$', '$$']]
        }
      }
    });
  }

  const renderMathJax = (data, cb) => {
    if (!config['modules']['mathjax'])
      return cb(data);

    const doMJ = (match, format) => {
      const eq = match[1].trim();
      const output = config['mathjax']['output_format'];
      const mjConf = {
        math: eq,
        format: format,
        speakText: config['mathjax']['speak_text']
      };
      mjConf[output] = true;
      mjAPI.typeset(mjConf, (res) => {
        data = data.slice(0, match.index) + res[output] + data.slice(match.index + match[0].length);
        renderMathJax(data, (data2) => {
          cb(data2);
        });
      });
    };

    const eqRegex = /\$\$((?:(?!\$\$)[\s\S])*)\$\$/m;
    const inlineEqRegex = /\$([^$]*)\$/;

    let match;
    if ((match = eqRegex.exec(data))) {
      doMJ(match, 'TeX');
    } else if ((match = inlineEqRegex.exec(data))) {
      doMJ(match, 'inline-TeX');
    } else {
      cb(data);
    }
  };

  return {
    renderShowDown: config['test'] ? renderShowDown : undefined,
    renderPrism: config['test'] ? renderPrism : undefined,
    renderMathJax: config['test'] ? renderMathJax : undefined,
    render: (file, cb) => {
      fs.readFile(file, {encoding: 'UTF-8'}, (err, data) => {
        if (err)
          return cb(err);

        renderPrism(data, (data2) => {
          renderMathJax(data2, (data3) => {
            renderShowDown(data3, (html) => {
              cb(null, html);
            });
          });
        });
      });
    }
  };
};

