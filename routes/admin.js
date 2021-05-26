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

router.get('/', function(req, res, next) {
    res.redirect('admin/clients_list/1');
});

/* CLIENT_LIST, DETAILS START */

router.get('/clients_list/:page', function(req, res, next) {
    pool.getConnection(function(err, connection) {
        var sqlClientsList = "select RID,Rname, Address, Phone, Ucase FROM register_info";
        connection.query(sqlClientsList, function(err, rows) {
            if (err) console.error("err : " + err);
            res.render('clients_list', {
                title: '회원 관리',
                clients: rows
            });
            connection.release();
        });
    });
});

router.get('/clients_details/:idx', function(req, res, next) {
    var idx = req.params.idx;
    pool.getConnection(function(err, connection) {
        var sqlClientDetail = "select * FROM register_info where RID=?";
        connection.query(sqlClientDetail, [idx], function(err, row) {
            if (err) console.error("err : " + err);
            console.log('클라이언트 정보 : ', JSON.stringify(row));
            res.render('clients_details', {
                title: '고객 정보',
                clientInfo: row[0]
            });
        });
        connection.release();

    });
});

router.post('/delete', function(req, res, next) {
    var rid = req.body.RID;
    console.log("고객 삭제, RID : ", JSON.stringify(rid));
    pool.getConnection(function(err, connection) {
        var sql = "delete FROM register_info where RID=?";
        connection.query(sql, [rid], function(err, result) {
            if (err) {
                res.send("<script>alert('invalid request, Check request if FK ref problem');history.back();</script>");
                console.error("err : " + err);
            }
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

/* QNA_LIST , DETAILS START */

router.get('/qna', function(req, res, next) {
    res.redirect('admin/qna_list/1');
});
/* CLIENT_LIST, DETAILS START */

router.get('/qna_list/:page', function(req, res, next) {
    pool.getConnection(function(err, connection) {
        var sqlQNAList = "select * FROM qna_info";
        connection.query(sqlQNAList, function(err, rows) {
            if (err) console.error("err : " + err);
            res.render('qna_list', {
                title: '회원 관리',
                qnas: rows
            });
            connection.release();
        });
    });
});

router.get('/qna_details/:idx', function(req, res, next) {
    var idx = req.params.idx;
    console.log("idx : " + idx)
    pool.getConnection(function(err, connection) {
        var sqlQNADetail = "select * FROM qna_info where RID=?";
        connection.query(sqlQNADetail, [idx], function(err, row) {
            if (err) console.error("err : " + err);
            console.log('QNA Details : ', row);
            res.render('qna_details', {
                title: 'Q&A',
                qna: row[0]
            });
        });
        connection.release();

    });
});


/* QNA_LIST , DETAILS END */
module.exports = router;
