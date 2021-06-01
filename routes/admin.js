require('dotenv').config();
var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var multer = require('multer');
const {
    json
} = require('body-parser');
var pool = mysql.createPool({
    connectionLimit: process.env.DB_connectionLimit,
    host: process.env.DB_host,
    port: process.env.DB_port,
    user: process.env.DB_user,
    password: process.env.DB_password,
    database: process.env.DB_database,
    dateStrings: process.env.DB_dateStrings
});

var thumb_nail = multer({ // 진우빈 
    storage: multer.diskStorage({
        destination: function(req, file, cb) {
            cb(null, './join_images/');
        },
        filename: function(req, file, cb) {
            cb(null, file.originalname);
        }
    }),
});

var storage = multer.diskStorage({ // 양준혁 관리자 머터
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
router.get('/', function(req, res, next) {
    console.log("landed");
    if (req.session.user.Ucase == "0") {
        res.send("<script>alert('일반 고객님은 관리자 페이지에 접근할 수 없습니다...');window.location='http://localhost:1001/tab';window.reload(true);</script>");
    }
    else if (req.session.user.Ucase == "1") {
        res.send("<script>alert('관리자님 환영합니다!');window.location='http://localhost:1001/admin/seller_list/1';window.reload(true);</script>");
    }
    else {
        delete req.session.user;
        req.session.save(() => {
            res.send("<script>alert('관리자 페이지에 비정상적인 접근(세션)입니다..');history.back();</script>");
        });
    }
});

router.get('/seller_list/:page', function(req, res, next) {
    pool.getConnection(function(err, connection) {
        var sqlForSelectList = "SELECT * FROM product_info";
        connection.query(sqlForSelectList, function(err, rows) {
            if (err) console.error("err : " + err);
            console.log("rows : " + JSON.stringify(rows));
            res.render('seller_list', {
                title: '상품 목록',
                rows: rows,
                page: req.params.page

            });
            connection.release();
        });
    });
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
    console.log(req.session.user);
    pool.getConnection(function(err, connection) {
        var sqlClientsList = "select RID,Rname, Address, Phone, Ucase FROM register_info";
        connection.query(sqlClientsList, function(err, rows) {
            if (err) console.error("err : " + err);
            console.log(rows)
            res.render('client_list', {
                title: '고객 관리',
                clients: rows,
                page: req.params.page
            });
            connection.release();
        });
    });
});


router.post('/seller_list', function(req, res, next) {
    var pid = req.body.pid;
    //var deletemsg = 0;
    pool.getConnection(function(err, connection) {
        var sql = "delete from product_info where pid = ?";
        //if(deletemsg){
        for (var i = 0; i < deletearray.length; i++) {
            connection.query(sql, [pid], function(err, result) {
                console.log(result);
                if (err) console.error("글 삭제 중 에러 발생 err : ", err);
                if (result.affectedRows == 0)
                    res.send("<script>alert('잘못된 요청으로 인해 값이 변경되지 않습니다.');history.back();</script>");
            });
        }
        res.redirect('/admin/seller_list');
        connection.release();
    });
});

router.get('/seller_register', function(req, res) {
    res.render('seller_register', {
        title: '상품 등록'
    });
});

router.post('/seller_register', thumb_nail.single('pimage'), (req, res) => {
    var pid = req.body.pid;
    var pcategory = req.body.pcategory;
    var pname = req.body.pname;
    var price = req.body.price;
    var stock = req.body.stock;
    var pdesc = req.body.pdesc;
    var ptime = new Date();
    var pimage = req.file;
    if (req.file == null)
        pimage = null;
    else pimage = req.file.filename;
    var datas = [pid, pcategory, pname, price, stock, pdesc, ptime, pimage];
    console.log("body : " + JSON.stringify(datas));
    pool.getConnection(function(err, connection) {
        var sqlForInsertBoard = "insert into product_info(pid, pcategory, pname, price, stock, pdesc, ptime, pimage) values(?,?,?,?,?,?,?,?)";
        connection.query(sqlForInsertBoard, datas, function(err, rows) {
            if (err) {
                console.log("err :", err)
                if (err.code == "ER_DUP_ENTRY")
                    return res.send("<script>alert('이미 등록되어 있는 상품 ID입니다.');history.back();</script>");
            }
            else {
                console.log("rows : " + JSON.stringify(rows));
                res.send("<script>alert('상품 등록이 완료되었습니다..');window.location='http://localhost:1001/admin/seller_list/1';window.reload(true);</script>");
            }
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


router.get('/seller_update/:pid', thumb_nail.single('pimage'), (req, res, next) => {
    var pid = req.params.pid;
    pool.getConnection(function(err, connection) {
        if (err) console.error("커넥션 객체 얻어오기 에러 : ", err);
        var sql = "select * from product_info where pid=?"
        console.log(pid);
        connection.query(sql, [pid], function(err, rows) {
            if (err) console.error(err);
            console.log("update에서 1개 글 조회 결과 확인 : ", rows);
            res.render('seller_update', {
                title: "상품 정보 수정",
                row: rows[0]
            });
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
                qnas: rows,
                page: req.params.page
            });
            connection.release();
        });
    });
});


router.post('/seller_update/:pid', thumb_nail.single('pimage'), (req, res) => {
    var pcategory = req.body.pcategory;
    var pname = req.body.pname;
    var price = req.body.price;
    var stock = req.body.stock;
    var pdesc = req.body.pdesc;
    var ptime = new Date();
    var pimage = req.file;
    var salerate = req.body.salerate;
    if (req.file == null)
        pimage = null;
    else pimage = req.file.filename;
    var datas = [pcategory, pname, price, stock, pdesc, ptime, pimage, salerate, req.params.pid];
    console.log(req.params.pid);
    console.log("body : " + JSON.stringify(datas));
    pool.getConnection(function(err, connection) {
        var sql = "update product_info set pcategory=?, pname=?, price=?, stock=?, pdesc=?, ptime=?, pimage=?, salerate=? where pid=?";
        connection.query(sql, datas, function(err, rows) {
            if (err) {
                console.log("err :", err)
                if (err.code == "ER_DUP_ENTRY") ``
                return res.send("<script>alert('이미 등록되어 있는 상품 ID입니다.');history.back();</script>");
            }
            else {
                console.log("rows : " + JSON.stringify(rows));
                res.send("<script>alert('상품 수정이 완료되었습니다..');window.location='http://localhost:1001/admin/seller_list/1';window.reload(true);</script>");
            }
            connection.release();
        });
    });
});

router.get('/qna_detail/:idx&:Qtime', function(req, res, next) {
    var idx = req.params.idx;
    var time = req.params.Qtime;
    pool.getConnection(function(err, connection) {
        var sqlQNADetail = "select q.*,Rname FROM qna_info as q join register_info on Q_RID=RID where Q_RID=? and Qtime=?";
        connection.query(sqlQNADetail, [idx, time], function(err, row) {
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
    console.log("idx and time: " + idx + time)
    pool.getConnection(function(err, connection) {
        var sqlQNADetail = "select q.*,Rname FROM qna_info as q join register_info on Q_RID=RID where Q_RID=? and Qtime=?";
        connection.query(sqlQNADetail, [idx, time], function(err, row) {
            console.log(row);
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

    pool.getConnection(function(err, connection) {
        console.log("getConnection error : " + err);
        var sql = "update qna_info set Answer=? where Q_RID=? and Qtime=?";
        connection.query(sql, [content, idx, qtime], function(err, result) {
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


router.get('/thumb_nail', function(req, res) {
    res.render('thumb_nail');
});

/* GET home page. */
router.get('/seller_read/:pid', function(req, res, next) {
    var pid = req.params.pid;
    pool.getConnection(function(err, connection) {
        if (err) console.error("err : " + err);
        var Productinfo_sql = 'select * from product_info where pid=?';
        connection.query(Productinfo_sql, [pid], function(err, row) {
            if (err) console.error("err : " + err);
            console.log("1개 상품 결과 확인 : ", JSON.stringify(row));
            //var saleprice = row[0].price * (1 - row[0].salerate/100);
            res.render('seller_read', {
                title: "상품 조회",
                row: row[0]
            });
            connection.release();
        });
    });
});

router.post('/seller_read/:pid', (req, res) => {
    var datas = [req.params.pid];
    console.log(req.params.pid);
    pool.getConnection(function(err, connection) {
        var sql = "delete from product_info where pid=?";
        connection.query(sql, datas, function(err, rows) {
            if (err) {
                console.log("err :", err)
            }
            else {
                console.log("rows : " + JSON.stringify(rows));
                res.send("<script>alert('상품 삭제가 완료되었습니다..');window.location='http://localhost:1001/admin/seller_list/1';window.reload(true);</script>");
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
        connection.query(sql, [qtime, idx], function(err, result) {
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
                title: '공지 관리',
                notices: rows,
                page: req.params.page
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
    var Ntext = req.body.content2;
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


router.get('/seller_state/:page', thumb_nail.single('pimage'), (req, res, next) => {
    pool.getConnection(function(err, connection) {
        var sql = "select * from product_info, deal_info, register_info where P_RID = RID and D_PID = PID order by Dtime desc";
        connection.query(sql, function(err, rows) {
            if (err) console.error(err);
            res.render('seller_state', {
                title: "주문 목록",
                row: rows,
                page: req.params.page
            });
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
            console.log(row[0]);
            console.log('공지사항 수정 : ', JSON.stringify(row));
            res.render('notice_update', {
                title: '공지 수정',
                notice: row[0]
            });
            connection.release();
        });
    });
});


router.post('/notice_update', upload.single('image'), function(req, res, next) {
    var Ntime = req.body.time;
    var NTitle = req.body.title;
    var Ntext = req.body.content2;
    if (req.file) {
        var Nimage = req.file.path;
        var Nimage_path = req.file.originalname;
    }
    else {
        var Nimage = "";
        var Nimage_path = "";
    }
    var datas = [NTitle, Ntext, Nimage, Nimage_path, Ntime];
    console.log("datas : " + JSON.stringify(datas));
    pool.getConnection(function(err, connection) {
        console.log("getConnection error : " + err);
        var sql = "update notice_info set NTitle=?,Ntext=?,Nimage=?,Nimage_path=? where Ntime=?";
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


router.post('/seller_state', (req, res) => {
    var page = req.body.page;
    var j = 0;
    pool.getConnection(function(err, connection) {
        var sql_find = "select DID from deal_info order by Dtime desc";
        var sql_update = "update deal_info set Dstate=? where DID=?";
        connection.query(sql_find, function(err, row2) {
            for (var i = (page - 1) * 10; i < (page - 1) * 10 + req.body.Dstate.length; i++) {
                console.log(req.body.Dstate[j], row2[i].DID);
                connection.query(sql_update, [req.body.Dstate[j], row2[i].DID]);
                j++;
            }
        });
        // var next_location="\""+"<script>alert('주문 상태 변경이 완료되었습니다.');http://localhost:1001/admin/seller_state/" + page+";window.reload(true);</script>"+"\"";
        var next_location = "<script>alert('주문 상태 변경이 완료되었습니다.');window.location='http://localhost:1001/admin/seller_state/" + page + "';window.reload(true);</script>";
        console.log(next_location.toString())
        connection.release();
        res.send(next_location.toString());
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


router.get('/stastics', function(req, res, next) {
    //get Deal_info
    pool.getConnection(function(err, connection) {
        var sqlStastics = "select d.*, RRN from deal_info as d join register_info as r where d.P_RID=r.RID";
        connection.query(sqlStastics, function(err, row) {
            if (err) console.error("err : " + err);
            console.log('통계 rows : ', JSON.stringify(row));
            res.render('stastics', {
                title: '판매 통계',
                rows: row
            });
            connection.release();
        });
    });
});

module.exports = router;
