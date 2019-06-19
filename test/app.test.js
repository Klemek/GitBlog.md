/* jshint -W117 */
const request = require('supertest');
const app = require('../src/app')({

});

describe('Test root path', () => {
    test('GET / 200', done => {
       request(app).get('/').then(response => {
           expect(response.statusCode).toBe(200);
           done();
       });
    });
});

