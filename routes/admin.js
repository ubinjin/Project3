var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');

var multer = require('multer'); // 이미지
var path = require('path'); // 이미지
var mysql = require('mysql');

var pool = mysql.createPool({
    connectionLimit: process.env.DB_connectionLimit,
    host: process.env.DB_host,
    port: process.env.DB_port,
    user: process.env.DB_user,
    password: process.env.DB_password,
    database: process.env.DB_database,
    dateStrings: process.env.DB_dateStrings
});

var thumb_nail = multer({
    storage: multer.diskStorage({
        destination: function(req, file, cb) {
            cb(null, './join_images/');
        },
        filename: function(req, file, cb) {
            cb(null, file.originalname);
        }
    }),
});

router.get('/', function (req, res, next) {
    res.redirect('/admin/seller_list/1');
});

router.get('/seller_list/:page', function (req, res, next) {
    pool.getConnection(function (err, connection) {
        var sqlForSelectList = "SELECT * FROM product_info";
        connection.query(sqlForSelectList, function (err, rows) {
            if (err) console.error("err : " + err);
            console.log("rows : " + JSON.stringify(rows));
            res.render('seller_list', {title: '판매자 메인페이지', rows: rows});
            connection.release();
        });
    });
});

router.post('/seller_list', function (req, res, next) {
    var pid = req.body.pid;
    //var deletemsg = 0;
    pool.getConnection(function (err, connection) {
        var sql = "delete from product_info where pid = ?";
        //if(deletemsg){
            for(var i=0; i<deletearray.length; i++){
                connection.query(sql, [pid], function (err, result) {
                    console.log(result);
                    if (err) console.error("글 삭제 중 에러 발생 err : ", err);
                    if (result.affectedRows == 0)
                        res.send("<script>alert('잘못된 요청으로 인해 값이 변경되지 않습니다.');history.back();</script>");
                });
                console.log("시발");
            }
        //}
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
        res.send("<script>alert('상품 이미지를 넣어주세요.');history.back();</script>");
    else pimage = req.file.filename;
    var datas = [pid, pcategory, pname, price, stock, pdesc, ptime, pimage];
    console.log("body : "+JSON.stringify(datas));
    pool.getConnection(function(err, connection) {
        var sqlForInsertBoard = "insert into product_info(pid, pcategory, pname, price, stock, pdesc, ptime, pimage) values(?,?,?,?,?,?,?,?)";
        connection.query(sqlForInsertBoard, datas, function(err, rows) {
            if (err) {
                console.log("err :",err)
                if (err.code == "ER_DUP_ENTRY")
                    return res.send("<script>alert('이미 등록되어 있는 상품 ID입니다.');history.back();</script>");
            }
            else {
                console.log("rows : " + JSON.stringify(rows));
                res.send("<script>alert('상품 등록이 완료되었습니다..');window.location='http://localhost:1001/admin/seller_list';window.reload(true);</script>");
            }
            connection.release();
        });
    });
});

router.get('/seller_update/:pid', thumb_nail.single('pimage'), (req, res, next)=>{
    var pid = req.params.pid;
    pool.getConnection(function (err, connection) {
        if (err) console.error("커넥션 객체 얻어오기 에러 : ", err);
        var sql = "select * from product_info where pid=?"
        console.log(pid);
        connection.query(sql, [pid], function (err, rows) {
            if (err) console.error(err);
            console.log("update에서 1개 글 조회 결과 확인 : ", rows);
            res.render('seller_update', {title: "상품 정보 수정", row: rows[0]});
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
        res.send("<script>alert('상품 이미지를 넣어주세요.');history.back();</script>");
    else pimage = req.file.filename;
    var datas = [pcategory, pname, price, stock, pdesc, ptime, pimage, salerate, req.params.pid];
    console.log(req.params.pid);
    console.log("body : "+JSON.stringify(datas));
    pool.getConnection(function(err, connection) {
        var sql = "update product_info set pcategory=?, pname=?, price=?, stock=?, pdesc=?, ptime=?, pimage=?, salerate=? where pid=?";
        connection.query(sql, datas, function(err, rows) {
            if (err) {
                console.log("err :",err)
                if (err.code == "ER_DUP_ENTRY")``
                    return res.send("<script>alert('이미 등록되어 있는 상품 ID입니다.');history.back();</script>");
            }
            else {
                console.log("rows : " + JSON.stringify(rows));
                res.send("<script>alert('상품 수정이 완료되었습니다..');window.location='http://localhost:1001/admin/seller_list';window.reload(true);</script>");
            }
            connection.release();
        });
    });
});

router.get('/thumb_nail', function(req, res) {
    res.render('thumb_nail');
});

/* GET home page. */
router.get('/seller_read/:pid',  function(req, res, next){
    var pid = req.params.pid;
    pool.getConnection(function(err, connection){
    if(err) console.error("err : "+err);
      var Productinfo_sql = 'select * from product_info where pid=?';
      connection.query(Productinfo_sql, [pid], function(err, row){
          if (err) console.error("err : " + err);
          console.log("1개 상품 결과 확인 : ", JSON.stringify(row));
          //var saleprice = row[0].price * (1 - row[0].salerate/100);
          res.render('seller_read', { title: "상품 조회", row: row[0] });
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
                console.log("err :",err)
            }
            else {
                console.log("rows : " + JSON.stringify(rows));
                res.send("<script>alert('상품 삭제가 완료되었습니다..');window.location='http://localhost:1001/admin/seller_list';window.reload(true);</script>");
            }
            connection.release();
        });
    });
});

router.get('/seller_state/:page', thumb_nail.single('pimage'), (req, res, next)=>{
    pool.getConnection(function (err, connection) {
        var sql = "select * from product_info, deal_info, register_info where P_RID = RID and D_PID = PID order by Dtime desc";
        connection.query(sql, function (err, rows) {
            if (err) console.error(err);
            console.log("rows : " + JSON.stringify(rows));
            res.render('seller_state', {title: "주문 확인", row: rows});
            connection.release();
        });
    });
});

router.post('/seller_state', (req, res) => {
    pool.getConnection(function (err, connection) {
        var sql_count = "select count(DID) as c from deal_info order by Dtime desc";
        var sql_find = "select DID from deal_info order by Dtime desc";
        var sql_update = "update deal_info set Dstate=? where DID=?";
        connection.query(sql_count, function (err, row) {
            connection.query(sql_find, function (err, row2) {
                for (var i = 0; i < row[0].c; i++) {
                    console.log(req.body.Dstate[i], row2[i].DID);
                    connection.query(sql_update, [req.body.Dstate[i], row2[i].DID]);
                }
            });
        });
        connection.release();
        res.send("<script>alert('주문 상태 변경이 완료되었습니다.');window.location='http://localhost:1001/admin/seller_state/1';window.reload(true);</script>");
    });
});

module.exports = router;

