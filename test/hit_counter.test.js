const mockClient = {
    options: {},
    connected: true,
    on: () => { /* ignore */ },
};

jest.mock('redis', () => {
    return {
        createClient: (options) => {
            mockClient.options = options;
            return mockClient;
        },
    };
});

const config = {
    test: true,
    modules: {
        hit_counter: true,
    },
    redis: {
        host: 'test-host',
        port: 'test-port',
    },
    hit_counter: {
        unique_visitor_timeout: -1,
    },
};

const hc = require('../src/hit_counter')(config, () => { /* ignore */ }, () => { /* ignore */ });

afterAll(() => {
    jest.resetModules();
});

test('options passed to redis', () => {
    expect(mockClient.options).toEqual(config['redis']);
});


beforeEach(() => {
    mockClient.hgetall = (_, cb) => {
        cb();
    };
    mockClient.multi = () => mockClient;
    mockClient.hincrby = () => mockClient;
    mockClient.exec = (cb) => {
        cb();
    };
    config['hit_counter']['unique_visitor_timeout'] = -1;
});

describe('read()', () => {
    test('normal', (done) => {
        mockClient.hgetall = (path, cb) => {
            expect(path).toBe('/test/path/');
            cb(undefined, { h: 12, v: 34 });
        };
        hc.read('/test/path/', (data) => {
            expect(data).toBeDefined();
            expect(data.hits).toBe(12);
            expect(data.total_visitors).toBe(34);
            expect(data.current_visitors).toBe(0);
            done();
        });
    });

    test('with error', (done) => {
        mockClient.hgetall = (path, cb) => {
            expect(path).toBe('/test/path/');
            cb('error', undefined);
        };
        hc.read('/test/path/', (data) => {
            expect(data).toBeDefined();
            expect(data.hits).toBe(0);
            expect(data.total_visitors).toBe(0);
            expect(data.current_visitors).toBe(0);
            done();
        });
    });

    test('with error 2', (done) => {
        mockClient.hgetall = (path, cb) => {
            expect(path).toBe('/test/path/');
            cb(undefined, {});
        };
        hc.read('/test/path/', (data) => {
            expect(data).toBeDefined();
            expect(data.hits).toBe(0);
            expect(data.total_visitors).toBe(0);
            expect(data.current_visitors).toBe(0);
            done();
        });
    });

    test('1 visitor', (done) => {
        config['hit_counter']['unique_visitor_timeout'] = 1000;
        hc.count({
            headers: {},
            connection: { remoteAddress: 'test1' },
        }, '/test/path/5', false, () => {
            hc.read('/test/path/5', (data) => {
                expect(data).toBeDefined();
                expect(data.current_visitors).toBe(1);
                done();
            });
        });
    });

    test('cleaned old visitor', (done) => {
        hc.count({
            headers: {},
            connection: { remoteAddress: 'test1' },
        }, '/test/path/5', false, () => {
            hc.read('/test/path/5', (data) => {
                expect(data).toBeDefined();
                expect(data.current_visitors).toBe(0);
                done();
            });
        });
    });
});

describe('count()', () => {
    test('simple visit', (done) => {
        let multiCalled = false;
        let execCalled = false;
        let hincrbyCalls = [];
        mockClient.multi = () => {
            multiCalled = true;
            return mockClient;
        };
        mockClient.hincrby = (hash, key, value) => {
            hincrbyCalls.push([
                hash,
                key,
                value,
            ]);
            return mockClient;
        };
        mockClient.exec = (cb) => {
            execCalled = true;
            cb();
        };
        hc.count({
            headers: {},
            connection: { remoteAddress: 'test1' },
        }, '/test/path/1', false, () => {
            expect(multiCalled).toBeTruthy();
            expect(hincrbyCalls).toEqual([
                [
                    '/test/path/1',
                    'h',
                    1,
                ],
                [
                    '/test/path/1',
                    'v',
                    1,
                ],
            ]);
            expect(execCalled).toBeTruthy();
            done();
        });
    });

    test('re-visit after long time', (done) => {
        let hincrbyCalls = [];
        mockClient.hincrby = (hash, key, value) => {
            hincrbyCalls.push([
                hash,
                key,
                value,
            ]);
            return mockClient;
        };
        hc.count({
            headers: {},
            connection: { remoteAddress: 'test2' },
        }, '/test/path/2', false, () => {
            hc.count({
                headers: {},
                connection: { remoteAddress: 'test2' },
            }, '/test/path/2', false, () => {
                expect(hincrbyCalls).toEqual([
                    [
                        '/test/path/2',
                        'h',
                        1,
                    ],
                    [
                        '/test/path/2',
                        'v',
                        1,
                    ],
                    [
                        '/test/path/2',
                        'h',
                        1,
                    ],
                    [
                        '/test/path/2',
                        'v',
                        1,
                    ],
                ]);
                done();
            });
        });
    });

    test('re-visit after short time', (done) => {
        config['hit_counter']['unique_visitor_timeout'] = 10000;
        let hincrbyCalls = [];
        mockClient.hincrby = (hash, key, value) => {
            hincrbyCalls.push([
                hash,
                key,
                value,
            ]);
            return mockClient;
        };
        hc.count({
            headers: {},
            connection: { remoteAddress: 'test3' },
        }, '/test/path/3', false, () => {
            hc.count({
                headers: {},
                connection: { remoteAddress: 'test3' },
            }, '/test/path/3', false, () => {
                expect(hincrbyCalls).toEqual([
                    [
                        '/test/path/3',
                        'h',
                        1,
                    ],
                    [
                        '/test/path/3',
                        'v',
                        1,
                    ],
                    [
                        '/test/path/3',
                        'h',
                        1,
                    ],
                    [
                        '/test/path/3',
                        'v',
                        0,
                    ],
                ]);
                done();
            });
        });
    });
});
