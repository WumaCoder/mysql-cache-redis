module.exports =async (req,res)=>{
    let mc = mysqlCache;
    let data = await mc.sqlQuery('select  *  from  goodproteins where ko=?;',['K0119'],true);
    console.log(data);
    res.send(data).end();
}