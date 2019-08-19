/* jshint -W117 */
const fs = require('fs');
const path = require('path');
const utils = require('./test_utils');

const dataDir = 'test_data';
const file = path.join(dataDir, 'test.md');

const config = {
  'test': true,
  'modules': {
    'prism': true,
    'mathjax': true,
    'plantuml': true,
    'fa-diagrams': true,
  },
  'showdown': {
    'simplifiedAutoLink': true,
    'smartIndentationFix': true
  },
  'mathjax': {
    'output_format': 'html',
    'speak_text': false
  },
  'plantuml': {
    'output_format': 'svg'
  }
};

const renderer = require('../src/renderer')(config);

beforeEach(() => {
  config['modules']['prism'] = true;
  config['modules']['mathjax'] = true;
  config['modules']['plantuml'] = true;
  config['modules']['fa-diagrams'] = true;
  utils.deleteFolderSync(dataDir);
  fs.mkdirSync(dataDir);
});

afterAll(() => {
  if (fs.existsSync(dataDir)) {
    utils.deleteFolderSync(dataDir);
  }
});

describe('get parts', () => {
  test('normal', () => {
    const data = 'Hello\nthere\ngeneral\nkenobi';
    const parts = renderer.getParts(data);
    expect(parts.map(p => p.text)).toEqual([
      'Hello\nthere\ngeneral\nkenobi'
    ]);
  });
  test('lot of stuff', () => {
    const data = 'Hello\nthere\n```code```\ngeneral<script>script</script>\n<script>script2</script>\n```<script>script3</script>```kenobi';
    const parts = renderer.getParts(data);
    expect(parts).toEqual([
      {
        index: 0,
        end: 12,
        text: 'Hello\nthere\n'
      },
      {
        index: 22,
        end: 30,
        text: '\ngeneral'
      },
      {
        index: 53,
        end: 54,
        text: '\n'
      },
      {
        index: 78,
        end: 79,
        text: '\n'
      },
      {
        index: 109,
        end: 115,
        text: 'kenobi'
      },
    ]);
  });
});

describe('Test Showdown', () => {
  test('normal', (done) => {
    renderer.renderShowDown('# Hello', (html) => {
      expect(html).toBe('<h1 id="hello">Hello</h1>');
      done();
    });
  });
  test('custom rules', (done) => {
    renderer.renderShowDown('www.google.com', (html) => {
      expect(html).toBe('<p><a href="http://www.google.com">www.google.com</a></p>');
      done();
    });
  });
  test('code format', (done) => {
    renderer.renderShowDown('```python\nprint("hello")\n```\n\n```python\nprint("hello")\n```', (html) => {
      expect(html).toBe('<pre><code class="python language-python">print("hello")\n</code></pre>\n<pre><code class="python language-python">print("hello")\n</code></pre>');
      done();
    });
  });
});

describe('Test Prism', () => {
  test('no prism', (done) => {
    config['modules']['prism'] = false;
    renderer.renderPrism('```python\nprint("hello")\n```\n\n```python\nprint("hello")\n```', (data) => {
      expect(data).toBe('```python\nprint("hello")\n```\n\n```python\nprint("hello")\n```');
      done();
    });
  });

  test('prism correct', (done) => {
    renderer.renderPrism('```python\nprint("hello")\n```', (data) => {
      expect(data).not.toBe('<pre><code class="python language-python">print("hello")\n</code></pre>');
      expect(data.indexOf('<pre><code class="python language-python">')).toBe(0);
      done();
    });
  });

  test('prism invalid lang', (done) => {
    renderer.renderPrism('```pythdon\nprint("hello")\n```', (data) => {
      expect(data).not.toBe('<pre><code class="pythdon language-pythdon">print("hello")\n</code></pre>');
      expect(data.indexOf('<pre><code class="pythdon language-pythdon">')).toBe(0);
      done();
    });
  });

  test('prism mutliple code blocks', (done) => {
    renderer.renderPrism('```python\n\n```\n```python\n\n```', (data) => {
      expect(data).toBe('<pre><code class="python language-python"></code></pre>\n<pre><code class="python language-python"></code></pre>');
      done();
    });
  });
});

describe('Test PlantUML', () => {
  test('no plantuml', (done) => {
    config['modules']['plantuml'] = false;
    renderer.renderPlantUML('@startuml\nBob -> Alice : hello\n@enduml', (data) => {
      expect(data).toBe('@startuml\nBob -> Alice : hello\n@enduml');
      done();
    });
  });

  test('plantuml correct', (done) => {
    renderer.renderPlantUML('@startuml\nBob -> Alice : hello\n@enduml', (data) => {
      expect(data).toBe('<img alt="generated PlantUML diagram" src="http://www.plantuml.com/plantuml/svg/SyfFKj2rKt3CoKnELR1Io4ZDoSa70000">');
      done();
    });
  });

  test('plantuml ignored in code', (done) => {
    renderer.renderPlantUML('code:\n```@startuml\nBob -> Alice : hello\n@enduml```\n ```@startuml``` @enduml', (data) => {
      expect(data).toBe('code:\n```@startuml\nBob -> Alice : hello\n@enduml```\n ```@startuml``` @enduml');
      done();
    });
  });

  test('plantuml multiple uml', (done) => {
    renderer.renderPlantUML('@startuml\nBob -> Alice : hello\n@enduml\n@startuml\nBob -> Alice : hello\n@enduml', (data) => {
      expect(data).toBe('<img alt="generated PlantUML diagram" src="http://www.plantuml.com/plantuml/svg/SyfFKj2rKt3CoKnELR1Io4ZDoSa70000">\n<img alt="generated PlantUML diagram" src="http://www.plantuml.com/plantuml/svg/SyfFKj2rKt3CoKnELR1Io4ZDoSa70000">');
      done();
    });
  });
});


