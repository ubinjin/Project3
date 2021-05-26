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

router.get('/admin/qna', function(req, res, next) {
    res.redirect('admin/qna_list/1');
});
/* CLIENT_LIST, DETAILS START */

router.get('/admin/qna_list/:page', function(req, res, next) {
    pool.getConnection(function(err, connection) {
        var sqlQNAList = "select RID,Rname, Address, Phone, Ucase FROM qna_info";
        connection.query(sqlQNAList, function(err, rows) {
            if (err) console.error("err : " + err);
            res.render('clients_list', {
                title: '회원 관리',
                qna: rows
            });
            connection.release();
        });
    });
});

router.get('/admin/qna_list/:idx', function(req, res, next) {
    var idx = req.params.idx;
    console.log("idx : " + idx)
    pool.getConnection(function(err, connection) {
        var sqlQNADetail = "select * FROM qna_info where RID=?";
        connection.query(sqlQNADetail, [idx], function(err, row) {
            if (err) console.error("err : " + err);
            console.log('클라이언트 정보 : ', row);
            res.render('clients_details', {
                title: '고객 정보',
                qnas: row[0]
            });
        });
        connection.release();

    });
});

router.post('/delete', function(req, res, next) {
    var rid = req.body.RID;
    console.log("고객 삭제, RID : ", JSON.stringify(rid));
    pool.getConnection(function(err, connection) {
        var sql = "delete FROM qna_info where RID=?";
        connection.query(sql, [rid], function(err, result) {
            if (err) console.error("err : " + err);
            if (result.affectedRows == 0) {
                res.send("<script>alert('invalid request');history.back();</script>");
            }
            else {
                res.redirect('/admin');
            }
            connection.release();

        });
    });
});

/* CLIENT_LIST, DETAILS END */
module.exports = router;
