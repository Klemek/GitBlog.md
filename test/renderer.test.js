/* jshint -W117 */
const fs = require('fs');
const path = require('path');
const utils = require('./test_utils');

const dataDir = 'test_data';
const file = path.join(dataDir, 'test.md');

const config = {
  'modules': {
    'prism': true,
  },
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

test('no prism', (done) => {
  config['modules']['prism'] = false;
  fs.writeFileSync(file, '```python\nprint("hello")\n```\n\n```python\nprint("hello")\n```');
  renderer.render(file, (err, html) => {
    expect(err).toBeNull();
    expect(html).toBe('<pre><code class="python language-python">print("hello")\n</code></pre>\n<pre><code class="python language-python">print("hello")\n</code></pre>');
    config['modules']['prism'] = true;
    done();
  });
});

test('prism correct', (done) => {
  fs.writeFileSync(file, '```python\nprint("hello")\n```');
  renderer.render(file, (err, html) => {
    expect(err).toBeNull();
    expect(html).not.toBe('<pre><code class="python language-python">print("hello")\n</code></pre>');
    expect(html.indexOf('<pre><code class="python language-python">')).toBe(0);
    done();
  });
});

test('prism invalid lang', (done) => {
  fs.writeFileSync(file, '```pythdon\nprint("hello")\n```');
  renderer.render(file, (err, html) => {
    expect(err).toBeNull();
    expect(html).not.toBe('<pre><code class="pythdon language-pythdon">print("hello")\n</code></pre>');
    expect(html.indexOf('<pre><code class="pythdon language-pythdon">')).toBe(0);
    done();
  });
});

test('prism mutliple code blocks', (done) => {
  fs.writeFileSync(file, '```python\n\n```\n\n```python\n\n```');
  renderer.render(file, (err, html) => {
    expect(err).toBeNull();
    expect(html).toBe('<pre><code class="python language-python"></code></pre>\n<pre><code class="python language-python"></code></pre>');
    done();
  });
});