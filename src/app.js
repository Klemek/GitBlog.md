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
    const renderer = require('./renderer')(config);

    // set view engine from configuration
    app.set('view engine', config['view_engine']);
    // reroute the views folder to the root folder
    app.set('views', path.join(__dirname, '..'));

    const articles = {};

    /**
     * Fetch articles from the data folder and send success as a response
     * @param callback
     */
    const reload = (callback) => {
        fw.fetchArticles((err, dict) => {
            if (err) {
                callback(false);
                return console.error(cons.error, 'loading articles : ' + err);
            }
            Object.keys(articles).forEach((key) => delete articles[key]);
            Object.keys(dict).forEach((key) => articles[key] = dict[key]);
            const nb = Object.keys(articles).length;
            if (nb > 0)
                console.log(cons.ok, `loaded ${nb} article${nb > 1 ? 's' : ''}`);
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
     * @param vPath - path of the view
     * @param data - data to pass to the view
     * @param code - code to send along the page
     */
    const render = (res, vPath, data, code = 200) => {
        res.render(vPath, data, (err, html) => {
            if (err) {
                res.sendStatus(500);
                console.log(cons.error, `failed to render ${vPath} : ${err}`);
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
        const homePath = path.join(config['data_dir'], config['home']['index']);
        fs.access(homePath, fs.constants.R_OK, (err) => {
            if (err)
                showError(req.path, 404, res);
            else
                render(res, homePath, {articles: Object.values(articles)});
        });
    });

    // catch all article urls and render them
    app.get('*', (req, res, next) => {
        if (/^\/\d{4}\/\d{2}\/\d{2}\/(\w*\/)?$/.test(req.path)) {
            const articlePath = req.path.substr(1, 10);
            const article = articles[articlePath];
            if (!article)
                showError(req.path, 404, res);
            else {
                renderer.render(path.join(article.realPath, config['article']['index']), (err, html) => {
                    if (err) {
                        console.log(cons.error, `failed to render article ${req.path} : ${err}`);
                        return showError(req.path, 500, res);
                    }
                    article.content = html;
                    const templatePath = path.join(config['data_dir'], config['article']['template']);
                    fs.access(templatePath, fs.constants.R_OK, (err) => {
                        if (err) {
                            console.log(cons.error, `no template found at ${templatePath}`);
                            showError(req.path, 500, res);
                        } else
                            render(res, templatePath, {article: article});
                    });
                });
            }
        } else {
            next();
        }
    });

    // catch all hidden file type and return 404
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

    app.use((err, req, res, next) => {
        console.log(cons.error, `error when handling ${req.path} request : ${err}`);
        console.error(err.stack);
        next(err);
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


