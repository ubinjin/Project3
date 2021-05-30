require('dotenv').config();
var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var multer = require('multer');
var pool = mysql.createPool({
    connectionLimit: process.env.DB_connectionLimit,
    host: process.env.DB_host,
    port: process.env.DB_port,
    user: process.env.DB_user,
    password: process.env.DB_password,
    database: process.env.DB_database,
    dateStrings: process.env.DB_dateStrings
});


/* GET users listing. */
router.get('/', function(req, res) {
    res.render('joinForm', {
        title: '회원가입'
    });
});

router.post('/', function(req, res) {
    var RID = req.body.RID;
    var Rname = req.body.Rname;
    var password = req.body.password;
    var Address = req.body.Address;
    var Phone = req.body.Phone;
    var RRN = req.body.RRN;
    var datas = [RID, Rname, password, Address, Phone, RRN];
    pool.getConnection(function(err, connection) {
        var sqlForInsertRegisterinfo = "insert into register_info(RID, Rname, password, Address, Phone, RRN) values(?,?,?,?,?,?)";
        connection.query(sqlForInsertRegisterinfo, datas, function(err, rows) {
            if (err) {
                console.error(err);
                if (err.code == "ER_DUP_ENTRY")
                    res.send("<script>alert('이미 가입되어 있는 ID나 주민번호입니다.');history.back();</script>");
            }
            else {
                console.log("rows : " + JSON.stringify(rows));
                res.redirect('/admin/seller_list/1');
            }
            connection.release();
        });
    });
});

module.exports = router;
