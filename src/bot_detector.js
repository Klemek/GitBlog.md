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
    };

    const fetchList = (cb) => {
        https.get(config['robots']['list_url'], (res) => {
            if (res.statusCode !== 200) {
                cb(res.statusCode);
            } else {
                const file = fs.createWriteStream(config['robots']['list_file']);
                res.pipe(file);
                file.on('finish', () => {
                    file.close(cb);
                });
            }
        }).on('error', (err) => {
            cb(err.message);
        });
    };

    const readFile = (cb) => {
        fs.readFile(config['robots']['list_file'], { encoding: 'utf-8' }, (err, data) => {
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
