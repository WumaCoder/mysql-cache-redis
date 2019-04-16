const mysql = require('mysql');
const redis = require('redis');
const sqlObj = require('./sql');

let option = {};
//全局配置
let pool = {};
//数据库对象
let conn = {};
//当前连接对象
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

function release() {
    //使用这个撤销连接池可能会出错
    conn.release();
}

/**
 * 
 * @param {String} sql sql语句
 * @param {Array} value 传值
 * @param {Boolean||Function} isAutoReleaseOrCallback 是否自动退出池或者回调函数
 * @param {Function} callback(err,data) 回调 err是否错误，data数据库数据
 */
async function query(sql, value = [], isAutoReleaseOrCallback = true, callback = (err, data) => { }) {
    try {

        if (typeof isAutoReleaseOrCallback == 'function') {//检查isAotuRelease是否为函数
            callback = isAutoReleaseOrCallback;
            isAutoReleaseOrCallback = true;
        }

        let sqlArr = sqlObj.parser(sql);//解析sql语句
        sqlArr.push(value);//添加sql传值
        let sqlStr = JSON.stringify(sqlArr);//转换sql
        let data = null;//sql查询的值

        if (sqlArr[0] == 'SELECT') {
            data = await new Promise((resolve, reject) => {//获取缓存数据
                client.exists(sqlStr, (err, data) => {
                    if (err) {
                        console.log(err);
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
                        console.log(err);
                        reject("数据库错误");
                    } else {
                        resolve(connection);
                    }
                });
            });

            conn = connection;//全局化connection

            data = await new Promise((resolve, reject) => {//sql语句执行
                connection.query(sql, value, (err, data) => {
                    if (err) {
                        console.log(err);
                        reject("查询错误");
                    } else {
                        resolve(data);
                    }
                });
            });

            if (isAutoReleaseOrCallback) {
                connection.release();//返回池
            }

            if (data.length && sqlArr[0] == 'SELECT') {
                client.set(sqlStr, JSON.stringify(data));//数据缓存
                client.expire(sqlStr, option.cacheTime);//缓存时间1小时
            }
        }

        callback(null, data);
        return data;
    } catch (error) {
        console.log(error);
        if (isAutoReleaseOrCallback) {
            connection.release();
        }
        callback(error, null);
        return error;
    }
}

module.exports = { createPool, release, query };