const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const rateLimit = require("express-rate-limit");
const app = require('../application');
const infra = require('../application/user');

module.exports = function (options = {}) {

    const server = express();

    server.set('trust proxy', 1);

    server.use(bodyParser.urlencoded({
        extended: false,
        limit: '50kb',
        //type: 'application/json'
    }));

    const limiter = rateLimit({
        windowMs: 5 * 60 * 1000, // 5 minutes
        max: 100 // limit each IP to 100 requests per windowMs
        });
    
        server.use(limiter);

        server.use(cors({
            origin: 'http://localhost:3000',
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
            credentials: true
          }));

    server.use(bodyParser.json({limit: "50kb"}));

    server.use((req, res, next) => {
        
        res.on("finish", function () {
            console.log(`${res.req.originalUrl} params: ${JSON.stringify(res.req.body)} status: ${res.statusCode}`);
        });

        if(!req.path.includes('login') && !req.path.includes('verify')) {
            const token = req.headers['authorization']
            
            if(!token) {
                return res.status(401).send('Unauthorized');
            }
            const admin = req.path.includes('admin')
            infra.auth(token, admin ? 'admin' : 'user', (err, result)=> {
                if(err) {
                    return res.status(500).send('Internal server Error');
                }
        
                if (!result.ok) {
                    return res.status(401).send('Unauthorized');
                }
        
                req.user = result.user;
                next();
            }) 
        } else {
            next();
        }
    })

    plugins = [
        {path: '/api/user', route: require('./user')},
        {path: '/api/appointments', route: require('./appointments')},
        {path: '/api/clinic', route: require('./clinic')},
        {path: '/api/doctor', route: require('./doctor')},
        {path: '/api/department', route: require('./department')},
        {path: '/api/schedule', route: require('./schedule')},
    ];

    plugins.forEach((p) => server.use(p.path, p.route));

    return server;
};