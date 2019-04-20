
function main(init) {
    let sum = init;
    let query = function(num) {
        console.log(typeof sum);
        
        if (num) {
            sum += num;
        }else{
            sum = null;
        }
        
        console.log(sum);
        
    }
    return query;
}
let t = main(0);


t(12);
t(null);
t(12);