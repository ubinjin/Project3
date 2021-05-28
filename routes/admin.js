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

var storage = multer.diskStorage({ // 2
    destination(req, file, cb) {
        cb(null, 'upload/');
    },
    filename(req, file, cb) {
        cb(null, `${Date.now()}__${file.originalname}`);
    },
});

var upload = multer({
    storage: storage
});

router.get('/clients_list', function(req, res, next) {
    res.redirect('clients_list/1');
});
router.get('/qna_list', function(req, res, next) {
    res.redirect('qna_list/1');
});
router.get('/notice_list', function(req, res, next) {
    res.redirect('notice_list/1');
});

/* CLIENT_LIST, DETAILS START */

router.get('/client_list/:page', function(req, res, next) {
    pool.getConnection(function(err, connection) {
        var sqlClientsList = "select RID,Rname, Address, Phone, Ucase FROM register_info";
        connection.query(sqlClientsList, function(err, rows) {
            if (err) console.error("err : " + err);
            res.render('client_list', {
                title: '회원 관리',
                clients: rows
            });
            connection.release();
        });
    });
});

router.get('/client_detail/:idx', function(req, res, next) {
    var idx = req.params.idx;
    pool.getConnection(function(err, connection) {
        var sqlClientDetail = "select * FROM register_info where RID=?";
        connection.query(sqlClientDetail, [idx], function(err, row) {
            if (err) console.error("err : " + err);
            console.log('클라이언트 정보 : ', JSON.stringify(row));
            res.render('client_detail', {
                title: '고객 정보',
                clientInfo: row[0]
            });
        });
        connection.release();

    });
});

router.post('/client_delete', function(req, res, next) {
    var rid = req.body.RID;
    console.log("고객 삭제, RID : ", JSON.stringify(rid));
    pool.getConnection(function(err, connection) {
        var sql = "delete FROM register_info where RID=?";
        connection.query(sql, [rid], function(err, result) {
            if (err) {
                res.send("<script>alert('invalid request, Check request if FK ref problem');history.back();</script>");
                console.error("err : " + err);
            }
            else if (result.affectedRows == 0) {
                res.send("<script>alert('invalid request');history.back();</script>");
            }
            else {
                res.send("<script>alert('삭제됐습니다.');window.location='http://localhost:1001/admin/client_list/1';window.reload(true);</script>");
            }
            connection.release();

        });
    });
});

/* CLIENT_LIST, DETAILS END */

/* QNA_LIST , DETAILS START */

router.get('/qna', function(req, res, next) {
    res.redirect('/qna_list/1');
});

router.get('/qna_list/:page', function(req, res, next) {
    pool.getConnection(function(err, connection) {
        var sqlQNAList = "select q.*,Rname FROM qna_info as q join register_info on Q_RID=RID";
        connection.query(sqlQNAList, function(err, rows) {
            if (err) console.error("err : " + err);
            res.render('qna_list', {
                title: 'Q&A 관리',
                qnas: rows
            });
            connection.release();
        });
    });
});

router.get('/qna_detail/:idx&:Qtime', function(req, res, next) {
    var idx = req.params.idx;
    var time = req.params.Qtime;
    pool.getConnection(function(err, connection) {
        var sqlQNADetail = "select q.*,Rname FROM qna_info as q join register_info on Q_RID=RID where Q_RID=? and Qtime=?";
        connection.query(sqlQNADetail, [idx,time], function(err, row) {
            if (err) console.error("err : " + err);
            console.log('QNA Detail : ', row);
            res.render('qna_detail', {
                title: 'Q&A',
                qna: row[0]
            });
        });
        var hit = "update qna_info set Qhit = Qhit +1 where Q_RID =?";
        connection.query(hit, [idx], function(err, row) {
            if (err) console.error("err : " + err);
        });
        connection.release();
    });
});

router.get('/qna_answer/:idx&:Qtime', function(req, res, next) {
    var idx = req.params.idx;
    var time = req.params.Qtime;
    console.log("idx and time: " + idx+time)
    pool.getConnection(function(err, connection) {
        var sqlQNADetail = "select q.*,Rname FROM qna_info as q join register_info on Q_RID=RID where Q_RID=? and Qtime=?";
        connection.query(sqlQNADetail, [idx,time], function(err, row) {
            if (err) console.error("err : " + err);
            res.render('qna_answer', {
                title: 'Q&A 답변',
                qna: row[0]
            });
        });
        connection.release();
    });
});

router.post('/qna_answer', function(req, res, next) {
    var idx = req.body.Q_RID;
    var qtime = req.body.Qtime;
    var content = req.body.content;
    console.log(idx+qtime+content)
    pool.getConnection(function(err, connection) {
        console.log("getConnection error : " + err);
        var sql = "update qna_info set Answer=? where Q_RID=? and Qtime=?";
        connection.query(sql, [content,idx,qtime], function(err, result) {  
            if (err) {
                console.error("err : " + err);
                res.send("<script>alert('invalid request, Check request if FK ref problem');history.back();</script>");
            }
            else if (result.affectedRows == 0) {
                res.send("<script>alert('invalid request');history.back();</script>");
            }
            else {
                res.send("<script>alert('답변을 달았습니다.');window.location='http://localhost:1001/admin/qna_list/1';window.reload(true);</script>");
            }
            connection.release();

        });
    });
});



