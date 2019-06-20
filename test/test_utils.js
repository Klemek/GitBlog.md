const fs = require('fs');

const deleteFolderSync = (path) => {
    if (!fs.existsSync(path))
        return;
    fs.readdirSync(path, {withFileTypes: true}).forEach((item) => {
        if (item.isDirectory())
            deleteFolderSync(`${path}/${item.name}`);
        else
            fs.unlinkSync(`${path}/${item.name}`);
    });
    fs.rmdirSync(path);
};

module.exports = {
    deleteFolderSync: deleteFolderSync,
    createEmptyDirs: list => list.forEach(path => fs.mkdirSync(path, {recursive: true})),
    createEmptyFiles: list => list.forEach(file => fs.writeFileSync(file, '')),
};