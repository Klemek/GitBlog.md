/* jshint -W117 */
const request = require('supertest');
const fs = require('fs');
const path = require('path');
const utils = require('./test_utils');

const dataDir = 'test_data';
const testIndex = 'testindex.ejs';
const testError = 'testerror.ejs';
const testTemplate = 'testtemplate.ejs';

const config = {
  'test': true,
  'data_dir': dataDir,
  'view_engine': 'ejs',
  'home': {
    'index': testIndex,
    'error': testError,
    'hidden': ['.ejs', '.test']
  },
  'article': {
    'index': 'index.md',
    'template': testTemplate,
    'thumbnail_tag': 'thumbnail',
    'default_title': 'Untitled',
    'default_thumbnail': null
  },
  'showdown': {}
};

const app = require('../src/app')(config);

beforeEach(() => {
  utils.deleteFolderSync(dataDir);
  fs.mkdirSync(dataDir);
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
  test('200 2 articles', (done) => {
    utils.createEmptyDirs([
      path.join(dataDir, '2019', '05', '05'),
      path.join(dataDir, '2018', '05', '05')
    ]);
    utils.createEmptyFiles([
      path.join(dataDir, '2019', '05', '05', 'index.md'),
      path.join(dataDir, '2018', '05', '05', 'index.md')
    ]);
    fs.writeFileSync(path.join(dataDir, testIndex), 'articles <%= articles.length %>');
    app.reload((res) => {
      expect(res).toBe(true);
      request(app).get('/').then((response) => {
        expect(response.statusCode).toBe(200);
        expect(response.text).toBe('articles 2');
        done();
      });
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

  test('500 no template', (done) => {
    utils.createEmptyDirs([path.join(dataDir, '2019', '05', '05'),]);
    fs.writeFileSync(path.join(dataDir, '2019', '05', '05', 'index.md'), '# Hello');
    app.reload((res) => {
      expect(res).toBe(true);
      request(app).get('/2019/05/05/hello/').then((response) => {
        expect(response.statusCode).toBe(500);
        done();
      });
    });
  });

  test('200 rendered article', (done) => {
    utils.createEmptyDirs([path.join(dataDir, '2019', '05', '05'),]);
    fs.writeFileSync(path.join(dataDir, '2019', '05', '05', 'index.md'), '# Hello');
    fs.writeFileSync(path.join(dataDir, testTemplate), '<%- article.content %><%- `<a href="${article.url}">reload</a>` %>');
    app.reload((res) => {
      expect(res).toBe(true);
      request(app).get('/2019/05/05/hello/').then((response) => {
        expect(response.statusCode).toBe(200);
        expect(response.text).toBe('<h1 id="hello">Hello</h1><a href="/2019/05/05/hello/">reload</a>');
        done();
      });
    });
  });

  test('200 other url', (done) => {
    utils.createEmptyDirs([path.join(dataDir, '2019', '05', '05'),]);
    utils.createEmptyFiles([
      path.join(dataDir, '2019', '05', '05', 'index.md'),
      path.join(dataDir, testTemplate)
    ]);
    app.reload((res) => {
      expect(res).toBe(true);
      request(app).get('/2019/05/05/anything/').then((response) => {
        expect(response.statusCode).toBe(200);
        done();
      });
    });
  });

  test('200 other url 2', (done) => {
    utils.createEmptyDirs([path.join(dataDir, '2019', '05', '05'),]);
    utils.createEmptyFiles([
      path.join(dataDir, '2019', '05', '05', 'index.md'),
      path.join(dataDir, testTemplate)
    ]);
    app.reload((res) => {
      expect(res).toBe(true);
      request(app).get('/2019/05/05/').then((response) => {
        expect(response.statusCode).toBe(200);
        done();
      });
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
