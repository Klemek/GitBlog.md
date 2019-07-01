const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');
const pjson = require('../package.json');

app.enable('trust proxy');

//rss
const Rss = require('rss');

///webhook
const bodyParser = require('body-parser');
const crypto = require('crypto');
const cp = require('child_process');
app.use(bodyParser.json());

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
  /**
   * Fetch articles from the data folder and send success as a response
   * @param success
   * @param error
   */
  let reload;
  /**
   * Render the page with the view engine and catch errors
   * @param req
   * @param res
   * @param vPath - path of the view
   * @param data - data to pass to the view
   * @param code - code to send along the page
   */
  let render;
  /**
   * Show an error with the correct page
   * @param req
   * @param res
   * @param code - error code
   */
  let showError;
  const fw = require('./file_walker')(config);
  const renderer = require('./renderer')(config);

  // set view engine from configuration
  app.set('view engine', config['view_engine']);
  // reroute the views folder to the root folder
  app.set('views', path.join(__dirname, '..'));

  const articles = {};
  let lastRSS = '';
  let host = config['host'];

  reload = (success, error) => {
    fw.fetchArticles((err, dict) => {
      if (err) {
        console.error(cons.error, 'error loading articles : ' + err);
        return error ? error() : null;
      }
      Object.keys(articles).forEach((key) => delete articles[key]);
      Object.keys(dict).forEach((key) => articles[key] = dict[key]);
      const nb = Object.keys(articles).length;
      if (nb > 0)
        console.log(cons.ok, `loaded ${nb} article${nb > 1 ? 's' : ''}`);
      else
        console.log(cons.warn, `no articles loaded, check your configuration`);

      lastRSS = '';

      success();
    });
  };
  if (config['test'])
    app.reload = reload;

  render = (req, res, vPath, data, code = 200) => {
    data.info = {
      title: config['home']['title'],
      description: config['home']['description'],
      host: host,
      version: pjson.version,
      request: req,
      config: config
    };
    res.render(vPath, data, (err, html) => {
      if (err && vPath !== path.join(config['data_dir'], config['home']['error'])) {
        console.log(cons.error, `failed to render page ${vPath} : ${err}`);
        showError(req, res, 500);
      } else if (err) {
        res.sendStatus(500);
        console.log(cons.error, `failed to render error page : ${err}`);
      } else
        res.status(code).send(html);
    });
  };

  showError = (req, res, code) => {
    const errorPath = path.join(config['data_dir'], config['home']['error']);
    fs.access(errorPath, fs.constants.R_OK, (err) => {
      if (err)
        res.sendStatus(code);
      else
        render(req, res, errorPath, {error: code}, code);
    });
  };

  app.use((req, res, next) => {
    if (!host) {
      host = 'http://' + req.headers.host;
      console.log(cons.ok, 'Currently hosted on ' + host);
    }
    next();
  });

  //log request at result end
  app.use((req, res, next) => {
    if (config['access_log']) {
      const end = res.end;
      res.end = (chunk, encoding) => {
        fs.appendFile(config['access_log'],
          `${res.statusCode} ${req.method} ${req.url} ${new Date().toUTCString()} ${req.ips.join(' ') || req.ip}\n`,
          {encoding: 'UTF-8'}, () => {
            res.end = end;
            res.end(chunk, encoding);
          });
      };
    }
    next();
  });

  // home endpoint : send the correct index page or error if not existing
  app.get('/', (req, res) => {
    const homePath = path.join(config['data_dir'], config['home']['index']);
    fs.access(homePath, fs.constants.R_OK, (err) => {
      if (err)
        showError(req, res, 404);
      else
        render(req, res, homePath,
          {
            articles: Object.values(articles)
              .filter(d => !d.draft).sort((a, b) => ('' + b.path).localeCompare(a.path))
          });
    });
  });

  //RSS endpoint
  app.get(config['rss']['endpoint'], (req, res) => {
    if (config['modules']['rss']) {
      if (!lastRSS) {
        const feed = new Rss({
          'title': config['rss']['title'],
          'description': config['rss']['description'],
          'feed_url': host + req.url,
          'site_url': host
        });
        Object.values(articles)
          .slice(0, config['rss']['length'])
          .forEach((article) => {
            feed.item({
              title: article.title,
              url: host + article.url,
              date: article.date
            });
          });
        lastRSS = feed.xml();
      }
      res.type(req.headers['user-agent'].match(/Mozilla/) ? 'text/xml' : 'rss').send(lastRSS);
    } else {
      showError(req, res, 404);
    }
  });

  //webhook endpoint
  app.post(config['webhook']['endpoint'], (req, res) => {
    if (config['modules']['webhook']) {
      if (config['webhook']['signature_header'] && config['webhook']['secret']) {
        const payload = JSON.stringify(req.body) || '';
        const hmac = crypto.createHmac('sha1', config['webhook']['secret']);
        const digest = 'sha1=' + hmac.update(payload).digest('hex');
        const checksum = req.headers[config['webhook']['signature_header']];
        if (!checksum || !digest || checksum !== digest) {
          return res.sendStatus(403);
        }
      }
      cp.exec(config['webhook']['pull_command'], {cwd: path.join(__dirname, '..', config['data_dir'])}, (err) => {
        if (err) {
          console.log(cons.error, `command '${config['webhook']['pull_command']}' failed : ${err}`);
          return res.sendStatus(500);
        }
        reload(() => {
          res.sendStatus(200);
        });
      });
    } else {
      res.sendStatus(400);
    }
  });

  //rewrite urls to hide articles titles : /2019/05/05/sometitle/img.png => /2019/05/05/img.png
  app.use((req, res, next) => {
    if (/^\/\d{4}\/\d{2}\/\d{2}\//.test(req.url))
      req.url = req.url.slice(0, 11) + req.url.slice(req.url.lastIndexOf('/'));
    next();
  });

  // catch all article urls and render them
  app.get('*', (req, res, next) => {
    if (/^\/\d{4}\/\d{2}\/\d{2}\/$/.test(req.path)) {
      const articlePath = req.path.substr(1, 10);
      const article = articles[articlePath];
      if (!article)
        showError(req, res, 404);
      else {
        renderer.render(path.join(article.realPath, config['article']['index']), (err, html) => {
          if (err) {
            console.log(cons.error, `failed to render article ${req.path} : ${err}`);
            return showError(req, res, 500);
          }
          article.content = html;
          const templatePath = path.join(config['data_dir'], config['article']['template']);
          fs.access(templatePath, fs.constants.R_OK, (err) => {
            if (err) {
              console.log(cons.error, `no template found at ${templatePath}`);
              showError(req, res, 500);
            } else
              render(req, res, templatePath, {article: article});
          });
        });
      }
    } else {
      next();
    }
  });

  // catch all hidden file type and return 404
  config['home']['hidden'].forEach(pathMatcher => {
    app.get(pathMatcher, (req, res) => {
      showError(req, res, 404);
    });
  });

  // serve all static files via get
  app.get('*', express.static(path.join(__dirname, '..', config['data_dir'])));
  // catch express.static errors (mostly not found) by displaying 404
  app.get('*', (req, res) => {
    showError(req, res, 404);
  });

  // catch all other methods and return 400
  app.all('*', (req, res) => {
    res.status(400).send('bad request');
  });

  //log all server errors
  app.use((err, req, res, next) => {
    console.log(cons.error, `error when handling ${req.method} ${req.path} request : ${err}`);
    if (!config['error_log'])
      next(err);
    fs.appendFile(config['error_log'],
      `500 ${req.method} ${req.url} ${new Date().toUTCString()} ${req.ips.join(' ') || req.ip}\n${err.stack}\n`,
      {encoding: 'UTF-8'}, () => {
        next(err);
      });
  });

  // must be use in a server.js to start the server
  app.start = () => {
    reload(() => {
      app.listen(config['node_port'], () => {
        console.log(cons.ok, `gitblog.md server listening on port ${config['node_port']}`);
      });
    });
  };

  return app;
};


