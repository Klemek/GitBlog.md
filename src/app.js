const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');

const cons = {
    ok: '\x1b[32m✔\x1b[0m %s',
    warn: '\x1b[33m⚠\x1b[0m %s',
    error: '\x1b[31m✘\x1b[0m %s',
};

module.exports = (config) => {
    const fw = require('./file_walker')(config);

    app.set('view engine', config['view_engine']);
    app.set('views', path.join(__dirname, '..'));

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

    const render = (res, path, data, code = 200) => {
        res.render(path, data, (err, html) => {
            if (err) {
                res.sendStatus(500);
                console.log(cons.error, `failed to render ${path} : ${err}`);
            } else
                res.status(code).send(html);
        });
    };

    const showError = (resPath, code, res) => {
        const errorPath = path.join(config['data_dir'],config['home']['error']);
        if (fs.existsSync(errorPath))
            render(res, errorPath, {error: code, path: resPath}, code);
        else
            res.sendStatus(code);
    };

    app.get('/', (req, res) => {
        const homePath = `${config['data_dir']}/${config['home']['index']}`;
        if (fs.existsSync(homePath))
            render(res, homePath, {articles: articles});
        else {
            showError(req.path, 404, res);
        }
    });

    app.get('*', express.static(config['data_dir']));

    app.get('*', (req, res) => {
        showError(req.path, 404, res);
    });

    app.all('*', (req, res) => {
        res.status(400).send('bad request');
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


