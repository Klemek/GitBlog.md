const fs = require('fs');

/**
 * Import client-side script into the "global" var
 * @param scriptPath
 */
module.exports = (scriptPath) => {
    eval.call(global, fs.readFileSync(scriptPath, { encoding: 'UTF-8' }));
};

