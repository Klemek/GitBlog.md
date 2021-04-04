const redis = require('redis');

module.exports = (config, onConnect, onError) => {
    const client = config['modules']['hit_counter'] ? redis.createClient(config['redis']) : { connected: false, on: () => { /* ignore */ } };

    client.on('connect', onConnect);
    client.on('error', onError);

    const visitors = {};

    const count = (req, path, disable, cb) => {
        if (!client.connected || disable) {
            cb();
        } else {
            const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            visitors[path] = (visitors[path] || {});
            const now = Date.now();
            const isNewVisitor = (now - (visitors[path][ip] || 0)) > config['hit_counter']['unique_visitor_timeout'];
            visitors[path][ip] = now;
            client
                .multi()
                .hincrby(path, 'h', 1)
                .hincrby(path, 'v', isNewVisitor ? 1 : 0)
                .exec(cb);
        }
    };

    const cleanVisitors = (path) => {
        visitors[path] = (visitors[path] || {});
        const now = Date.now();
        let count = 0;
        for (let ip in visitors[path]) {
            if ((now - visitors[path][ip]) > config['hit_counter']['unique_visitor_timeout']) {
                delete visitors[path][ip];
            } else {
                count++;
            }
        }
        return count;
    };

    const read = (path, cb) => {
        if (!client.connected) {
            cb({
                hits: 0,
                total_visitors: 0,
                current_visitors: 0,
            });
        } else {
            client.hgetall(path, (_, value) => {
                cb({
                    hits: value ? parseInt(value.h) || 0 : 0,
                    total_visitors: value ? parseInt(value.v) || 0 : 0,
                    current_visitors: cleanVisitors(path),
                });
            });
        }
    };

    return {
        count: count,
        read: read,
    };
};
