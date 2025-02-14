const api = require('./api') 
const db = require('./db') 

let httpPort = process.env.PORT || 3000;
const s = api().listen(httpPort, '0.0.0.0', (o) => {
    console.log(`Example app listening on port ${httpPort}`)
})

process.on('uncaughtException', function (err) {
    console.log(err);
});

process.on('exit', ()=> {
    console.log('exit')
    s.close()
})