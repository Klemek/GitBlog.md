const fs = require('fs');
const utils = require('./test_utils');

const dataDir = 'test_data';

const config = {
    robots: {
        list_url: 'https://raw.githubusercontent.com/atmire/COUNTER-Robots/master/COUNTER_Robots_list.json',
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

test('load()', (done) => {
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

describe('handle()', () => {
    beforeAll((done) => {
        botDetector.load((status) => {
            if (status === botDetector.status.READ_OK) {
                done();
            }
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
