const fs = require('fs');

const getFileTree = (path, cb) => {
    let list = [];
    let remaining = 0;
    fs.readdir(path, {withFileTypes: true}, (err, items) => {
        if (err)
            return cb(err);
        items.forEach((item) => {
            if (item.isDirectory()) {
                remaining++;
                getFileTree(`${path}/${item.name}`, (err, out) => {
                    if (err)
                        return cb(err);
                    list.push(...out);
                    remaining--;
                    if (remaining === 0)
                        cb(null, list);
                });
            } else {
                list.push(`${path}/${item.name}`);
            }
        });
        if (remaining === 0)
            cb(null, list);
    });
};

const readIndexFile = (path, thumbnailTag, cb) => {
    fs.readFile(path, {encoding: 'UTF-8'}, (err, data) => {
        if (err)
            return cb(err);

        let info = {};

        const regRes1 = data.match(/(^|[^#])#([^#\r\n]*)\r?\n?$/m);
        info.title = regRes1 ? regRes1[2].trim() : undefined;

        const thumbnailRegEx = new RegExp(`!\\[${thumbnailTag}]\\(([^)]*)\\)`, 'i');
        const regRes2 = data.match(thumbnailRegEx);
        info.thumbnail = regRes2 ? regRes2[1].trim() : undefined;

        cb(null, info);
    });
};

module.exports = (config) => {
    return {
        fileTree: config['test'] ? getFileTree : undefined,
        readIndexFile: config['test'] ? readIndexFile : undefined,
        fetchArticles: (cb) => {
            getFileTree(config['data_dir'], (err, fileList) => {
                if (err)
                    return cb(err);
                const paths = fileList
                    .map(path => path.substr(config['data_dir'].length))
                    .filter(path => path.indexOf(config['article']['index']) === path.length - config['article']['index'].length)
                    .map(path => path.substr(0, path.length - config['article']['index'].length))
                    .map(path => path.match(/^\/(\d{4})\/(\d{2})\/(\d{2})\/$/))
                    .filter(path => path && path.length > 1);
                if (paths.length === 0)
                    cb(null, []);
                const list = [];
                let remaining = 0;
                paths.forEach(path => {
                    const article = {
                        path: config['data_dir'] + path[0] + config['article']['index'],
                        year: parseInt(path[1]),
                        month: parseInt(path[2]),
                        day: parseInt(path[3])
                    };
                    remaining++;
                    readIndexFile(article.path, config['article']['thumbnail_tag'], (err, info) => {
                        if (err)
                            return cb(err);
                        article.title = info.title || config['article']['default_title'];
                        article.thumbnail = info.thumbnail ? (config['data_dir'] + path[0] + info.thumbnail) : config['article']['default_thumbnail'];
                        list.push(article);
                        remaining--;
                        if (remaining === 0)
                            cb(null, list);
                    });
                });

            });
        }
    };
};