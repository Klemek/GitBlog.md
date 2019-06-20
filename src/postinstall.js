const fs = require('fs');
const path = require('path');
const ncp = require('ncp').ncp;

const copy = (src, dest) => {
    ncp(src, dest, function (err) {
        if (err)
            console.error(err);
        else
            console.log(`copied ${src} to ${dest}`);
    });
};

copy(path.join('src', 'config.default.json'), 'config.example.json');

if (!fs.existsSync('data')) {
    fs.mkdirSync('data');

    copy(path.join('sample_data','home'), 'data');

    const pad0 = (n) =>('0' + n).substr(-2);

    const datetime = new Date();
    const dir = path.join('data', datetime.getFullYear().toString(), pad0(datetime.getMonth() + 1), pad0(datetime.getDate()));

    if (!fs.existsSync(dir))
        fs.mkdirSync(dir, {recursive: true});

    copy(path.join('sample_data','article'), dir);
}