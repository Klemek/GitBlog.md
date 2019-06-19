/* jshint -W117 */
const request = require('supertest');
const config = require('./config.test.json');
const app = require('../src/app')(config);

describe('Test root path', () => {
    test('GET / 200', done => {
       request(app).get('/').then(response => {
           expect(response.statusCode).toBe(200);
           done();
       });
    });
});

