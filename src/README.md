# mysql-cache-redis
## 他是什么？
    mysql-cache-redis 是一个基于redis的缓存技术来实现mysql的简单有效的缓存技术，
    通过redis进行sql查询后mysql-cache-redis会自动将查询的结果进行缓存到redis的0
    号数据库，key为sql语句，value为查询结果，并且设置一定的有效时间（每次访问会进行
    延迟操作），在下一次进行查询的时候，mysql-cache-redis会自动的从redis中获取数
    据，如果数据发送变化redis会清空变化的表的缓存。

## 使用他你需要准备什么？
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

const mysqlCacheRedis = require('mysql-cache-redis');
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

const options = {
    cacheTime: 60 * 60 * 1//缓存的生存时间默认1小时，秒为单位
};

mysqlCacheRedis.createPool(mysqlConfig,redisConfig,options);
//创建池连接

```
### 使用

```js
//不用担心连接释放问题，他会自动释放
//sql执行方法一
const sql = 'select * from test;';

mysqlCacheRedis.query(sql,(err,data)=>{
    if(err){
        console.log(err);
    }else{
        data;//数据库查询的数据
    }
},true,true);//第一个true表示自动释放（默认），第二个true表示是否缓存

//第二种方法
(async function(){
    try{
        let data = await mysqlCacheRedis.query(sql);
        data;//获取的数据
    }catch(err){
        console.log(err);
    }
})();

```