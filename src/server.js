const config = require('./config')();
const app = require('./app')(config);

app.start();