/* jshint -W117 */
const fs = require('fs');
const path = require('path');
const utils = require('./test_utils');

const dataDir = 'test_data';
const testIndex = 'testindex.md';

const config = {
  'test': true,
  'data_dir': dataDir,
  'article': {
    'index': testIndex,
    'default_title': 'Untitled',
    'default_thumbnail': 'default.png',
    'thumbnail_tag': 'thumbnail'
  }
};

const fw = require('../src/file_walker')(config);

beforeEach(() => {
  utils.deleteFolderSync(dataDir);
  fs.mkdirSync(dataDir);
});

afterAll(() => {
  if (fs.existsSync(dataDir)) {
    utils.deleteFolderSync(dataDir);
  }
});

describe('Test function fileTree', () => {
  test('empty root', (done) => {
    fw.fileTree(dataDir, (err, list) => {
      expect(err).toBeNull();
      expect(list).toBeDefined();
      expect(list.length).toBe(0);
      done();
    });
  });
  test('empty folders', (done) => {
    utils.createEmptyDirs([
      path.join(dataDir, 'test', 'test'),
      path.join(dataDir, 'test', 'test2'),
      path.join(dataDir, 'test2')
    ]);
    fw.fileTree(dataDir, (err, list) => {
      expect(err).toBeNull();
      expect(list).toBeDefined();
      expect(list.length).toBe(0);
      done();
    });
  });
  test('simple files', (done) => {
    const fileList = [
      path.join(dataDir, 'f1.txt'),
      path.join(dataDir, 'f2.txt')
    ];
    utils.createEmptyFiles(fileList);
    fw.fileTree(dataDir, (err, list) => {
      expect(err).toBeNull();
      expect(list).toBeDefined();
      expect(list.length).toBe(fileList.length);
      expect(list).toEqual(expect.arrayContaining(fileList));
      done();
    });
  });
  test('nested files', (done) => {
    utils.createEmptyDirs([
      path.join(dataDir, 'test', 'test'),
      path.join(dataDir, 'test2')
    ]);
    const fileList = [
      path.join(dataDir, 'f1.txt'),
      path.join(dataDir, 'test', 'f2.txt'),
      path.join(dataDir, 'test', 'test', 'f3.txt'),
      path.join(dataDir, 'test2', 'f4.txt')
    ];
    utils.createEmptyFiles(fileList);
    fw.fileTree(dataDir, (err, list) => {
      expect(err).toBeNull();
      expect(list).toBeDefined();
      expect(list.length).toBe(fileList.length);
      expect(list).toEqual(expect.arrayContaining(fileList));
      done();
    });
  });
  test('invalid root', (done) => {
    fw.fileTree('invalid root', (err, list) => {
      expect(err).not.toBeNull();
      expect(list).not.toBeDefined();
      done();
    });
  });
});

describe('Test index article reading', () => {
  const file = path.join(dataDir, testIndex);

  test('invalid file', (done) => {
    fw.readIndexFile('invalid file', 'thumbnail', (err, info) => {
      expect(err).not.toBeNull();
      expect(info).not.toBeDefined();
      done();
    });

  });

  test('correct file', (done) => {
    fs.writeFileSync(file, `
           # This is an awesome title !?¤
           ![custom_thumbnail](./thumbnail.jpg)
           this is some text
           `);
    fw.readIndexFile(file, 'custom_thumbnail', (err, info) => {
      expect(err).toBeNull();
      expect(info).toBeDefined();
      expect(info.title).toBe('This is an awesome title !?¤');
      expect(info.thumbnail).toBe('./thumbnail.jpg');
      done();
    });
  });

  test('no title', (done) => {
    fs.writeFileSync(file, `
           ## This is an awesome title !?¤
           ![custom_thumbnail](./thumbnail.jpg)
           ### this is some text
           `);
    fw.readIndexFile(file, 'custom_thumbnail', (err, info) => {
      expect(err).toBeNull();
      expect(info).toBeDefined();
      expect(info.title).not.toBeDefined();
      expect(info.thumbnail).toBe('./thumbnail.jpg');
      done();
    });
  });

  test('title at beginning', (done) => {
    fs.writeFileSync(file, '#title');
    fw.readIndexFile(file, 'custom_thumbnail', (err, info) => {
      expect(err).toBeNull();
      expect(info).toBeDefined();
      expect(info.title).toBe('title');
      expect(info.thumbnail).not.toBeDefined();
      done();
    });
  });

  test('no thumbnail', (done) => {
    fs.writeFileSync(file, `
           # This is an awesome title !?¤
           ![custom_thumbnail](./thumbnail.jpg)
           this is some text
           `);
    fw.readIndexFile(file, 'thumbnail', (err, info) => {
      expect(err).toBeNull();
      expect(info).toBeDefined();
      expect(info.title).toBe('This is an awesome title !?¤');
      expect(info.thumbnail).not.toBeDefined();
      done();
    });
  });

  test('multiple thumbnails', (done) => {
    fs.writeFileSync(file, `
           # This is an awesome title !?¤
           ![custom_thumbnail](./thumbnail.jpg)
           this is some text
           ![custom_thumbnail](./thumbnail2.jpg)
           `);
    fw.readIndexFile(file, 'custom_thumbnail', (err, info) => {
      expect(err).toBeNull();
      expect(info).toBeDefined();
      expect(info.title).toBe('This is an awesome title !?¤');
      expect(info.thumbnail).toBe('./thumbnail.jpg');
      done();
    });
  });
});

