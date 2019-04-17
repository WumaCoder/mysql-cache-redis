const mysql = require('mysql');
const redis = require('redis');
const sqlObj = require('./sql');

let option = {};
//全局配置
let pool = {};
//数据库对象
let client = {};
//Redis连接对象
/**
 * 
 * @param {Object} mysqlConfig mysql连接信息
 * @param {Object} redisConfig redis连接信息
 * @param {Object} options 选项
 * @returns {Object} {pool,client} pool数据库连接 client redis连接对象
 */
function createPool(mysqlConfig = { host: 'localhost', port: 3306, database: "", username: 'root', password: '12345678', connectionLimit:10}, redisConfig = { host: 'localhost', port: 6379 }, options = { cacheTime: 60 * 60 * 1}) {
    pool = mysql.createPool(mysqlConfig);
    client = redis.createClient(redisConfig);
    client.on('error', (err) => {
        console.log(err);
    });
    option = options;

    return { pool, client };
}

/**
 * 
 * @param {String} sql sql语句
 * @param {Array} value 传值
 * @param {Boolean||Function} isAutoRelease 是否自动退出池或者回调函数
 * @param {Function} callback(err,data) 回调 err是否错误，data数据库数据
 */
async function query(sql, value = [], callback = (err, data) => { },isAutoRelease = true,isCache = true) {
    try {

        if (typeof callback == 'boolean') {//检查isAotuRelease是否为函数
            isCache = isAutoRelease;
            isAutoRelease = callback;
        }

        let sqlArr = sqlObj.parser(sql);//解析sql语句
        sqlArr.push(value);//添加sql传值
        let sqlStr = JSON.stringify(sqlArr);//转换sql
        let data = null;//sql查询的值

        if (sqlArr[0] == 'SELECT' && isCache) {
            data = await new Promise((resolve, reject) => {//获取缓存数据
                client.exists(sqlStr, (err, data) => {
                    if (err) {
                        console.error(err);
                        reject("client错误");
                    } else {
                        if (data) {//表示缓存存在
                            client.expire(sqlStr, option.cacheTime);//缓存时间s
                            client.get(sqlStr, (err, data) => {
                                //获取缓存
                                resolve(JSON.parse(data));//json转换
                            });
                        } else {
                            resolve(null);
                        }
                    }
                })
            });

        }

        if (!data) {//如果缓存不存在则进行查询缓存
            let connection = await new Promise((resolve, reject) => {//获取连接
                pool.getConnection((err, connection) => {
                    if (err) {
                        console.error(err);
                        reject("数据库错误");
                    } else {
                        resolve(connection);
                    }
                });
            });

            conn = connection;//全局化connection

            data = await new Promise((resolve, reject) => {//sql语句执行
                connection.query(sql, value, (err, data) => {
                    if (isAutoRelease) {//检查是否释放连接
                        connection.release();//返回池
                    }
                    if (err) {
                        console.error(err);
                        reject("查询错误");
                    } else {
                        resolve(data);
                    }
                });
            });

            if (data.length && sqlArr[0] == 'SELECT' && isCache) {//如果数据为空则不缓存，如果不是SELECT也不缓存
                client.set(sqlStr, JSON.stringify(data));//数据缓存
                client.expire(sqlStr, option.cacheTime);//缓存时间1小时
            }
        }
        if (typeof callback == 'function') {
            callback(null, data);
        }
        
        return data;
    } catch (error) {
        console.error(error);
        if (typeof callback == 'function') {
            callback(null, data);
        }
        return error;
    }
}

module.exports = { createPool,  query };