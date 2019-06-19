const express = require('express');
const app = express();

const cons = {
    ok: '\x1b[32m✔\x1b[0m %s',
    warn: '\x1b[33m⚠\x1b[0m %s',
    error: '\x1b[31m✘\x1b[0m %s',
};

module.exports = (config) => {
    const fw = require('./file_walker')(config);

    const articles = [];

    const reload = (callback) => {
        fw.fetchArticles((err, list) => {
            if (err) {
                callback(false);
                return console.error(cons.error, 'loading articles : ' + err);
            }
            articles.splice(0, articles.length, ...list);
            if (articles.length > 0)
                console.log(cons.ok, `loaded ${articles.length} article${articles.length > 1 ? 's' : ''}`);
            else
                console.log(cons.warn, `no articles loaded, check your configuration`);
            callback(true);
        });
    };

    app.get('/', (req, res) => {
        res.status(200).send('Hello World!');
    });

    app.start = () => {
        reload((res) => {
            if (res)
                app.listen(config['node_port'], () => {
                    console.log(cons.ok, `gitblog.md server listening on port ${config['node_port']}`);
                });
        });
    };

    return app;
};


