var express = require('express');
var router = express.Router();
var mysql = require('mysql');
// var multer = require('multer');
var pool = mysql.createPool({
    connectionLimit: process.env.DB_connectionLimit,
    host: process.env.DB_host,
    port: process.env.DB_port,
    user: process.env.DB_user,
    password: process.env.DB_password,
    database: process.env.DB_database
});

// var upload = multer({
//     storage: multer.diskStorage({
//         destination: function (req, file, cb) {
//             cb(null, 'public/images/');
//         },
//         filename: function (req, file, cb) {
//             cb(null, file.originalname);
//         }
//     }),
// });

router.get('/', function (req, res, next) {
  pool.getConnection(function (err, connection) {
      var ProductList_sql = "select Pname, Price, Pimage from product_info";
      connection.query(ProductList_sql, function (err, rows) {
          if (err) console.error("err : " + err);
          // console.log("rows : " + JSON.stringify(rows));

          res.render('main', {title: '서우장', rows: rows});
          connection.release();
      });
  });
});

/* GET home page. */
router.get('/detail/:Pname',  function(req, res, next){
  var Pname = req.params.Pname;
  pool.getConnection(function(err, connection){
    var Productinfo_sql = 'SELECT * FROM product_info where Pname=?';
    connection.query(Productinfo_sql, [Pname], function(err, row){
      if(err) console.error("err : "+err);
      // console.log("rows : " + JSON.stringify(rows));
      // console.log(rows[0].Ptime);
      console.log("1개 상품 결과 확인 : ", row);
      var saleprice = row[0].Price * (1 - row[0].Salerate/100);
      // console.log(saleprice);
      res.render('detail', {title: "상품 조회", row: row[0], saleprice: saleprice});
      connection.release();
    });
  });
});


module.exports = router;
