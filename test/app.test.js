/* jshint -W117 */
const request = require('supertest');
const fs = require('fs');
const path = require('path');
const utils = require('./test_utils');

const dataDir = 'test_data';
const testIndex = 'testindex.ejs';
const testError = 'testerror.ejs';
const testTemplate = 'testtemplate.ejs';

const config = require('../src/config')();

config['test'] = true;
config['data_dir'] = dataDir;
config['webhook']['endpoint'] = '/webhooktest';
config['rss']['endpoint'] = '/rsstest';
config['rss']['length'] = 2;
config['home']['error'] = testError;
config['article']['template'] = testTemplate;

const app = require('../src/app')(config);

beforeEach((done, fail) => {
  config['home']['index'] = testIndex;
  config['data_dir'] = dataDir;
  config['article']['index'] = 'index.md';
  config['access_log'] = '';
  config['error_log'] = '';
  config['modules']['rss'] = true;
  config['modules']['webhook'] = true;

  utils.deleteFolderSync(dataDir);
  fs.mkdirSync(dataDir);
  app.reload(done, fail);
});

afterAll(() => {
  if (fs.existsSync(dataDir)) {
    utils.deleteFolderSync(dataDir);
  }
});

describe('Test reload', () => {
  test('reload fail', (done, fail) => {
    config['data_dir'] = '';
    app.reload(fail, done);
  });
});

describe('Test request logging', () => {
  test('test no log', (done) => {
    request(app).get('/rsstest').then(() => {
      expect(fs.existsSync(path.join(dataDir, 'access.log'))).toBe(false);
      done();
    });
  });
  test('test get 200', (done) => {
    config['access_log'] = path.join(dataDir, 'access.log');
    request(app).get('/rsstest').then(() => {
      fs.readFile(path.join(dataDir, 'access.log'), {encoding: 'UTF-8'}, (err, data) => {
        expect(err).toBeNull();
        expect(data).toBe('200 GET /rsstest ' + new Date().toUTCString() + ' ::ffff:127.0.0.1\n');
        done();
      });
    });
  });
  test('test post 400', (done) => {
    config['access_log'] = path.join(dataDir, 'access.log');
    request(app).post('/rsstest').then(() => {
      fs.readFile(path.join(dataDir, 'access.log'), {encoding: 'UTF-8'}, (err, data) => {
        expect(err).toBeNull();
        expect(data).toBe('400 POST /rsstest ' + new Date().toUTCString() + ' ::ffff:127.0.0.1\n');
        done();
      });
    });
  });
  test('test 2 requests', (done) => {
    config['access_log'] = path.join(dataDir, 'access.log');
    request(app).get('/rss').then(() => {
      request(app).post('/rsstest').then(() => {
        fs.readFile(path.join(dataDir, 'access.log'), {encoding: 'UTF-8'}, (err, data) => {
          expect(err).toBeNull();
          expect(data).toBe('404 GET /rss ' + new Date().toUTCString() + ' ::ffff:127.0.0.1\n' +
            '400 POST /rsstest ' + new Date().toUTCString() + ' ::ffff:127.0.0.1\n');
          done();
        });
      });
    });
  });
});

describe('Test error logging', () => {
  test('test no log', (done) => {
    config['home']['index'] = null;
    request(app).get('/').then(() => {
      expect(fs.existsSync(path.join(dataDir, 'error.log'))).toBe(false);
      done();
    });
  });
  test('test null error ', (done) => {
    config['home']['index'] = null;
    config['error_log'] = path.join(dataDir, 'error.log');
    request(app).get('/').then(() => {
      fs.readFile(path.join(dataDir, 'error.log'), {encoding: 'UTF-8'}, (err, data) => {
        expect(err).toBeNull();
        const start = data.split('\n').slice(0, 2).join('\n');
        const expected = '500 GET / ' + new Date().toUTCString() + ' ::ffff:127.0.0.1\nTypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string. Received type object';
        expect(start).toBe(expected);
        done();
      });
    });
  });
});

