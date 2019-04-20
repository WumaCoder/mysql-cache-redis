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

function parser(sql) {  
    let sqlArr = wordParser(sql);
    for (let i = 0; i < sqlArr.length; i++) {
        sqlArr[i] = sqlArr[i].toUpperCase();
    }
    return sqlArr;
}

module.exports = {parser};