# mysql-cache-redis
## 他是什么？
    mysql-cache-redis 是一个基于redis的缓存技术来实现mysql的简单有效的缓存技术，
    通过redis进行sql查询后mysql-cache-redis会自动将查询的结果进行缓存到redis的0
    号数据库，key为sql语句，value为查询结果，并且设置一定的有效时间（每次访问会进行
    延迟操作），在下一次进行查询的时候，mysql-cache-redis会自动的从redis中获取数
    据，如果数据发送变化redis会清空变化的表的缓存。

## 使用他你需要准备什么？
- 必须会使用mysql
- 必须安装启动redis
- 必须会nodejs
- 必须会sql语句

## 快速上手
### 安装

```bash
npm i mysql-cache-redis -S
# 安装 mysql-cache-redis
```

### 配置

```js

const mcr = require('mysql-cache-redis');
const mysql = require('mysql');
const redis = require('redis');
//引入包
const mysqlConfig = {//mysql配置
    host:'localhost',//主机地址
    port:3306,//端口号
    database:'test',//数据库名
    username:'root',//用户名
    password:'',//密码
    connectionLimit:10//池连接限制
    //... 可以使用mysql包的其他配置
};

const redisConfig = {//redis配置
    host:'localhost',//主机地址
    post:6379//端口号
    //... 可以使用redis包的其他配置配置
};

let pool = mysql.createPool(mysqlConfig);
let client = redis.createClient(redisConfig);

const mcroptions = {
    cacheTime: 60 * 60,//缓存时间 -1表示全局不缓存，0表示没有缓存时间
    delayTime: 60 * 30,//下次访问延迟多少秒 -1表示全局不延迟 0表示永不过期
    isRelease: false//是否自动释放默认 不自动释放连接
};
//mysql-cache-reids 的全局配置

mcr.bind(pool,client,mcroptions);
//绑定对象

global.mcr = mcr;
//全局化mcr

```
### 使用

#### 查看状态
```js

    mrc.status(true);//查看并打印true表示打印

```

#### 执行sql语句
```js

    (async ()=>{
        try{
            let connect = mcr.connect();
            let data = await connect.query(`SELECT * FROM TABLE WHERE ID=?;`,[12]);
            connect.release();
        }catch(err){
            
        }
    })();

```

### 版本说明
####0.0.5
    记录版本信息，优化代码，实现基础操作
