/* jshint -W117 */
const fs = require('fs');
const utils = require('./test_utils');

const dataDir = './test_data';
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
            `${dataDir}/test/test`,
            `${dataDir}/test/test2`,
            `${dataDir}/test2`
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
            `${dataDir}/f1.txt`,
            `${dataDir}/f2.txt`
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
            `${dataDir}/test/test`,
            `${dataDir}/test2`
        ]);
        const fileList = [
            `${dataDir}/f1.txt`,
            `${dataDir}/test/f2.txt`,
            `${dataDir}/test/test/f3.txt`,
            `${dataDir}/test2/f4.txt`
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
    const file = `${dataDir}/${testIndex}`;

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
        fw.fetchArticles((err, list) => {
            expect(err).toBeNull();
            expect(list).toBeDefined();
            expect(list.length).toBe(0);
            done();
        });
    });
    test('misplaced index file', (done) => {
        utils.createEmptyDirs([
            `${dataDir}/test/test`,
            `${dataDir}/2019/05/05`,
        ]);
        utils.createEmptyFiles([
            `${dataDir}/${testIndex}`,
            `${dataDir}/test/test/${testIndex}`,
            `${dataDir}/2019/05/${testIndex}`,
        ]);
        fw.fetchArticles((err, list) => {
            expect(err).toBeNull();
            expect(list).toBeDefined();
            expect(list.length).toBe(0);
            done();
        });
    });
    test('empty index file', (done) => {
        utils.createEmptyDirs([
            `${dataDir}/2019/05/05`,
        ]);
        const file = `${dataDir}/2019/05/05/${testIndex}`;
        utils.createEmptyFiles([file]);
        fw.fetchArticles((err, list) => {
            expect(err).toBeNull();
            expect(list).toBeDefined();
            expect(list.length).toBe(1);
            expect(list[0]).toEqual({
                path: file,
                year: 2019,
                month: 5,
                day: 5,
                title:'Untitled',
                thumbnail:'default.png'
            });
            done();
        });
    });
    test('correct index file', (done) => {
        utils.createEmptyDirs([
            `${dataDir}/2019/05/05`,
        ]);
        const file = `${dataDir}/2019/05/05/${testIndex}`;
        fs.writeFileSync(file, `
           # Title
           ![thumbnail](./thumbnail.jpg)
           this is some text
           `);
        fw.fetchArticles((err, list) => {
            expect(err).toBeNull();
            expect(list).toBeDefined();
            expect(list.length).toBe(1);
            expect(list[0]).toEqual({
                path: file,
                year: 2019,
                month: 5,
                day: 5,
                title:'Title',
                thumbnail:`${dataDir}/2019/05/05/./thumbnail.jpg`
            });
            done();
        });
    });
});

