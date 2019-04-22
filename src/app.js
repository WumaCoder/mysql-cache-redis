const express = require('express');
const redis = require('redis');
const mysql = require('mysql');
const redisConfig = require('./config/redis');
const mysqlConfig = require('./config/mysql');
const mcr = require('./lib/mysql-cache-redis');

let client = redis.createClient(redisConfig);
let pool = mysql.createPool(mysqlConfig);

mcr.bind(pool,client,{cacheTime:-1,delayTime:-1,isRelease:false});

let app = express();

app.get('/test',async (req,res)=>{
    let connect = mcr.connect();
    let data = await connect.query(`select * from goodproteins where ko like '%${Math.floor(Math.random()*100)}%' limit ${Math.floor(Math.random()*100)}`);
    console.log(data);
    mcr.status(true);
    connect.release();
    
    
    res.send({success:1});
});

app.use(express.static('./static/'));


app.listen(8080);