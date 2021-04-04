const fs = require('fs');
const utils = require('./test_utils');

const dataDir = 'test_data';

const config = {
    robots: {
        list_url: '',
        list_file: `${dataDir}/robots_list.json`,
    },
};


beforeAll(() => {
    utils.deleteFolderSync(dataDir);
    fs.mkdirSync(dataDir);
});

afterAll(() => {
    if (fs.existsSync(dataDir)) {
        utils.deleteFolderSync(dataDir);
    }
});

const botDetector = require('../src/bot_detector')(config);

describe('load()', () => {
    test('success', (done) => {
        config.robots = {
            list_url: 'https://raw.githubusercontent.com/atmire/COUNTER-Robots/master/COUNTER_Robots_list.json',
            list_file: `${dataDir}/robots_list_success.json`,
        };
        let count = 0;
        botDetector.load((status, err) => {
            expect(err).not.toBeDefined();
            expect(status).toBe(count === 0 ? botDetector.status.FETCH_OK : botDetector.status.READ_OK);
            if (count > 0) {
                done();
            }
            count++;
        });
    });

    test('fetch and file failure', (done) => {
        let count = 0;
        config.robots = {
            list_url: 'https://blog.klemek.fr/invalid.json',
            list_file: `${dataDir}/robots_list_fail_1.json`,
        };
        botDetector.load((status) => {
            expect(status).toBe(count === 0 ? botDetector.status.FETCH_ERROR : botDetector.status.READ_ERROR);
            if (count > 0) {
                done();
            }
            count++;
        });
    });

    test('fetch failure and file ok', (done) => {
        let count = 0;
        config.robots = {
            list_url: 'https://blog.klemek.fr/invalid.json',
            list_file: `${dataDir}/robots_list_fail_2.json`,
        };
        fs.writeFile(config.robots.list_file, '[]\n', { encoding: 'utf-8' }, () => {
            botDetector.load((status) => {
                expect(status).toBe(count === 0 ? botDetector.status.FETCH_ERROR : botDetector.status.READ_OK);
                if (count > 0) {
                    done();
                }
                count++;
            });
        });
    });
});


describe('handle()', () => {
    beforeAll((done) => {
        config.robots = {
            list_url: 'https://blog.klemek.fr/invalid.json',
            list_file: `${dataDir}/robots_list_fake.json`,
        };
        fs.writeFile(config.robots.list_file, '[{"pattern":"bot"}]\n', { encoding: 'utf-8' }, () => {
            botDetector.load((status) => {
                if (status !== botDetector.status.FETCH_ERROR) {
                    done();
                }
            });
        });
    });

    test('not bot', (done) => {
        const req = {
            headers: {
                'user-agent': 'my user agent',
            },
        };
        botDetector.handle(req, null, () => {
            expect(req.isRobot).toBeFalsy();
            done();
        });
    });

    test('bot', (done) => {
        const req = {
            headers: {
                'user-agent': 'bot',
            },
        };
        botDetector.handle(req, null, () => {
            expect(req.isRobot).toBeTruthy();
            done();
        });
    });
});
