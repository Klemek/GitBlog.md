const fs = require('fs');
const path = require('path');
const showdown = require('showdown');

module.exports = (config) => {
    const converter = new showdown.Converter(config['showdown']);

    /**
     * get parts outside of codes/scripts
     * @param {string} data
     * @returns {{index:number, end:number, text:string}[]} parts
     */
    const getParts = (data) => {
        let parts = [];
        let match;
        let i = 0;
        while ((match = /```/m.exec(data.slice(i)))) {
            parts.push({
                index: i,
                text: data.slice(i, i + match.index),
            });
            i += match.index + match[0].length;
        }
        if (i < data.length) {
            parts.push({
                index: i,
                text: data.slice(i, data.length),
            });
        }

        parts = parts.filter((p, i) => i % 2 === 0); //filter out code parts

        // detect scripts outside of code
        parts.forEach((p, pi) => {
            let i = 0;
            const subParts = [];
            while ((match = /(<script>((?:(?!<\/script>)[\s\S])*)<\/script>)/gm.exec(p.text.slice(i)))) {
                subParts.push({
                    index: p.index + i,
                    text: p.text.slice(i, i + match.index),
                });
                i += match.index + match[0].length;
            }
            if (i < p.text.length) {
                subParts.push({
                    index: p.index + i,
                    text: p.text.slice(i, p.text.length),
                });
            }
            parts.splice(pi, 1, ...subParts);
        });

        parts.forEach(part => part.end = part.index + part.text.length);

        return parts;
    };

    const renderShowDown = (data, cb) => {
        const html = converter.makeHtml(data);
        cb(html);
    };

    let Prism;
    if (config['modules']['prism']) {
        Prism = require('node-prismjs');
    }

    const renderPrism = (data, cb) => {
        if (!config['modules']['prism']) {
            cb(data);
        } else {
            const codeRegex = /```([\w-]+)\r?\n((?:(?!```)[\s\S])*)\r?\n```/m;
            let match;
            while ((match = codeRegex.exec(data))) {
                const lang = match[1].trim();
                const code = match[2].trim();
                const block = Prism.highlight(code, Prism.languages[lang] || Prism.languages.autoit, lang);
                data = data.slice(0, match.index) + `<pre><code class="${lang} language-${lang}">` + block + '</code></pre>' + data.slice(match.index + match[0].length);
            }
            cb(data);
        }
    };

    if (config['modules']['plantuml']) {
        require('./script_loader')(path.join(__dirname, 'lib', 'plantuml_synchro.js'));
    }

    const renderPlantUML = (data, cb) => {
        /* global encode64 */
        if (!config['modules']['plantuml']) {
            cb(data);
        } else {
            const parts = getParts(data);
            const umlRegex = /@startuml\r?\n((?:(?!@enduml)[\s\S])*)\r?\n@enduml/m;
            let match;
            parts.forEach(part => {
                while ((match = umlRegex.exec(part.text))) {
                    const code = match[1].trim();
                    const s = unescape(encodeURIComponent(code));
                    const compressed = global['zip_deflate'](s);
                    const url = `http://www.plantuml.com/plantuml/${config['plantuml']['output_format']}/${encode64(compressed)}`;
                    part.text = part.text.slice(0, match.index) + `<img alt="generated PlantUML diagram" src="${url}">` + part.text.slice(match.index + match[0].length);
                }
                data = data.slice(0, part.index) + part.text + data.slice(part.end);
            });
            cb(data);
        }
    };

    let mjAPI;
    if (config['modules']['mathjax']) {
        mjAPI = require('mathjax-node');
        mjAPI.config({
            MathJax: {
                tex2jax: {
                    inlineMath: [
                        [
                            '$',
                            '$',
                        ],
                    ],
                    displayMath: [
                        [
                            '$$',
                            '$$',
                        ],
                    ],
                },
            },
        });
    }

    const renderMathJax = (data, cb) => {
        if (!config['modules']['mathjax']) {
            cb(data);
        } else {
            const parts = getParts(data);

            const doMJ = (match, format, i) => {
                const eq = match[1].trim();
                const output = config['mathjax']['output_format'];
                const mjConf = {
                    math: eq,
                    format: format,
                    speakText: config['mathjax']['speak_text'],
                };
                mjConf[output] = true;
                mjAPI.typeset(mjConf, (res) => {
                    data = data.slice(0, parts[i].index + match.index) + res[output] + data.slice(parts[i].index + match.index + match[0].length);
                    renderMathJax(data, (data2) => {
                        cb(data2);
                    });
                });
            };

            const eqRegex = /\$\$((?:(?!\$\$)[\s\S])*)\$\$/m;
            const inlineEqRegex = /\$([^$\n]*)\$/;

            let found = false;
            for (let i = 0; i < parts.length; i++) {
                let match;
                if ((match = eqRegex.exec(parts[i].text))) {
                    doMJ(match, 'TeX', i);
                    found = true;
                    break;
                } else if ((match = inlineEqRegex.exec(parts[i].text))) {
                    doMJ(match, 'inline-TeX', i);
                    found = true;
                    break;
                }
            }
            if (!found) {
                cb(data);
            }
        }
    };

    let faDiagrams;
    let toml;
    if (config['modules']['fa-diagrams']) {
        faDiagrams = require('fa-diagrams');
        toml = require('@iarna/toml');
    }

    const renderFaDiagrams = (data, cb) => {
        if (!config['modules']['fa-diagrams']) {
            cb(data);
        } else {
            const parts = getParts(data);
            const diagramsRegex = /@startfad\r?\n((?:(?!@endfad)[\s\S])*)\r?\n@endfad/m;
            let match;
            parts.forEach(part => {
                while ((match = diagramsRegex.exec(part.text))) {
                    const code = match[1].trim();
                    let output;
                    try {
                        const diagData = toml.parse(code);
                        const findLineBreaks = (data) => {
                            Object.keys(data).forEach(key => {
                                if (typeof data[key] === 'object') {
                                    findLineBreaks(data[key]);
                                } else if (typeof data[key] === 'string') {
                                    data[key] = data[key].replace(/\\n/gm, '\n');
                                }
                            });
                        };
                        findLineBreaks(diagData);
                        output = faDiagrams.compute(diagData);
                    } catch (err) {
                        output = `<b style="color:red">${err.toString()}</b>`;
                    }
                    part.text = part.text.slice(0, match.index) + output + part.text.slice(match.index + match[0].length);
                }
                data = data.slice(0, part.index) + part.text + data.slice(part.end);
            });
            cb(data);
        }
    };

    return {
        getParts: config['test'] ? getParts : undefined,
        renderShowDown: config['test'] ? renderShowDown : undefined,
        renderPrism: config['test'] ? renderPrism : undefined,
        renderPlantUML: config['test'] ? renderPlantUML : undefined,
        renderMathJax: config['test'] ? renderMathJax : undefined,
        renderFaDiagrams: config['test'] ? renderFaDiagrams : undefined,
        render: (file, cb) => {
            fs.readFile(file, { encoding: 'UTF-8' }, (err, data) => {
                if (err) {
                    cb(err);
                } else {
                    renderPlantUML(data, (data) => {
                        renderFaDiagrams(data, (data) => {
                            renderMathJax(data, (data) => {
                                renderPrism(data, (data) => {
                                    renderShowDown(data, (html) => {
                                        cb(null, html);
                                    });
                                });
                            });
                        });
                    });
                }
            });
        },
    };
};

