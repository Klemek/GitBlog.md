/* jshint -W117 */
const fs = require('fs');

const dataDir = './test_data';
const testIndex = 'testindex.md';

const config = {
    'test': true,
    'data_dir': dataDir,
    'article': {
        'index': testIndex
    }
};

const fw = require('../src/file_walker')(config);

const deleteFolderSync = (path) => {
    if(!fs.existsSync(path))
        return;
    fs.readdirSync(path, {withFileTypes: true}).forEach((item) => {
        if (item.isDirectory())
            deleteFolderSync(`${path}/${item.name}`);
        else
            fs.unlinkSync(`${path}/${item.name}`);
    });
    fs.rmdirSync(path);
};

beforeEach(() => {
    deleteFolderSync(dataDir);
    fs.mkdirSync(dataDir);
});

afterAll(() => {
    if (fs.existsSync(dataDir)) {
        deleteFolderSync(dataDir);
    }
});

const createEmptyDirs = list => list.forEach(path => fs.mkdirSync(path, {recursive: true}));
const createEmptyFiles = list => list.forEach(file => fs.writeFileSync(file, ''));

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
        createEmptyDirs([
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
        createEmptyFiles(fileList);
        fw.fileTree(dataDir, (err, list) => {
            expect(err).toBeNull();
            expect(list).toBeDefined();
            expect(list.length).toBe(fileList.length);
            expect(list).toEqual(expect.arrayContaining(fileList));
            done();
        });
    });
    test('nested files', (done) => {
        createEmptyDirs([
            `${dataDir}/test/test`,
            `${dataDir}/test2`
        ]);
        const fileList = [
            `${dataDir}/f1.txt`,
            `${dataDir}/test/f2.txt`,
            `${dataDir}/test/test/f3.txt`,
            `${dataDir}/test2/f4.txt`
        ];
        createEmptyFiles(fileList);
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

describe('Test article fetching', () => {
    test('invalid data dir', (done) => {
        config['data_dir'] = 'invalid root';
        fw.fetchArticles((err,list) => {
            expect(err).not.toBeNull();
            expect(list).not.toBeDefined();
            config['data_dir'] = dataDir;
            done();
        });
    });
    test('empty data dir', (done) => {
        fw.fetchArticles((err,list) => {
            expect(err).toBeNull();
            expect(list).toBeDefined();
            expect(list.length).toBe(0);
            done();
        });
    });
    test('misplaced index file', (done) => {
        createEmptyDirs([
            `${dataDir}/test/test`,
            `${dataDir}/2019/05/05`,
        ]);
        createEmptyFiles([
            `${dataDir}/${testIndex}`,
            `${dataDir}/test/test/${testIndex}`,
            `${dataDir}/2019/05/${testIndex}`,
        ]);
        fw.fetchArticles((err,list) => {
            expect(err).toBeNull();
            expect(list).toBeDefined();
            expect(list.length).toBe(0);
            done();
        });
    });
    test('correct index file', (done) => {
        createEmptyDirs([
            `${dataDir}/2019/05/05`,
        ]);
        const fileList = [
            `${dataDir}/2019/05/05/${testIndex}`,
        ];
        createEmptyFiles(fileList);
        fw.fetchArticles((err,list) => {
            expect(err).toBeNull();
            expect(list).toBeDefined();
            expect(list.length).toBe(1);
            expect(list[0]).toEqual({
               path: fileList[0],
                year:2019,
                month:5,
                day:5
            });
            done();
        });
    });
});

