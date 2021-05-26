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

// router.get('/update', function(req, res, next) {
//     var idx = req.query.idx;
//     pool.getConnection(function(err, connection) {
//         var sql = "select idx, creator_id, title, content, hit, file_path, image_name FROM board where idx=?";
//         connection.query(sql, [idx], function(err, rows) {
//             if (err) console.error("err : " + err);
//             console.log('글 : ' + idx);
//             res.render('update', {
//                 title: "글 수정",
//                 row: rows[0]
//             });
//             connection.release();
//         });
//     });
// });


// router.post('/update', upload.single('image'), function(req, res, next) {
//     var idx = req.body.idx;
//     var creator_id = req.body.creator_id;
//     var title = req.body.title;
//     var content = req.body.content;
//     var passwd = req.body.passwd;
//     console.log("result :", idx);
//     if (req.file) {
//         var file_path = req.file.path;
//         var image_name = req.file.originalname;
//     }
//     else {
//         var file_path = "";
//         var image_name = "";
//     }
//     var datas = [creator_id, title, content, file_path, image_name, idx, passwd];

//     pool.getConnection(function(err, connection) {
//         var sqlStat = "update board set creator_id=?, title=?, content=?,file_path=?,image_name=? where idx=? and passwd=?";
//         connection.query(sqlStat, datas, function(err, result) {
//             if (err) console.error("err : " + err);
//             if (result.affectedRows == 0) {
//                 res.send("<script>alert('password not match or invalid request');history.back();</script>");
//             }
//             else {
//                 res.redirect('/board/read/' + idx);
//             }
//             connection.release();
//         });
//     });
// });

// router.get('/delete', function(req, res, next) {
//     var idx = req.query.idx;
//     console.log("idx : " + idx);
//     res.render('delete', {
//         title: "게시판 글 삭제",
//         idx: idx
//     });
// });

module.exports = router;
