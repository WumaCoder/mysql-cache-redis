const sqlAnalysis = require('./sql-analysis');

let a = sqlAnalysis.parser('insert into table values(1,2,3,4,5);',[1,2]);
console.log(a);

