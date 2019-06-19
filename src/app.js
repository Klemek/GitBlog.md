const express = require('express');
const app = express();

module.exports = (/*config*/) => {
    app.get('/', (req,res) => {
        res.status(200).send('Hello World!');
    });

    return app;
};


