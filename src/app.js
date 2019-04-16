const express = require('express');
const expressApiRouting = require('express-api-routing');
const configMysql = require('./config/mysql');
const configRedis = require('./config/redis');
const mysqlCache = require('./lib/mysql-cache');
const app = express();

let gs = mysqlCache.createPool(configMysql,configRedis);
gs.mysqlCache = mysqlCache;

expressApiRouting.globalStore(gs);
app.use(expressApiRouting.static(__dirname,'./api'));

app.listen(80, () => {
    console.log('Example app listening on port 80!');
});

//Run app, then load http://localhost:80 in a browser to see the output.