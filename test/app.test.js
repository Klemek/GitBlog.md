/* jshint -W117 */
const request = require('supertest');
const fs = require('fs');
const path = require('path');
const utils = require('./test_utils');

const dataDir = 'test_data';
const testIndex = 'testindex.ejs';
const testError = 'testerror.ejs';

const config = {
    'test': true,
    'data_dir': dataDir,
    'view_engine': 'ejs',
    'home': {
        'index': testIndex,
        'error': testError,
        'hidden': ['.ejs','.test']
    },
    'article': {
        'index': 'index.md',
        'thumbnail_tag': 'thumbnail',
        'default_title': 'Untitled',
        'default_thumbnail': null
    },
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
    test('404 no index no error', (done) =>{
        request(app).get('/').then((response) =>{
            expect(response.statusCode).toBe(404);
            done();
        });
    });
    test('404 no index but error page', (done) =>{
        fs.writeFileSync(path.join(dataDir,testError), 'error <%= error %> at <%= path %>');
        request(app).get('/').then((response) =>{
            expect(response.statusCode).toBe(404);
            expect(response.text).toBe('error 404 at /');
            done();
        });
    });
    test('200 no articles', (done) =>{
        fs.writeFileSync(path.join(dataDir,testIndex), 'articles <%= articles.length %>');
        request(app).get('/').then((response) =>{
            expect(response.statusCode).toBe(200);
            expect(response.text).toBe('articles 0');
            done();
        });
    });
    test('200 2 articles', (done) =>{
        utils.createEmptyDirs([
            path.join(dataDir, '2019', '05', '05'),
            path.join(dataDir, '2018', '05', '05')
        ]);
        utils.createEmptyFiles([
            path.join(dataDir, '2019', '05', '05','index.md'),
            path.join(dataDir, '2018', '05', '05','index.md')
        ]);
        fs.writeFileSync(path.join(dataDir,testIndex), 'articles <%= articles.length %>');
        app.reload((res) => {
            expect(res).toBe(true);
            request(app).get('/').then((response) =>{
                expect(response.statusCode).toBe(200);
                expect(response.text).toBe('articles 2');
                done();
            });
        });

    });
});

describe('Test static files', () => {
    test('404 invalid file no error page', (done) =>{
        request(app).get('/somefile.txt').then((response) =>{
            expect(response.statusCode).toBe(404);
            done();
        });
    });
    test('404 invalid file but error page', (done) =>{
        fs.writeFileSync(path.join(dataDir,testError), 'error <%= error %> at <%= path %>');
        request(app).get('/somefile.txt').then((response) =>{
            expect(response.statusCode).toBe(404);
            expect(response.text).toBe('error 404 at /somefile.txt');
            done();
        });
    });
    test('404 hidden file', (done) =>{
        fs.writeFileSync(path.join(dataDir,'somefile.test'), '');
        request(app).get('/somefile.test').then((response) =>{
            expect(response.statusCode).toBe(404);
            done();
        });
    });
    test('200 valid file', (done) =>{
        fs.writeFileSync(`${dataDir}/somefile.txt`, 'filecontent');
        request(app).get('/somefile.txt').then((response) =>{
            expect(response.statusCode).toBe(200);
            expect(response.text).toBe('filecontent');
            done();
        });
    });
});

describe('Test other requests', () => {
    test('400 POST', (done) =>{
        request(app).post('/').then((response) =>{
            expect(response.statusCode).toBe(400);
            done();
        });
    });
    test('400 PUT', (done) =>{
        request(app).put('/').then((response) =>{
            expect(response.statusCode).toBe(400);
            done();
        });
    });
    test('400 DELETE', (done) =>{
        request(app).delete('/').then((response) =>{
            expect(response.statusCode).toBe(400);
            done();
        });
    });
});
