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
    database: process.env.DB_database
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

router.get('/', function (req, res, next) {
  pool.getConnection(function (err, connection) {
      var ProductList_sql = "select * from product_info";
      connection.query(ProductList_sql, function (err, rows) {
          if (err) console.error("err : " + err);
          // console.log("rows : " + JSON.stringify(rows));

          res.render('main', {title: '서우장', rows: rows});
          connection.release();
      });
  });
});

// router.get('/detail/:PID',  function(req, res, next){
//   var Product_idx = req.params.PID;
//   pool.getConnection(function(err, connection){
//     var Productinfo_sql = 'SELECT * FROM product_info where PID=?';
//     var Dealinfo_sql = 'SELECT * FROM product_info as p, deal_info as d where PID=? and p.PID = d.D_PID';
//     var Reviewinfo_sql = 'select reg.Rname, rev.R_RID, rev.R_PID, rev.R_DID, rev.Review, rev.Star, rev.Rtime, rev.Rimage from register_info as reg join review_info as rev on reg.RID = rev.R_RID where rev.R_PID=?';
//     connection.query(Productinfo_sql, [Product_idx], function(err, product){
//       if(err) console.error("err : "+err);
//       connection.query(Reviewinfo_sql, [Product_idx], function(err, review){
//         if(err) console.error("err : "+err);
//         connection.query(Dealinfo_sql, [Product_idx], function(err, deal){
//           if(err) console.error("err : "+err);
//           console.log(review);
//           res.render('detail', {title: "상품 조회", product: product[0], reviews: review, deal: deal[0]});
//           connection.release();
//         });
//       });
//     });
//   });
// });

router.get('/detail/:PID',  function(req, res, next){
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

// router.post('/detail/:PID', upload.single('image'),  function(req, res, next){
//   var R_RID = req.body.R_RID;
//   var R_PID = req.body.R_PID;
//   var R_DID = req.body.R_DID;;
//   var Review = req.body.Review;
//   var Star = req.body.Star;
//   var Rimage = req.file.path;
//   var Rtime = date;
//   console.log(R_RID);
//   console.log(R_PID);
//   console.log(R_DID);
//   console.log(Review);
//   console.log(Star);
//   console.log(Rtime);

//   var datas = [R_RID, R_PID, R_DID, Review, Star, Rtime, Rimage];
//   pool.getConnection(function(err, connection){
//     var InsertReview_sql = "insert into review_info(R_RID, R_PID, R_DID, Review, Star, Rtime, Rimage) values(?,?,?,?,?,?,?)";
//     connection.query(InsertReview_sql, datas, function(err, review){
//       if(err) console.error("err : "+err);
//       console.log("1111111");
//       console.log("리뷰 확인", review);

//       //res.render('detail', {title: "상품 조회", product: product[0], review: review[0]});
//       res.redirect('/customer');
//       connection.release();
//     });
//   });
// });



router.get('/detail/:PID/buy', function(req, res, next){
  var Product_idx = req.params.PID;
  pool.getConnection(function (err, connection) {
      //if (err) console.error("커넥션 객체 얻어오기 에러 : ", err);
      var Productinfo_sql = 'SELECT * FROM product_info where PID=?';
      connection.query(Productinfo_sql, [Product_idx], function (err, product) {
          if (err) console.error(err);
          console.log("update에서 1개 글 조회 결과 확인 : ", product);
          // res.render('list', {title: "글 수정", row: rows[0]});
          res.render('buy', {title: "상품 구매", product: product[0]});
          connection.release();
      });
  });
});


module.exports = router;
