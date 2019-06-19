const express = require('express');
const app = express();

module.exports = function(/*config*/){
    app.get('/', (req,res) => {
        res.status(200).send('Hello World!');
    });

    return app;
};


