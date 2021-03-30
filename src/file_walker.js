const fs = require('fs');
const path = require('path');

const joinUrl = (...paths) => path.join(...paths).replace(/\\/g, '/');

/**
 * Get all files path inside a given folder path
 * @param dir
 * @param cb
 */
const getFileTree = (dir, cb) => {
    let list = [];
    let remaining = 0;
    fs.readdir(dir, {withFileTypes: true}, (err, items) => {
        if (err) {
            return cb(err);
        }
        items.forEach((item) => {
            if (item.isDirectory()) {
                remaining++;
                getFileTree(path.join(dir, item.name), (err, out) => {
                    if (err) {
                        return cb(err);
                    }
                    list.push(...out);
                    remaining--;
                    if (remaining === 0) {
                        cb(null, list);
                    }
                });
            } else {
                list.push(path.join(dir, item.name));
            }
        });
        if (remaining === 0) {
            cb(null, list);
        }
    });
};

/**
 * Tries to read a markdown file and match a title and a thumbnail
 * @param path
 * @param thumbnailTag - how the thumbnail image desc is given as ![thumbnailTag](url)
 * @param cb
 */
const readIndexFile = (path, thumbnailTag, cb) => {
    fs.readFile(path, {encoding: 'UTF-8'}, (err, data) => {
        if (err) {
            return cb(err);
        }

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
        /**
     * find and read all articles inside the data directory
     * @param cb
     */
        fetchArticles: (cb) => {
            getFileTree(config['data_dir'], (err, fileList) => {
                if (err) {
                    return cb(err);
                }
                const paths = fileList
                    .map((p) => p.substr(config['data_dir'].length + 1).split(path.sep))
                    .filter((p) => p.length === 4 && (p[3] === config['article']['index'] || p[3] === config['article']['draft']) &&
            /^\d{4}$/.test(p[0]) && /^\d{2}$/.test(p[1]) && /^\d{2}$/.test(p[2]));
                if (paths.length === 0) {
                    cb(null, {});
                }
                const articles = {};
                let remaining = 0;
                paths.forEach((p) => {
                    const article = {
                        path: joinUrl(p[0], p[1], p[2]),
                        draft: p[3] === config['article']['draft'],
                        realPath: path.join(config['data_dir'], p[0], p[1], p[2], p[3]),
                        year: parseInt(p[0]),
                        month: parseInt(p[1]),
                        day: parseInt(p[2])
                    };
                    article.date = new Date(article.year, article.month, article.day);
                    article.date.setUTCHours(0);
                    remaining++;
                    readIndexFile(article.realPath, config['article']['thumbnail_tag'], (err, info) => {
                        if (err) {
                            return cb(err);
                        }
                        article.title = info.title || config['article']['default_title'];
                        article.thumbnail = info.thumbnail ? joinUrl(article.path, info.thumbnail) : config['article']['default_thumbnail'];
                        article.escapedTitle = article.title.toLowerCase().replace(/[^\w]/gm, ' ').trim().replace(/ /gm, '_');
                        article.url = '/' + joinUrl(article.path, article.escapedTitle) + '/';
                        if (!articles[article.path] || !article.draft) {
                            articles[article.path] = article;
                        }
                        remaining--;
                        if (remaining === 0) {
                            cb(null, articles);
                        }
                    });
                });

            });
        }
    };
};