describe('Test root path', () => {
  test('404 no index no error', (done) => {
    request(app).get('/').then((response) => {
      expect(response.statusCode).toBe(404);
      done();
    });
  });
  test('404 no index but error page', (done) => {
    fs.writeFileSync(path.join(dataDir, testError), 'error <%= error %>');
    request(app).get('/').then((response) => {
      expect(response.statusCode).toBe(404);
      expect(response.text).toBe('error 404');
      done();
    });
  });
  test('500 render error', (done) => {
    fs.writeFileSync(path.join(dataDir, testIndex), 'articles <%= null.length %>');
    request(app).get('/').then((response) => {
      expect(response.statusCode).toBe(500);
      done();
    });
  });
  test('500 render error with page', (done) => {
    fs.writeFileSync(path.join(dataDir, testIndex), 'articles <%= null.length %>');
    fs.writeFileSync(path.join(dataDir, testError), 'error <%= error %>');
    request(app).get('/').then((response) => {
      expect(response.statusCode).toBe(500);
      expect(response.text).toBe('error 500');
      done();
    });
  });
  test('500 render error with failing page', (done) => {
    fs.writeFileSync(path.join(dataDir, testIndex), 'articles <%= null.length %>');
    fs.writeFileSync(path.join(dataDir, testError), 'error <%= null.error %>');
    request(app).get('/').then((response) => {
      expect(response.statusCode).toBe(500);
      done();
    });
  });
  test('200 no articles', (done) => {
    fs.writeFileSync(path.join(dataDir, testIndex), 'articles <%= articles.length %>');
    request(app).get('/').then((response) => {
      expect(response.statusCode).toBe(200);
      expect(response.text).toBe('articles 0');
      done();
    });
  });
  test('200 2 articles 1 drafted', (done, fail) => {
    utils.createEmptyDirs([
      path.join(dataDir, '2019', '05', '05'),
      path.join(dataDir, '2018', '05', '05'),
      path.join(dataDir, '2017', '05', '05')
    ]);
    utils.createEmptyFiles([
      path.join(dataDir, '2019', '05', '05', 'draft.md'),
      path.join(dataDir, '2018', '05', '05', 'index.md'),
      path.join(dataDir, '2018', '05', '05', 'draft.md'),
      path.join(dataDir, '2017', '05', '05', 'index.md'),
    ]);
    fs.writeFileSync(path.join(dataDir, testIndex), 'articles <%= articles.length %>');
    app.reload(() => {
      request(app).get('/').then((response) => {
        expect(response.statusCode).toBe(200);
        expect(response.text).toBe('articles 2');
        done();
      });
    }, fail);
  });
});

describe('Test RSS feed', () => {
  test('404 rss deactivated', (done) => {
    config['modules']['rss'] = false;
    request(app).get('/rsstest').then((response) => {
      expect(response.statusCode).toBe(404);
      done();
    });
  });
  test('200 empty rss', (done) => {
    request(app).get('/rsstest').then((response) => {
      expect(response.statusCode).toBe(200);
      expect(response.type).toBe('application/rss+xml');
      expect(response.text.length).toBeGreaterThan(0);
      expect(response.text.split('<item>').length).toBe(1);
      done();
    });
  });
  test('200 Mozilla fix', (done) => {
    request(app).get('/rsstest').set('user-agent', 'Mozilla Firefox 64.0').then((response) => {
      expect(response.statusCode).toBe(200);
      expect(response.type).toBe('text/xml');
      done();
    });
  });
  test('200 rss cache', (done) => {
    request(app).get('/rsstest').then(() => {
      request(app).get('/rsstest').then((response) => {
        expect(response.statusCode).toBe(200);
        expect(response.text.length).toBeGreaterThan(0);
        expect(response.text.split('<item>').length).toBe(1);
        done();
      });
    });
  });
  test('200 2 rss items', (done, fail) => {
    utils.createEmptyDirs([
      path.join(dataDir, '2019', '05', '05'),
      path.join(dataDir, '2018', '05', '05')
    ]);
    utils.createEmptyFiles([
      path.join(dataDir, '2019', '05', '05', 'index.md'),
      path.join(dataDir, '2018', '05', '05', 'index.md')
    ]);
    app.reload(() => {
      request(app).get('/rsstest').then((response) => {
        expect(response.statusCode).toBe(200);
        expect(response.text.length).toBeGreaterThan(0);
        expect(response.text.split('<item>').length).toBe(3);
        done();
      });
    }, fail);
  });
  test('200 max rss items', (done, fail) => {
    utils.createEmptyDirs([
      path.join(dataDir, '2019', '05', '05'),
      path.join(dataDir, '2018', '05', '05'),
      path.join(dataDir, '2017', '05', '05')
    ]);
    utils.createEmptyFiles([
      path.join(dataDir, '2019', '05', '05', 'index.md'),
      path.join(dataDir, '2018', '05', '05', 'index.md'),
      path.join(dataDir, '2017', '05', '05', 'index.md')
    ]);
    app.reload(() => {
      request(app).get('/rsstest').then((response) => {
        expect(response.statusCode).toBe(200);
        expect(response.text.length).toBeGreaterThan(0);
        expect(response.text.split('<item>').length).toBe(3);
        done();
      });
    }, fail);
  });
});

