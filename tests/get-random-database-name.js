function randomString(length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}
function randomName(){
     return `testdb_${randomString(8, '0123456789abcdefghijklmnopqrstuvwxyz')}`;
    

}
exports.getRandomDatabaseName=randomName;
