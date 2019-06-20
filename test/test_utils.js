const fs = require('fs');
const path = require('path');

const deleteFolderSync = (dir) => {
    if (!fs.existsSync(dir))
        return;
    fs.readdirSync(dir, {withFileTypes: true}).forEach((item) => {
        if (item.isDirectory())
            deleteFolderSync(path.join(dir,item.name));
        else
            fs.unlinkSync(path.join(dir,item.name));
    });
    fs.rmdirSync(dir);
};

module.exports = {
    deleteFolderSync: deleteFolderSync,
    createEmptyDirs: (list) =>list.forEach((path) =>fs.mkdirSync(path, {recursive: true})),
    createEmptyFiles: (list) =>list.forEach((file) =>fs.writeFileSync(file, '')),
};