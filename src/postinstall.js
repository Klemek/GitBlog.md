const fs = require('fs');
const ncp = require('ncp').ncp;

const pad0 = n => ('0'+n).substr(-2);

const datetime = new Date();
const dir = `./data/${datetime.getFullYear()}/${pad0(datetime.getMonth())}/${pad0(datetime.getDay())}/`;

if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, {recursive: true});
}

ncp('./sample_data/',dir, function(err){
    if(err)
        console.error(err);
    else
        console.log('done');
});