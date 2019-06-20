const fs = require('fs');
const ncp = require('ncp').ncp;

const copy = (src,dest) => {
    ncp(src,dest, function(err){
        if(err)
            console.error(err);
        else
            console.log(`copied ${src} to ${dest}`);
    });
};

copy('./src/config.default.json','./config.example.json');

if (!fs.existsSync('./data')) {
    fs.mkdirSync('./data');

    copy('./sample_data/home','./data');

    const pad0 = n => ('0'+n).substr(-2);

    const datetime = new Date();
    const dir = `./data/${datetime.getFullYear()}/${pad0(datetime.getMonth()+1)}/${pad0(datetime.getDate())}`;

    if (!fs.existsSync(dir))
        fs.mkdirSync(dir, {recursive: true});

    copy('./sample_data/article',dir);
}