/* jshint -W117 */
const fs = require('fs');
const path = require('path');
const utils = require('./test_utils');

const dataDir = 'test_data';
const file = path.join(dataDir, 'test.md');

const config = {
    'showdown': {
        'simplifiedAutoLink': true,
        'smartIndentationFix': true
    }
};

const renderer = require('../src/renderer')(config);

beforeEach(() => {
    utils.deleteFolderSync(dataDir);
    fs.mkdirSync(dataDir);
});

afterAll(() => {
    if (fs.existsSync(dataDir)) {
        utils.deleteFolderSync(dataDir);
    }
});

test('invalid file', (done) => {
    renderer.render('invalid file', (err, html) => {
        expect(err).not.toBeNull();
        expect(html).not.toBeDefined();
        done();
    });
});

test('normal file', (done) => {
    fs.writeFileSync(file, `# Hello`);
    renderer.render(file, (err, html) => {
        expect(err).toBeNull();
        expect(html).toBe('<h1 id="hello">Hello</h1>');
        done();
    });
});

test('custom rules', (done) => {
    fs.writeFileSync(file, `www.google.com`);
    renderer.render(file, (err, html) => {
        expect(err).toBeNull();
        expect(html).toBe('<p><a href="http://www.google.com">www.google.com</a></p>');
        done();
    });
});