describe('Test MathJax', () => {
  test('no mathjax', (done) => {
    config['modules']['mathjax'] = false;
    renderer.renderMathJax('$$\nhello\n$$\ntest$test$', (data) => {
      expect(data).toBe('$$\nhello\n$$\ntest$test$');
      done();
    });
  });
  test('full eq', (done) => {
    renderer.renderMathJax('$$\n\nA\n\n$$', (data) => {
      expect(data).toBe('<span class=\"mjx-chtml MJXc-display\" style=\"text-align: center;\">' +
        '<span class=\"mjx-math\"><span class=\"mjx-mrow\"><span class=\"mjx-mi\">' +
        '<span class=\"mjx-char MJXc-TeX-math-I\" style=\"padding-top: 0.519em; padding-bottom: 0.298em;\">' +
        'A' +
        '</span></span></span></span></span>');
      done();
    });
  });
  test('inline eq', (done) => {
    renderer.renderMathJax('start $a$ end', (data) => {
      expect(data).toBe('start ' +
        '<span class=\"mjx-chtml\">' +
        '<span class=\"mjx-math\"><span class=\"mjx-mrow\"><span class=\"mjx-mi\">' +
        '<span class=\"mjx-char MJXc-TeX-math-I\" style=\"padding-top: 0.225em; padding-bottom: 0.298em;\">' +
        'a' +
        '</span></span></span></span></span>' +
        ' end');
      done();
    });
  });
  test('fake inline eq', (done) => {
    renderer.renderMathJax('i have $6\nyou have $5', (data) => {
      expect(data).toBe('i have $6\nyou have $5');
      done();
    });
  });
  test('no eq in code / script', (done) => {
    renderer.renderMathJax('this code is ```start $a$ end $$hello$$``` beautiful <script>$A$</script>\n```$no eq$```', (data) => {
      expect(data).toBe('this code is ```start $a$ end $$hello$$``` beautiful <script>$A$</script>\n```$no eq$```');
      done();
    });
  });
  test('multiple eq', (done) => {
    renderer.renderMathJax('$$\n\nA\n\n$$\nstart $a$ end\n$$\n\nA\n\n$$', (data) => {
      expect(data).toBe('' +
        '<span class=\"mjx-chtml MJXc-display\" style=\"text-align: center;\">' +
        '<span class=\"mjx-math\"><span class=\"mjx-mrow\"><span class=\"mjx-mi\">' +
        '<span class=\"mjx-char MJXc-TeX-math-I\" style=\"padding-top: 0.519em; padding-bottom: 0.298em;\">' +
        'A' +
        '</span></span></span></span></span>\n' +
        'start ' +
        '<span class=\"mjx-chtml\">' +
        '<span class=\"mjx-math\"><span class=\"mjx-mrow\"><span class=\"mjx-mi\">' +
        '<span class=\"mjx-char MJXc-TeX-math-I\" style=\"padding-top: 0.225em; padding-bottom: 0.298em;\">' +
        'a' +
        '</span></span></span></span></span>' +
        ' end\n' +
        '<span class=\"mjx-chtml MJXc-display\" style=\"text-align: center;\">' +
        '<span class=\"mjx-math\"><span class=\"mjx-mrow\"><span class=\"mjx-mi\">' +
        '<span class=\"mjx-char MJXc-TeX-math-I\" style=\"padding-top: 0.519em; padding-bottom: 0.298em;\">' +
        'A' +
        '</span></span></span></span></span>');
      done();
    });
  });
});

describe('Test fa-diagrams', () => {
  test('no fa-diagrams', (done) => {
    config['modules']['fa-diagrams'] = false;
    renderer.renderFaDiagrams('@startfad\noptions.rendering.color=\'red\'\n@endfad', (data) => {
      expect(data).toBe('@startfad\noptions.rendering.color=\'red\'\n@endfad');
      done();
    });
  });
  test('no fa-diagrams in code', (done) => {
    renderer.renderFaDiagrams('code:\n```\n@startfad\noptions.rendering.color=\'red\'\n@endfad\n```', (data) => {
      expect(data).toBe('code:\n```\n@startfad\noptions.rendering.color=\'red\'\n@endfad\n```');
      done();
    });
  });
  test('valid fa-diagrams', (done) => {
    renderer.renderFaDiagrams('before\n@startfad\noptions.rendering.color=\'red\'\n@endfad\nafter', (data) => {
      expect(data).toBe('before\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 0 0" width="0" height="0" font-family="Arial" font-size="15" fill="red" stroke-width="0"></svg>\nafter');
      done();
    });
  });
  test('invalid yaml', (done) => {
    renderer.renderFaDiagrams('before\n@startfad\noptions.rendering.color=red\n@endfad\nafter', (data) => {
      expect(data).toBe('before\n<b style="color:red">TomlError: Unexpected character, expecting string, number, datetime, boolean, inline array or inline table at row 1, col 26, pos 25:\n' +
        '1> options.rendering.color=red\n' +
        '                            ^\n' +
        '\n</b>\nafter');
      done();
    });
  });
});

describe('Test render', () => {
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
});