router.post('/qna_delete', function(req, res, next) {
    var idx = req.body.Q_RID;
    var qtime = req.body.Qtime;
    console.log("질문 삭제, Q_RID : ", JSON.stringify(idx));
    pool.getConnection(function(err, connection) {
        var sql = "delete FROM qna_info where Qtime=? and Q_RID=?";
        connection.query(sql, [qtime,idx], function(err, result) {
            if (err) {
                res.send("<script>alert('invalid request, Check request if FK ref problem');history.back();</script>");
                console.error("err : " + err);
            }
            if (result.affectedRows == 0) {
                res.send("<script>alert('invalid request');history.back();</script>");
            }
            else {
                res.send("<script>alert('삭제됐습니다.');window.location='http://localhost:1001/admin/qna_list/1';window.reload(true);</script>");
            }
            connection.release();

        });
    });
});


/* QNA_LIST , DETAILS END */


/* NOTICE_LIST, DETAILS START */

router.get('/notice_list/:page', function(req, res, next) {
    pool.getConnection(function(err, connection) {
        var sqlNoticesList = "select * FROM notice_info";
        connection.query(sqlNoticesList, function(err, rows) {
            if (err) console.error("err : " + err);
            res.render('notice_list', {
                title: '공지사항 관리',
                notices: rows
            });
            connection.release();
        });
    });
});

router.get('/notice_detail/:Ntime', function(req, res, next) {
    var idx = req.params.Ntime;
    pool.getConnection(function(err, connection) {
        var sqlNoticeDetail = "select * FROM notice_info where Ntime=?";
        connection.query(sqlNoticeDetail, [idx], function(err, row) {
            if (err) console.error("err : " + err);
            console.log('공지사항 정보 : ', JSON.stringify(row));
            res.render('notice_detail', {
                title: '공지 정보',
                notice: row[0]
            });
        });
        var hit = "update notice_info set Nhit = Nhit +1 where Ntime =?";
        connection.query(hit, [idx], function(err, row) {
            if (err) console.error("err : " + err);
        });
        connection.release();
    });
});


router.get('/notice_write', function(req, res, next) {
    res.render('notice_write', {
        title: '공지 작성'
    });
});


router.post('/notice_write', upload.single('image'), function(req, res, next) {
    var Ntime = new Date();
    var NTitle = req.body.title;
    var Ntext = req.body.content;
    var Nhit = 0;
    if (req.file) {
        var Nimage = req.file.path;
        var Nimage_path = req.file.originalname;
    }
    else {
        var Nimage = "";
        var Nimage_path = "";
    }
    var datas = [Ntime, NTitle, Ntext, Nimage, Nimage_path, Nhit];
    console.log("datas : " + JSON.stringify(datas));
    pool.getConnection(function(err, connection) {
        console.log("getConnection error : " + err);
        var sql = "insert into notice_info(Ntime,NTitle,Ntext,Nimage,Nimage_path,Nhit) values(?,?,?,?,?,?)";
        connection.query(sql, datas, function(err, result) {
            if (err) {
                console.error("err : " + err);
                res.send("<script>alert('invalid request, Check request if FK ref problem');history.back();</script>");
            }
            else if (result.affectedRows == 0) {
                res.send("<script>alert('invalid request');history.back();</script>");
            }
            else {
                res.send("<script>alert('공지를 추가했습니다.');window.location='http://localhost:1001/admin/notice_list/1';window.reload(true);</script>");
            }
            connection.release();

        });
    });
});

router.get('/notice_update/:Ntime', function(req, res, next) {
    var idx = req.params.Ntime;
    console.log("Ntime :" + idx);
    pool.getConnection(function(err, connection) {
        var sqlNoticeDetail = "select * FROM notice_info where Ntime=?";
        connection.query(sqlNoticeDetail, [idx], function(err, row) {
            if (err) console.error("err : " + err);
            console.log('공지사항 수정 : ', JSON.stringify(row));
            res.render('notice_update', {
                title: '공지 수정',
                notice: row[0]
            });
        });
    });
});


router.post('/notice_update', upload.single('image'), function(req, res, next) {
    var Ntime = new Date();
    var NTitle = req.body.title;
    var Ntext = req.body.content;
    if (req.file) {
        var Nimage = req.file.path;
        var Nimage_path = req.file.originalname;
    }
    else {
        var Nimage = "";
        var Nimage_path = "";
    }
    var datas = [Ntime, NTitle, Ntext, Nimage, Nimage_path];
    console.log("datas : " + JSON.stringify(datas));
    pool.getConnection(function(err, connection) {
        console.log("getConnection error : " + err);
        var sql = "update notice_info set Ntime=?,NTitle=?,Ntext=?,Nimage=?,Nimage_path=?";
        connection.query(sql, datas, function(err, result) {
            if (err) {
                console.error("err : " + err);
                res.send("<script>alert('invalid request, Check request if FK ref problem');history.back();</script>");
            }
            else if (result.affectedRows == 0) {
                res.send("<script>alert('invalid request');history.back();</script>");
            }
            else {
                res.send("<script>alert('공지를 수정했습니다.');window.location='http://localhost:1001/admin/notice_list/1';window.reload(true);</script>");
            }
            connection.release();

        });
    });
});


router.post('/notice_delete', function(req, res, next) {
    var rid = req.body.Ntime;
    console.log("공지 삭제, RID : ", JSON.stringify(rid));
    pool.getConnection(function(err, connection) {
        var sql = "delete FROM notice_info where Ntime=?";
        connection.query(sql, [rid], function(err, result) {
            if (err) {
                res.send("<script>alert('invalid request, Check request if FK ref problem');history.back();</script>");
                console.error("err : " + err);
            }
            else if (result.affectedRows == 0) {
                res.send("<script>alert('invalid request');history.back();</script>");
            }
            else {
                res.send("<script>alert('삭제됐습니다.');window.location='http://localhost:1001/admin/notice_list/1';window.reload(true);</script>");
            }
            connection.release();

        });
    });
});

/* NOTICE_LIST, DETAILS END */
module.exports = router;
