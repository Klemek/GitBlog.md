const https = require('https');
const fs = require('fs');

module.exports = (config) => {
    const _this = {
        status: {
            FETCH_OK: 1,
            FETCH_ERROR: 2,
            READ_OK: 3,
            READ_ERROR: 4,
        },
        count: [],
        regex: null,
        knownBots: [],
        known: [],
    };

    const fetchList = (cb) => {
        const file = fs.createWriteStream(config['robots']['list_file']);
        https.get(config['robots']['list_url'], (res) => {
            res.pipe(file);
            file.on('finish', () => {
                file.close(cb);
            });
        }).on('error', (err) => {
            file.close(() => {
                cb(err.message);
            });
        });
    };

    const readFile = (cb) => {
        fs.readFile(config['robots']['list_file'], (err, data) => {
            if (err) {
                cb(err, undefined);
            } else {
                try {
                    cb(undefined, JSON.parse(data));
                } catch (err) {
                    cb(err, undefined);
                }
            }
        });
    };

    _this.load = (cb) => {
        fetchList((err) => {
            cb(err ? _this.status.FETCH_ERROR : _this.status.FETCH_OK, err);
            readFile((err, data) => {
                if (!err) {
                    _this.count = data.length;
                    _this.regex = new RegExp('(' + data.filter(v => v['pattern']).map(v => v['pattern'])
                        .join('|') + ')');
                }
                cb(err ? _this.status.READ_ERROR : _this.status.READ_OK, err);
            });
        });
    };

    _this.handle = (req, res, next) => {
        req.isRobot = !!((req.headers['user-agent'] || '').match(_this.regex));
        next();
    };

    return _this;
};
