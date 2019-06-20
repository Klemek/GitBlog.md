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
config['home']['index'] = testIndex;
config['home']['error'] = testError;
config['article']['template'] = testTemplate;
config['home']['hidden'].push('.test');
config['rss']['endpoint'] = '/rsstest';
config['rss']['length'] = 2;
config['webhook']['endpoint'] = '/webhooktest';

const app = require('../src/app')(config);

beforeEach((done, fail) => {
  utils.deleteFolderSync(dataDir);
  fs.mkdirSync(dataDir);
  app.reload(done, fail);
});

afterAll(() => {
  if (fs.existsSync(dataDir)) {
    utils.deleteFolderSync(dataDir);
  }
});

describe('Test root path', () => {
  test('404 no index no error', (done) => {
    request(app).get('/').then((response) => {
      expect(response.statusCode).toBe(404);
      done();
    });
  });
  test('404 no index but error page', (done) => {
    fs.writeFileSync(path.join(dataDir, testError), 'error <%= error %> at <%= path %>');
    request(app).get('/').then((response) => {
      expect(response.statusCode).toBe(404);
      expect(response.text).toBe('error 404 at /');
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
  test('200 2 articles', (done, fail) => {
    utils.createEmptyDirs([
      path.join(dataDir, '2019', '05', '05'),
      path.join(dataDir, '2018', '05', '05')
    ]);
    utils.createEmptyFiles([
      path.join(dataDir, '2019', '05', '05', 'index.md'),
      path.join(dataDir, '2018', '05', '05', 'index.md')
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
      config['modules']['rss'] = true;
      done();
    });
  });
  test('200 empty rss', (done) => {
    request(app).get('/rsstest').then((response) => {
      expect(response.statusCode).toBe(200);
      expect(response.text.length).toBeGreaterThan(0);
      expect(response.text.split('<item>').length).toBe(1);
      done();
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
      }, fail);
    });
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
      }, fail);
    });
  });
});

describe('Test webhook', () => {
  test('400 webhook deactivated', (done) => {
    config['modules']['webhook'] = false;
    request(app).post('/webhooktest').then((response) => {
      expect(response.statusCode).toBe(400);
      config['modules']['webhook'] = true;
      done();
    });
  });
  test('200 no secret', (done) => {
    request(app).post('/webhooktest').then((response) => {
      expect(response.statusCode).toBe(200);
      //TODO test reload
      done();
    });
  });
  test('403 no payload', (done) => {
    config['webhook']['signature_header'] = 'testheader';
    config['webhook']['secret'] = 'testvalue';
    request(app).post('/webhooktest').then((response) => {
      expect(response.statusCode).toBe(403);
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
    request(app).post('/webhooktest')
      .send({})
      .set('testheader', 'sha1=d924d5bd4b36faf9d572844ac9c12a09ce3e7134')
      .then((response) => {
      expect(response.statusCode).toBe(200);
      //TODO test reload
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

  test('500 no template', (done, fail) => {
    utils.createEmptyDirs([path.join(dataDir, '2019', '05', '05'),]);
    fs.writeFileSync(path.join(dataDir, '2019', '05', '05', 'index.md'), '# Hello');
    app.reload(() => {
      request(app).get('/2019/05/05/hello/').then((response) => {
        expect(response.statusCode).toBe(500);
        done();
      }, fail);
    });
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
      }, fail);
    });
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
      }, fail);
    });
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
      }, fail);
    });
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
    fs.writeFileSync(path.join(dataDir, testError), 'error <%= error %> at <%= path %>');
    request(app).get('/somefile.txt').then((response) => {
      expect(response.statusCode).toBe(404);
      expect(response.text).toBe('error 404 at /somefile.txt');
      done();
    });
  });
  test('404 hidden file', (done) => {
    fs.writeFileSync(path.join(dataDir, 'somefile.test'), '');
    request(app).get('/somefile.test').then((response) => {
      expect(response.statusCode).toBe(404);
      done();
    });
  });
  test('200 valid file', (done) => {
    fs.writeFileSync(`${dataDir}/somefile.txt`, 'filecontent');
    request(app).get('/somefile.txt').then((response) => {
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