describe('Test webhook', () => {
  test('400 webhook deactivated', (done) => {
    config['modules']['webhook'] = false;
    request(app).post('/webhooktest').then((response) => {
      expect(response.statusCode).toBe(400);
      done();
    });
  });
  test('200 no secret', (done) => {
    utils.createEmptyDirs([path.join(dataDir, '2019', '05', '05'),]);
    utils.createEmptyFiles([
      path.join(dataDir, '2019', '05', '05', 'index.md'),
      path.join(dataDir, testTemplate)
    ]);
    config['webhook']['pull_command'] = 'git --help';
    request(app).post('/webhooktest').then((response) => {
      expect(response.statusCode).toBe(200);
      request(app).get('/2019/05/05/').then((response) => {
        expect(response.statusCode).toBe(200);
        done();
      });
    });
  });
  test('500 command failed', (done) => {
    utils.createEmptyDirs([path.join(dataDir, '2019', '05', '05'),]);
    utils.createEmptyFiles([
      path.join(dataDir, '2019', '05', '05', 'index.md'),
      path.join(dataDir, testTemplate)
    ]);
    config['webhook']['pull_command'] = 'qzgfqgqz';
    request(app).post('/webhooktest').then((response) => {
      expect(response.statusCode).toBe(500);
      done();
    });
  });
  test('403 wrong secret', (done) => {
    config['webhook']['signature_header'] = 'testheader';
    config['webhook']['secret'] = 'testvalue';
    request(app).post('/webhooktest').set('testheader', 'sha1=invalid').then((response) => {
      expect(response.statusCode).toBe(403);
      done();
    });
  });
  test('200 valid secret', (done) => {
    config['webhook']['signature_header'] = 'testheader';
    config['webhook']['secret'] = 'testvalue';
    config['webhook']['pull_command'] = 'git --help';
    request(app).post('/webhooktest')
      .send({})
      .set('testheader', 'sha1=d924d5bd4b36faf9d572844ac9c12a09ce3e7134')
      .then((response) => {
      expect(response.statusCode).toBe(200);
      done();
    });
  });
});

