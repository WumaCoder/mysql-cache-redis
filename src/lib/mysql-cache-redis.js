const sqlAnalysis = require('./sql-analysis');
const redisEnca = require('./redis-enca');

let noReleaseConnection = 0;

let option = {
    cacheTime: 60 * 60,
    delayTime: 60 * 30,
    isRelease: false
};
//全局配置
let mysql = {};
//数据库对象

/**
 * @info 进行依赖的绑定
 * @param {Object} mysqlConnect 数据库连接对象
 * @param {Object} redisConnect Redis连接对象
 */
function bind(mysqlConnect, redisConnect, params = option) {
    mysql = mysqlConnect;
    redisEnca.bind(redisConnect);//绑定redis连接
    option.cacheTime = params.cacheTime || option.cacheTime;
    option.delayTime = params.delayTime || option.delayTime;
    option.isRelease = params.isRelease || option.isRelease;
}

/**
 * 
 * @param {Function} callback 回调函数
 * @callback (err,connection) err是否错误，connection连接对象
 */
function connect(callback) {
    let connection = null;
    /**
     * 查询
     * @param {String} sql sql语句
     * @param {Array} value 传值
     * @param {Function} callback 回调函数
     * @param {Object} tempConfig 临时配置
     */
    let query = async function (sql, value = [], callback, tempConfig = option) {
        if (typeof callback == 'object') {
            tempConfig.cacheTime = typeof callback.cacheTime == 'undefined' ? option.cacheTime : callback.cacheTime;
            tempConfig.delayTime = typeof callback.delayTime == 'undefined' ? option.delayTime : callback.delayTime;
            tempConfig.isRelease = typeof callback.isRelease == 'undefined' ? option.isRelease : callback.isRelease;
        } else {
            tempConfig.cacheTime = typeof tempConfig.cacheTime == 'undefined' ? option.cacheTime : tempConfig.cacheTime;
            tempConfig.delayTime = typeof tempConfig.delayTime == 'undefined' ? option.delayTime : tempConfig.delayTime;
            tempConfig.isRelease = typeof tempConfig.isRelease == 'undefined' ? option.isRelease : tempConfig.isRelease;
        }

        let sqlObj = sqlAnalysis.parser(sql, value);//解析sql语句
        let sqlStr = JSON.stringify(sqlObj);//转换sql
        let data = null;//sql查询的值

        if (sqlObj['SELECT'] && tempConfig.delayTime != -1) {
            data = await redisEnca.getCache(sqlStr, tempConfig.delayTime);//延时并取值
        }else if (!sqlObj['SELECT']) {
            redisEnca.flushdb();
        }

        if (!data) {
            if (!connection) {
                connection = await new Promise((resolve, reject) => {//获取连接
                    mysql.getConnection((err, connection) => {
                        if (err) {
                            console.error(err);
                            reject("数据库错误");
                        } else {
                            resolve(connection);
                        }
                    });
                });

                if (typeof callback == 'function') {
                    callback(err, connection);
                }

                noReleaseConnection++;//当前连接数加1
            }


            data = await new Promise((resolve, reject) => {//sql语句执行
                connection.query(sql, value, (err, data) => {
                    if (tempConfig.isRelease) {
                        connection.release();//返回池
                        connection = null;

                        noReleaseConnection--;//当前连接
                    }
                    if (typeof callback == 'function') {
                        callback(err, data);
                    }
                    if (err) {
                        console.error(err);
                        reject("查询错误");
                    } else {
                        resolve(data);
                    }

                    if (data.length && sqlObj['SELECT'] && tempConfig.cacheTime != -1) {//如果数据为空则不缓存，如果不是SELECT也不缓存
                        redisEnca.setCache(sqlStr, data, tempConfig.cacheTime);//存储 
                    }
                });
            });
        }

        return data;
    }

    /**
     * 释放
     * @param {Function} callback 回调函数
     */
    let release = function (callback) {
        if (typeof callback == 'function') {
            callback();
        }
        if (connection) {//如果存在
            connection.release();//返回池
            noReleaseConnection--;//当前连接
        }

        connection = null;
        query = null;
        release = null;
    }

    return { query, release };
}

function status(callback,print) {
    if (print || callback === true) {
        console.log({noReleaseConnection,option});
    }

    if (typeof callback == 'function') {
        callback({noReleaseConnection,option});
    }
    return {noReleaseConnection,option}
}

module.exports = { bind, connect, status };