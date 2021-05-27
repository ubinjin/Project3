var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var multer = require('multer');
var moment = require('moment');
var date = moment().format('YYYY-MM-DD HH:MM:SS');
var pool = mysql.createPool({
    connectionLimit: process.env.DB_connectionLimit,
    host: process.env.DB_host,
    port: process.env.DB_port,
    user: process.env.DB_user,
    password: process.env.DB_password,
    database: process.env.DB_database,
    multipleStatements: true
});

var upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'public/images/');
        },
        filename: function (req, file, cb) {
            cb(null, file.originalname);
        }
    }),
});
//////////////////// watch product list ////////////////////////
router.get('/', function (req, res) {
  pool.getConnection(function (err, connection) {
      var ProductList_sql = "select * from product_info";
      connection.query(ProductList_sql, function (err, rows) {
          if (err) console.error("err : " + err);
          res.render('main', {title: '서우장', rows: rows});
          connection.release();
      });
  });
});


////////////////////////////////////////////////// watch product detail info ///////////////////////////////////
router.get('/detail/:PID',  function(req, res){
  var Product_idx = req.params.PID;
  pool.getConnection(function(err, connection){
    var Productinfo_sql = 'SELECT * FROM product_info where PID=?';
    var Reviewinfo_sql = 'select reg.Rname, rev.R_RID, rev.R_PID, rev.R_DID, rev.Review, rev.Star, rev.Rtime, rev.Rimage from register_info as reg join review_info as rev on reg.RID = rev.R_RID where rev.R_PID=?';
    connection.query(Productinfo_sql, [Product_idx], function(err, product){
      if(err) console.error("err : "+err);
      connection.query(Reviewinfo_sql, [Product_idx], function(err, review){
        if(err) console.error("err : "+err);
        res.render('detail', {title: "상품 조회", product: product[0], reviews: review});
        connection.release();

      });
    });
  });
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////// buy product /////////////////////////////////////////////////////
router.post('/detail/:PID/buy', upload.single('image'), function(req, res){
  /* to deal_info table */
  var Product_idx = req.params.PID;
  var DID = req.body.P_RID + "_" + req.body.D_PID + "_" + date;
  var P_RID = req.body.P_RID;
  var S_RID = req.body.S_RID;
  var D_PID = req.body.D_PID;
  var Dtime = date;
  var Dquantity = req.body.Dquantity;
  var Dstate = '1';
  /* to register_info table(update customer's cash) */
  var Rest_cash = req.body.Rest_cash;
  console.log(Rest_cash);

  var datas = [DID, P_RID, S_RID, D_PID, Dtime, Dquantity, Dstate, Number(Rest_cash)]; 
  pool.getConnection(function (err, connection) {
      var InsertdealandUpdateCash_multisql = "insert into deal_info(DID, P_RID, S_RID, D_PID, Dtime, Dquantity, Dstate) values(?,?,?,?,?,?,?);" + 
          "update register_info set cash = ? where RID = '2016722036';";
      connection.query(InsertdealandUpdateCash_multisql, datas, function (err, result) {
          if (err) console.error(err);
          console.log(result);
          res.redirect('/customer/detail/' + Product_idx);
          connection.release();
      });
  });
});

router.get('/detail/:PID/buy', function(req, res){
  var Product_idx = req.params.PID;
  pool.getConnection(function (err, connection) {
      if (err) console.error("커넥션 객체 얻어오기 에러 : ", err);
      var ProductandRegisterinfo_sql = 'select * from product_info as p, register_info as r where p.PID=? and r.RID = 2016722036';
      connection.query(ProductandRegisterinfo_sql, [Product_idx], function (err, product) {
          if (err) console.error(err);
          console.log("update에서 1개 글 조회 결과 확인 : ", product);
          res.render('buy', {title: "결제", product: product[0]});
          connection.release();
      });
  });
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////// write review //////////////////////////////////////////////////////
router.post('/detail/:PID/review', upload.single('image'),  function(req, res, next){
  var Product_idx = req.params.PID;
  var R_RID = req.body.R_RID;
  var R_PID = req.body.R_PID;
  var R_DID = req.body.R_DID;;
  var Review = req.body.Review;
  var Star = req.body.Star;
  var Rimage = req.file.path;
  var Rtime = date;

  var datas = [R_RID, R_PID, R_DID, Review, Star, Rtime, Rimage];
  pool.getConnection(function(err, connection){
    var InsertReview_sql = "insert into review_info(R_RID, R_PID, R_DID, Review, Star, Rtime, Rimage) values(?,?,?,?,?,?,?)";
    connection.query(InsertReview_sql, datas, function(err, review){
      if(err) console.error("err : "+err);
      res.redirect('/customer/detail/' + Product_idx);
      connection.release();
    });
  });
});

router.get('/detail/:PID/review', function(req, res){
  var Product_idx = req.params.PID;
  pool.getConnection(function (err, connection) {
      if (err) console.error("커넥션 객체 얻어오기 에러 : ", err);
      var ProductandDealinfo_sql = 'select * from product_info as p, deal_info as d where d.P_RID = 2016722036 and p.PID = d.D_PID and D_PID = ?';
      connection.query(ProductandDealinfo_sql, [Product_idx], function (err, rows) {
          if (err) console.error(err);
          res.render('write_review', {title: "리뷰 작성", product_deal: rows[rows.length-1]});
          connection.release();
      });
  });
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
module.exports = router;