describe('Test articles rendering', () => {
  test('404 article not found', (done) => {
    request(app).get('/2019/05/06/untitled/').then((response) => {
      expect(response.statusCode).toBe(404);
      done();
    });
  });

  test('500 no index', (done, fail) => {
    utils.createEmptyDirs([path.join(dataDir, '2019', '05', '05'),]);
    fs.writeFileSync(path.join(dataDir, '2019', '05', '05', 'index.md'), '# Hello');
    fs.writeFileSync(path.join(dataDir, testTemplate), '<%- article.content %><%- `<a href="${article.url}">reload</a>` %>');
    app.reload(() => {
      config['article']['index'] = 'invalid.md';
      request(app).get('/2019/05/05/hello/').then((response) => {
        expect(response.statusCode).toBe(500);
        done();
      });
    }, fail);
  });

  test('500 no template', (done, fail) => {
    utils.createEmptyDirs([path.join(dataDir, '2019', '05', '05'),]);
    fs.writeFileSync(path.join(dataDir, '2019', '05', '05', 'index.md'), '# Hello');
    app.reload(() => {
      request(app).get('/2019/05/05/hello/').then((response) => {
        expect(response.statusCode).toBe(500);
        done();
      });
    }, fail);
  });

  test('200 rendered article', (done, fail) => {
    utils.createEmptyDirs([path.join(dataDir, '2019', '05', '05'),]);
    fs.writeFileSync(path.join(dataDir, '2019', '05', '05', 'index.md'), '# Hello');
    fs.writeFileSync(path.join(dataDir, testTemplate), '<%- article.content %><%- `<a href="${article.url}">reload</a>` %>');
    app.reload(() => {
      request(app).get('/2019/05/05/hello/').then((response) => {
        expect(response.statusCode).toBe(200);
        expect(response.text).toBe('<h1 id="hello">Hello</h1><a href="/2019/05/05/hello/">reload</a>');
        done();
      });
    }, fail);
  });

  test('200 other url', (done, fail) => {
    utils.createEmptyDirs([path.join(dataDir, '2019', '05', '05'),]);
    utils.createEmptyFiles([
      path.join(dataDir, '2019', '05', '05', 'index.md'),
      path.join(dataDir, testTemplate)
    ]);
    app.reload(() => {
      request(app).get('/2019/05/05/anything/').then((response) => {
        expect(response.statusCode).toBe(200);
        done();
      });
    }, fail);
  });

  test('200 other url 2', (done, fail) => {
    utils.createEmptyDirs([path.join(dataDir, '2019', '05', '05'),]);
    utils.createEmptyFiles([
      path.join(dataDir, '2019', '05', '05', 'index.md'),
      path.join(dataDir, testTemplate)
    ]);
    app.reload(() => {
      request(app).get('/2019/05/05/').then((response) => {
        expect(response.statusCode).toBe(200);
        done();
      });
    }, fail);
  });
});


describe('Test static files', () => {
  test('404 invalid file no error page', (done) => {
    request(app).get('/somefile.txt').then((response) => {
      expect(response.statusCode).toBe(404);
      done();
    });
  });
  test('404 invalid file but error page', (done) => {
    fs.writeFileSync(path.join(dataDir, testError), 'error <%= error %>');
    request(app).get('/somefile.txt').then((response) => {
      expect(response.statusCode).toBe(404);
      expect(response.text).toBe('error 404');
      done();
    });
  });
  test('404 hidden file', (done) => {
    utils.createEmptyDirs([path.join(dataDir, 'tmp')]);
    fs.writeFileSync(path.join(dataDir, 'tmp', 'somefile.ejs'), '');
    request(app).get('/tmp/somefile.ejs').then((response) => {
      expect(response.statusCode).toBe(404);
      done();
    });
  });
  test('404 hidden folder', (done) => {
    utils.createEmptyDirs([path.join(dataDir, '.git')]);
    fs.writeFileSync(path.join(dataDir, '.git', 'file.txt'), '');
    request(app).get('/.git/file.txt').then((response) => {
      expect(response.statusCode).toBe(404);
      done();
    });
  });
  test('200 valid file', (done) => {
    fs.writeFileSync(path.join(dataDir, 'somefile.css'), 'filecontent');
    request(app).get('/somefile.css').then((response) => {
      expect(response.statusCode).toBe(200);
      expect(response.type).toBe('text/css');
      expect(response.text).toBe('filecontent');
      done();
    });
  });
  test('200 valid resource of article', (done) => {
    utils.createEmptyDirs([path.join(dataDir, '2019', '05', '05'),]);
    fs.writeFileSync(path.join(dataDir, '2019', '05', '05', 'somefile.txt'), 'filecontent');
    request(app).get('/2019/05/05/title/somefile.txt').then((response) => {
      expect(response.statusCode).toBe(200);
      expect(response.text).toBe('filecontent');
      done();
    });
  });
});

describe('Test other requests', () => {
  test('400 POST', (done) => {
    request(app).post('/').then((response) => {
      expect(response.statusCode).toBe(400);
      done();
    });
  });
  test('400 PUT', (done) => {
    request(app).put('/').then((response) => {
      expect(response.statusCode).toBe(400);
      done();
    });
  });
  test('400 DELETE', (done) => {
    request(app).delete('/').then((response) => {
      expect(response.statusCode).toBe(400);
      done();
    });
  });
});
