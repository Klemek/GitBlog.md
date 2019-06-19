const config = require('./config')();
const app = require('./app')(config);

app.listen(config['node_port'], () => {
    console.log(`gitblog.md server listening on port ${config['node_port']}`);
});

