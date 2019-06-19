const config = require('./config.json');
const app = require('./app')(config);

const port = config.nodePort|3000;

app.listen(config.nodePort|3000, () => {
    console.log(`gitblog.md server listening on port ${port}`);
});

