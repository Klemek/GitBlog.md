const fs = require('fs');

const fileTree = (path, cb) => {
    let list = [];
    let remaining = 0;
    fs.readdir(path, {withFileTypes: true}, (err, items) => {
        if (err)
            return cb(err);
        items.forEach((item) => {
            if (item.isDirectory()) {
                remaining++;
                fileTree(`${path}/${item.name}`, (err, out) => {
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

const readIndexFile = (path,cb) => {
    //TODO reading page title and possibly ![thumbnail](url)
};

module.exports = (config) => {
    return {
        fileTree: config['test'] ? fileTree : undefined,
        readIndexFile: config['test'] ? readIndexFile : undefined,
        fetchArticles: (cb) => {
            fileTree(config['data_dir'], (err, fileList) => {
                if (err)
                    return cb(err);
                const paths = fileList
                    .map(path => path.substr(config['data_dir'].length))
                    .filter(path => path.indexOf(config['article']['index']) === path.length - config['article']['index'].length)
                    .map(path => path.substr(0, path.length - config['article']['index'].length))
                    .map(path => path.match(/^\/(\d{4})\/(\d{2})\/(\d{2})\/$/))
                    .filter(path => path && path.length > 1);
                const list = [];
                paths.forEach(path => {
                    list.push({
                        path: config['data_dir'] + path[0] + config['article']['index'],
                        year: parseInt(path[1]),
                        month: parseInt(path[2]),
                        day: parseInt(path[3])
                    });
                });
                cb(null, list);
            });
        }
    };
};