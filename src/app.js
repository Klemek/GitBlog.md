const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');

/**
 * Terminal colors and symbols to display status messages
 * @type {{warn: string, ok: string, error: string}}
 */
const cons = {
    ok: '\x1b[32m✔\x1b[0m %s',
    warn: '\x1b[33m⚠\x1b[0m %s',
    error: '\x1b[31m✘\x1b[0m %s',
};

module.exports = (config) => {
    const fw = require('./file_walker')(config);

    // set view engine from configuration
    app.set('view engine', config['view_engine']);
    // reroute the views folder to the root folder
    app.set('views', path.join(__dirname, '..'));

    const articles = [];

    /**
     * Fetch articles from the data folder and send success as a response
     * @param callback
     */
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
    if (config['test'])
        app.reload = reload;

    /**
     * Render the page with the view engine and catch errors
     * @param res
     * @param path - path of the view
     * @param data - data to pass to the view
     * @param code - code to send along the page
     */
    const render = (res, path, data, code = 200) => {
        res.render(path, data, (err, html) => {
            if (err) {
                res.sendStatus(500);
                console.log(cons.error, `failed to render ${path} : ${err}`);
            } else
                res.status(code).send(html);
        });
    };

    /**
     * Show an error with the correct page
     * @param resPath - the page of the original error
     * @param code - error code
     * @param res
     */
    const showError = (resPath, code, res) => {
        const errorPath = path.join(config['data_dir'], config['home']['error']);
        fs.access(errorPath, fs.constants.R_OK, (err) => {
            if (err)
                res.sendStatus(code);
            else
                render(res, errorPath, {error: code, path: resPath}, code);
        });
    };

    // home endpoint : send the correct index page or error if not existing
    app.get('/', (req, res) => {
        const homePath = `${config['data_dir']}/${config['home']['index']}`;
        fs.access(homePath, fs.constants.R_OK, (err) => {
            if (err)
                showError(req.path, 404, res);
            else
                render(res, homePath, {articles: articles});
        });
    });

    // catch all gets and return 404 if it's an hidden file type
    app.get('*', (req, res, next) => {
        if (config['home']['hidden'].includes(path.extname(req.path)))
            showError(req.path, 404, res);
        else
            next();
    });

    // serve all static files via get
    app.get('*', express.static(config['data_dir']));
    // catch express.static errors (mostly not found) by displaying 404
    app.get('*', (req, res) => {
        showError(req.path, 404, res);
    });

    // catch all other methods and return 400
    app.all('*', (req, res) => {
        res.status(400).send('bad request');
    });

    // must be use in a server.js to start the server
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


