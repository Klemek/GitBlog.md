const redis = require('redis');

module.exports = (config, onConnect, onError) => {
    const client = config['modules']['hit_counter'] ? redis.createClient(config['redis']) : { connected: false, on: () => { /* ignore */ } };

    client.on('connect', onConnect);
    client.on('error', onError);

    const visitors = {};

    const count = (req, path, cb) => {
        if (!client.connected) {
            cb();
        } else {
            const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            const key = path + ':' + ip;
            const now = Date.now();
            const isNewVisitor = (now - (visitors[key] || 0)) > config['hit_counter']['unique_visitor_timeout'];
            visitors[key] = now;
            client
                .multi()
                .hincrby(path, 'h', 1)
                .hincrby(path, 'v', isNewVisitor ? 1 : 0)
                .exec(cb);
        }
    };

    const read = (path, cb) => {
        if (!client.connected) {
            cb({
                hits: 0,
                visitors: 0,
            });
        } else {
            client.hgetall(path, (_, value) => {
                cb({
                    hits: value ? value.h || 0 : 0,
                    visitors: value ? value.v || 0 : 0,
                });
            });
        }
    };

    return {
        count: count,
        read: read,
    };
};
