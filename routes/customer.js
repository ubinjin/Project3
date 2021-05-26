var express = require('express');
var router = express.Router();
var mysql = require('mysql');
const multer = require('multer');

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
// const headerFormat = fs.readFileSync(
//   "./views/header.html",
//   "utf8"
// );
// const header = ejs.render(headerFormat);
router.get('/', function (req, res, next) {
  pool.getConnection(function (err, connection) {
    var ProductList_sql = "select Pname, Price, Pimage from product_info";
    connection.query(ProductList_sql, function (err, rows) {
      if (err) console.error("err : " + err);
      // console.log("rows : " + JSON.stringify(rows));

      res.render('main', {
        title: '서우장',
        rows: rows,
        header
      });
      connection.release();
    });
  });
});

/* GET home page. */
router.get('/detail/:Pname', function (req, res, next) {
  var Pname = req.params.Pname;
  pool.getConnection(function (err, connection) {
    var Productinfo_sql = 'SELECT * FROM product_info where Pname=?';
    var sql = 'SELECT * FROM product_info where Pname=?';
    connection.query(Productinfo_sql, [Pname], function (err, row) {
      if (err) console.error("err : " + err);
      // console.log("rows : " + JSON.stringify(rows));
      // console.log(rows[0].Ptime);
      console.log("1개 상품 결과 확인 : ", row);
      var saleprice = row[0].Price * (1 - row[0].Salerate / 100);
      // console.log(saleprice);
      res.render('detail', {
        title: "상품 조회",
        row: row[0],
        saleprice: saleprice
      });
      connection.release();
    });
  });
});

/* GET my page. */
router.get('/mypage', function (req, res, next) {
  // Session ID 가져오기
  var user_id = "2016722036";
  if (user_id == null) {
    res.send('<script type="text/javascript">alert("로그인 후 이용 바랍니다.");</script>');
    res.redirect('/');
  }
  pool.getConnection(function (err, connection) {
    var userInfo_sql = 'SELECT * FROM register_info where RID=?';
    var userdealInfo_sql = 'SELECT * FROM deal_info where S_RID=?';
    connection.query(userInfo_sql, [user_id], function (err, row_userInfo) {
      connection.query(userdealInfo_sql, [user_id], function (err2, row_dealInfo) {
        if (err) console.error("err : " + err);
        if (err2) console.error("err2 : " + err2);
        console.log("마이페이지 접속 : ", row_userInfo, row_dealInfo);
        // console.log(saleprice);
        res.render('mypage', {title: "마이 페이지", row_userInfo: row_userInfo[0], row_dealInfo: row_dealInfo});
        connection.release();
      });
    });
  });
});


module.exports = router;
