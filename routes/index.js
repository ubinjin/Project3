require('dotenv').config();
var express = require('express');
var router = express.Router();
var mysql = require('mysql');

var pool = mysql.createPool({
    connectionLimit: process.env.DB_connectionLimit,
    host: process.env.DB_host,
    port: process.env.DB_port,
    user: process.env.DB_user,
    password: process.env.DB_password,
    database: process.env.DB_database
});

/* GET home page. */
router.get('/', function(req, res, next) {
    pool.getConnection(function(err, connection) {
        console.log("error :" + JSON.stringify(err))
        connection.query('SELECT * FROM register_info', function(err, rows) {
            if (err) console.error("err : " + err);
            console.log("rows : " + JSON.stringify(rows));

            res.render('index', {
                title: "db_test",
                rows: rows
            });
            connection.release();
        });
    });
});
module.exports = router;
