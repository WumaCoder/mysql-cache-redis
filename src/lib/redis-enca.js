let client;//reids实例
let options;//配置变量

/**
 * 
 * @param {*} params redis实例
 * @param {*} opts 配置信息 {cacheTime,delayTime}
 */
function bind(params, opts = {
    cacheTime: 60 * 60,
    delayTime: 60 * 30
}) {
    client = params;
    if (opts) {
        options = opts;
    }
}
/**
 * 获取缓存
 * @param {String} key 字符串
 * @param {Number} delayTime
 */
function getCache(key, delayTime = options.delayTime) {
    return new Promise((resolve, reject) => {//获取缓存数据
        client.exists(key, (err, value) => {//检查key是否存在
            if (err) {
                console.error(err);
                reject("client错误");
            } else {
                if (value) {//表示缓存存在
                    client.expire(key, delayTime);//设置缓存时间
                    client.get(key, (err, value) => {
                        //获取缓存 
                        if (err) {
                            console.error(err);
                            reject("数据获取失败");
                        } else {
                            if (typeof json == 'object') {
                                resolve(JSON.parse(value));//json转换
                            } else if (typeof json == 'array') {
                                resolve(JSON.parse(value));//json转换
                            } else {
                                resolve(value);//原数据
                            }
                        }
                    });
                } else {
                    resolve(null);
                }
            }
        })
    });
}

/**
 * 
 * @param {String} key 
 * @param {all} value 
 * @param {Number} cacheTime 过期时间（s）
 */
function setCache(key, value, cacheTime = options.cacheTime) {
    if (value) {//如果数据为空则不缓存
        if (typeof value == 'object') {
            client.set(key, JSON.stringify(value));//数据缓存
        } else if (typeof value == 'array') {
            client.set(key, JSON.stringify(value));//数据缓存
        } else {
            client.set(key, value);//数据缓存
        }

        client.expire(key, cacheTime);//缓存时间
    }
}

module.exports = { getCache, setCache, bind }