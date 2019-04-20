const sqlAnalysis = require('./sql-analysis');
const redisEnca = require('./redis-enca');

let option = {};
//全局配置
let mysql = {};
//数据库对象
let client = {};
//Redis连接对象

/**
 * 
 * @param {Object} mysqlConnect 数据库连接对象
 * @param {Object} redisConnect Redis连接对象
 */
function bind(mysqlConnect,redisConnect) {
    mysql = mysqlConnect;
    client = redisConnect;
    redisEnca.bind(redisConnect);
}

/**
 * 
 * @param {Object} params 配置
 */
function config(params={
    cacheTime:60*60,
    delayTime:60*30,
    isAutoRelease:true
}) {
    option = params;
}

/**
 * 
 * @param {String} sql sql语句
 * @param {Array} value 传值
 * @param {Function} callback(err,data) 回调 err是否错误，data数据库数据
 */
async function query(sql, value = [], callback = (err, data) => { },tempConfig = option) {
    try {
        if (typeof callback == 'object') {
            tempConfig.cacheTime = callback.cacheTime || option.cacheTime;
            tempConfig.delayTime = callback.delayTime || option.delayTime;
            tempConfig.isAutoRelease = callback.isAutoRelease || option.isAutoRelease;
        }else{
            tempConfig.cacheTime = tempConfig.cacheTime || option.cacheTime;
            tempConfig.delayTime = tempConfig.delayTime || option.delayTime;
            tempConfig.isAutoRelease = tempConfig.isAutoRelease || option.isAutoRelease;
        }
        
        let sqlArr = sqlAnalysis.parser(sql);//解析sql语句
        sqlArr.push(value);//添加sql传值
        let sqlStr = JSON.stringify(sqlArr);//转换sql
        let data = null;//sql查询的值

        if (sqlArr[0] == 'SELECT' && option.cacheTime) {
            data = await redisEnca.getCache(sqlStr,tempConfig.delayTime);//延时并取值
        }

        if (!data) {//如果缓存不存在则进行查询缓存
            let connection = await new Promise((resolve, reject) => {//获取连接
                mysql.getConnection((err, connection) => {
                    if (err) {
                        console.error(err);
                        reject("数据库错误");
                    } else {
                        resolve(connection);
                    }
                });
            });

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

            if (data.length && sqlArr[0] == 'SELECT' && tempConfig.cacheTime) {//如果数据为空则不缓存，如果不是SELECT也不缓存
                redisEnca.setCache(sqlStr,data,tempConfig.cacheTime);//存储 
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

module.exports = { bind,config, query };