/* jshint -W117 */
const request = require('supertest');
const fs = require('fs');
const utils = require('./test_utils');

const dataDir = './test_data';
const testIndex = 'testindex.ejs';
const testError = 'testerror.ejs';

const config = {
    'test': true,
    'data_dir': dataDir,
    'view_engine': 'ejs',
    'home': {
        'index': testIndex,
        'error': testError
    }
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
    test('404 no index no error', done => {
        request(app).get('/').then(response => {
            expect(response.statusCode).toBe(404);
            done();
        });
    });
    test('404 no index but error page', done => {
        fs.writeFileSync(`${dataDir}/${testError}`, 'error <%= error %> at <%= path %>');
        request(app).get('/').then(response => {
            expect(response.statusCode).toBe(404);
            expect(response.text).toBe('error 404 at /');
            done();
        });
    });
    test('200 index page', done => {
        fs.writeFileSync(`${dataDir}/${testIndex}`, 'hello there');
        request(app).get('/').then(response => {
            expect(response.statusCode).toBe(200);
            expect(response.text).toBe('hello there');
            done();
        });
    });
    //TODO test articles list
});

describe('Test static files', () => {
    test('404 invalid file no error page', done => {
        request(app).get('/somefile.txt').then(response => {
            expect(response.statusCode).toBe(404);
            done();
        });
    });
    test('404 invalid file but error page', done => {
        fs.writeFileSync(`${dataDir}/${testError}`, 'error <%= error %> at <%= path %>');
        request(app).get('/somefile.txt').then(response => {
            expect(response.statusCode).toBe(404);
            expect(response.text).toBe('error 404 at /somefile.txt');
            done();
        });
    });
    test('200 valid file', done => {
        fs.writeFileSync(`${dataDir}/somefile.txt`, 'filecontent');
        request(app).get('/somefile.txt').then(response => {
            expect(response.statusCode).toBe(200);
            expect(response.text).toBe('filecontent');
            done();
        });
    });
});

describe('Test other requests', () => {
    test('400 POST', done => {
        request(app).post('/').then(response => {
            expect(response.statusCode).toBe(400);
            done();
        });
    });
    test('400 PUT', done => {
        request(app).put('/').then(response => {
            expect(response.statusCode).toBe(400);
            done();
        });
    });
    test('400 DELETE', done => {
        request(app).delete('/').then(response => {
            expect(response.statusCode).toBe(400);
            done();
        });
    });
});