describe('Test article fetching', () => {
  test('invalid data dir', (done) => {
    config['data_dir'] = 'invalid root';
    fw.fetchArticles((err, list) => {
      expect(err).not.toBeNull();
      expect(list).not.toBeDefined();
      config['data_dir'] = dataDir;
      done();
    });
  });
  test('empty data dir', (done) => {
    fw.fetchArticles((err, dict) => {
      expect(err).toBeNull();
      expect(dict).toBeDefined();
      expect(Object.keys(dict).length).toBe(0);
      done();
    });
  });
  test('misplaced index file', (done) => {
    utils.createEmptyDirs([
      path.join(dataDir, 'test', 'test'),
      path.join(dataDir, '2019', '05', '05')
    ]);
    utils.createEmptyFiles([
      path.join(dataDir, testIndex),
      path.join(dataDir, 'test', 'test', testIndex),
      path.join(dataDir, '2019', '05', testIndex)
    ]);
    fw.fetchArticles((err, dict) => {
      expect(err).toBeNull();
      expect(dict).toBeDefined();
      expect(Object.keys(dict).length).toBe(0);
      done();
    });
  });
  test('empty index file', (done) => {
    const dir = path.join(dataDir, '2019', '05', '05');
    const file = path.join(dir, testIndex);
    utils.createEmptyDirs([dir]);
    utils.createEmptyFiles([file]);
    fw.fetchArticles((err, dict) => {
      expect(err).toBeNull();
      expect(dict).toBeDefined();
      expect(Object.keys(dict).length).toBe(1);
      expect(dict[path.join('2019', '05', '05')]).toEqual({
        path: path.join('2019', '05', '05'),
        realPath: dir,
        year: 2019,
        month: 5,
        day: 5,
        date: new Date(2019, 5, 5),
        title: 'Untitled',
        thumbnail: 'default.png',
        escapedTitle: 'untitled',
        url: '/' + path.join('2019', '05', '05', 'untitled') + '/',
      });
      done();
    });
  });
  test('correct index file', (done) => {
    const dir = path.join(dataDir, '2019', '05', '05');
    const file = path.join(dir, testIndex);
    utils.createEmptyDirs([dir]);
    fs.writeFileSync(file, `
           # Title with : info !
           ![thumbnail](./thumbnail.jpg)
           this is some text
           `);
    fw.fetchArticles((err, dict) => {
      expect(err).toBeNull();
      expect(dict).toBeDefined();
      expect(Object.keys(dict).length).toBe(1);
      expect(dict[path.join('2019', '05', '05')]).toEqual({
        path: path.join('2019', '05', '05'),
        realPath: dir,
        year: 2019,
        month: 5,
        day: 5,
        date: new Date(2019, 5, 5),
        title: 'Title with : info !',
        thumbnail: path.join('2019', '05', '05', './thumbnail.jpg'),
        escapedTitle: 'title_with___info',
        url: '/' + path.join('2019', '05', '05', 'title_with___info') + '/',
      });
      done();
    });
  });
});

