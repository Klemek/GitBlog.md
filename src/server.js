const config = require('./config');
const app = require('./app')(config);

app.listen(config.nodePort, () => {
    console.log(`gitblog.md server listening on port ${config.nodePort}`);
});

