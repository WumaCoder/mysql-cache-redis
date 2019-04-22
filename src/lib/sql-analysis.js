/**
 * 
 * @param {String} str 语句
 * @returns {Array} 拆分单词
 */
function wordParser(str) {  
    str = str.split(" ");
    for (let i = 0; i < str.length; i++) {
        const item = str[i];
        if (item=="") {
            str.splice(i,1);
            i--;
        }
    }
    return str;
}

function parser(sql,value) {
    for (let i = 0; i < value.length; i++) {//?号替换
        const item = value[i];
        sql = sql.replace('?',item); 
    }
    
    let sqlArr = wordParser(sql);//单词拆分
    for (let i = 0; i < sqlArr.length; i++) {
        sqlArr[i] = sqlArr[i].toUpperCase();
    }
    //单词分割并且转为大写
    let sqlObj = {};
    let keyword = {'SELECT':true,'FROM':true,'WHERE':true,'GROUP':true,'ORDER':true, 'LIMIT':true,
                    'INSERT':true,'SET':true, 'VALUES':true,
                    'UPDATE':true};//关键字列表
    let temp;//临时变量
    for (let i = 0; i < sqlArr.length; i++) {
        const item = sqlArr[i];
        if (keyword[item]) {
            sqlObj[item] = "";
            temp = item;
        }else{
            sqlObj[temp] += item;
        }
    }

    return sqlObj;
}

let json = {
    select:"*",
    from:'table',
    where:'a=?',
    groupby:'filed',
    orderby:'filed desc',
    limit:'5,10',
    response:[]
}

module.exports = {parser};