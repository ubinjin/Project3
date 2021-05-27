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
  database: process.env.DB_database,
  dateStrings: process.env.DB_dateStrings
});

var image_upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/images/');
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    }
  }),
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
// // const header = ejs.render(headerFormat);

router.get('/', function (req, res, next) {
  res.redirect('/tab');
});

router.get('/tab', function (req, res, next) {
  page = 0;
  pool.getConnection(function (err, connection) {
    var ProductList_sql = "select Pname, Price, Pimage from product_info";
    connection.query(ProductList_sql, function (err, rows) {
      if (err) console.error("err : " + err);
      // console.log("rows : " + JSON.stringify(rows))
      res.render('main', {
        title: '당골찬',
        page: page,
        rows: rows,
        header
      });
      connection.release();
    });
  });
});

router.get('/tab/:page', function (req, res, next) {
  var page = req.params.page;
  console.log(page);
  var where = "";
  if (page == 0) {
    where = "";
  } else if (page == 1) {
    where = " where Pcategory='새우장'";
  } else if (page == 2) {
    where = " where Pcategory='게장'";
  } else if (page == 3) {
    where = " where Pcategory='계란장'";
  } else if (page == 4) {
    where = " where Pcategory='김치'";
  }
  pool.getConnection(function (err, connection) {
    var ProductList_sql = "select Pname, Price, Pimage from product_info" + where;
    connection.query(ProductList_sql, function (err, rows) {
      if (err) console.error("err : " + err);
      // console.log("rows : " + JSON.stringify(rows));
      res.render('main', {
        title: '당골찬',
        page: page,
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
    var userdealInfo_sql = 'select * from product_info as p, deal_info as d where d.P_RID = ? and p.PID = d.D_PID order by Dtime desc';
    var userqna_sql = 'SELECT * FROM qna_info WHERE Q_RID = ?';
    var userreview_sql = 'SELECT * FROM review_info as r JOIN product_info as p ON r.R_PID = p.PID WHERE r.R_RID = ?';
    connection.query(userInfo_sql, [user_id], function (err, row_userInfo) {
      connection.query(userdealInfo_sql, [user_id], function (err2, row_dealInfo) {
        connection.query(userqna_sql, [user_id], function (err3, row_qnaInfo) {
          connection.query(userreview_sql, [user_id], function (err4, row_reviewInfo) {
            if (err) console.error("err : " + err);
            if (err2) console.error("err2 : " + err2);
            if (err3) console.error("err2 : " + err3);
            if (err4) console.error("err2 : " + err4);
            // console.log(saleprice);
            res.render('mypage', {
              title: "마이 페이지",
              row_userInfo: row_userInfo[0],
              row_dealInfo: row_dealInfo,
              row_qnaInfo: row_qnaInfo,
              row_reviewInfo: row_reviewInfo
            });
            connection.release();
          });
        });
      });
    });
  });
});

router.post('/cash_add', function (req, res, next) {
  var cash = req.body.cash;
  var user_id = "2016722036";
  pool.getConnection(function (err, connection) {
    var cashAdd_sql = 'UPDATE register_info SET Cash = Cash + ? WHERE RID = ?';
    connection.query(cashAdd_sql, [cash, user_id], function (err, result) {
      if (err) console.error("err : " + err);
      res.send("<script type='text/javascript'>alert('충전 완료!');window.location='http://localhost:1001/customer/mypage';window.reload(true);</script>");
      connection.release();
    });
  });
});

router.post('/register_edit', function (req, res, next) {
  var user_id = "2016722036";
  var Rname = req.body.Rname;
  var password = req.body.password;
  var Address = req.body.Address;
  var Phone = req.body.Phone;
  pool.getConnection(function (err, connection) {
    var registerEdit_sql = 'UPDATE register_info SET Rname=?, password=?, Address=?, Phone=? WHERE RID = ?';
    connection.query(registerEdit_sql, [Rname, password, Address, Phone, user_id], function (err, result) {
      if (err) console.error("err : " + err);
      res.send("<script type='text/javascript'>alert('수정 완료!');window.location='http://localhost:1001/customer/mypage';window.reload(true);</script>");
      connection.release();
    });
  });
});


router.get('/notice', function (req, res, next) {
  // Session ID 가져오기
  var user_id = "2016722036";
  if (user_id == null) {
    res.send('<script type="text/javascript">alert("로그인 후 이용 바랍니다.");</script>');
    res.redirect('/');
  }
  pool.getConnection(function (err, connection) {
    var userInfo_sql = 'SELECT * FROM notice_info';
    connection.query(userInfo_sql, function (err, row) {
      if (err) console.error("err : " + err);
      console.log("공지사항 접속 : ", row);
      // console.log(saleprice);
      res.render('customer_notice', {
        title: "공지사항",
        notices: row
      });
      connection.release();
    });
  });
});

router.get('/notice_detail/:Ntime', function (req, res, next) {
  // Session ID 가져오기
  var Ntime = req.params.Ntime;
  var user_id = "2016722036";
  if (user_id == null) {
    res.send('<script type="text/javascript">alert("로그인 후 이용 바랍니다.");</script>');
    res.redirect('/');
  }
  pool.getConnection(function (err, connection) {
    var userInfo_sql = 'SELECT * FROM notice_info WHERE Ntime = ?';
    var hitup_sql = 'UPDATE notice_info SET Nhit=Nhit+1 WHERE Ntime = ?';
    connection.query(userInfo_sql, [Ntime], function (err, row) {
      connection.query(hitup_sql, [Ntime]);
      if (err) console.error("err : " + err);
      console.log("공지사항 접속 : ", row);
      // console.log(saleprice);
      res.render('customer_notice_detail', {
        title: "공지사항",
        notice: row[0]
      });
      connection.release();
    });
  });
});

router.get('/qna', function (req, res) {
  // Session ID 가져오기
  var user_id = "2016722036";
  if (user_id == null) {
    res.send('<script type="text/javascript">alert("로그인 후 이용 바랍니다.");</script>');
    res.redirect('/');
  }
  pool.getConnection(function (err, connection) {
    var userInfo_sql = 'SELECT * FROM qna_info';
    connection.query(userInfo_sql, function (err, row) {
      if (err) console.error("err : " + err);
      // console.log("질문답변 접속 : ", row);
      // console.log(saleprice);
      res.render('customer_qna', {
        title: "질문과 답변",
        row: row
      });
      connection.release();
    });
  });
});

router.post('/qna_write', image_upload.single('Qimage'), function (req, res, next) {
  var Q_RID = "2016722036";
  var Qtitle = req.body.Qtitle;
  var Question = req.body.Question;
  var Qimage = null;
  if (req.file == null) Qimage = null;
  else Qimage = req.file.filename;
  pool.getConnection(function (err, connection) {
    var qnaWrite_sql = 'insert into qna_info(Qtime, Q_RID, QTitle, Question, Qimage) values(now(), ?, ?, ?, ?)';
    connection.query(qnaWrite_sql, [Q_RID, Qtitle, Question, Qimage], function (err, result) {
      if (err) console.error("err : " + err);
      res.redirect('/qna');
      connection.release();
    });
  });
});


router.get('/qna_detail/:Qtime', function (req, res, next) {
  // Session ID 가져오기
  var Qtime = req.params.Qtime;
  var user_id = "2016722036";
  if (user_id == null) {
    res.send('<script type="text/javascript">alert("로그인 후 이용 바랍니다.");</script>');
    res.redirect('/');
  }
  pool.getConnection(function (err, connection) {
    var userInfo_sql = 'SELECT * FROM qna_info WHERE Qtime = ?';
    var ismyQna_sql = 'SELECT * FROM qna_info WHERE Qtime = ? and Q_RID = ?';
    var hitup_sql = 'UPDATE qna_info SET Qhit=Qhit+1 WHERE Qtime = ?';
    connection.query(userInfo_sql, [Qtime], function (err, row) {
      connection.query(ismyQna_sql, [Qtime, user_id], function (err, myqna) {
        connection.query(hitup_sql, [Qtime]);
        if (err) console.error("err : " + err);
        console.log("공지사항 접속 : ", row);
        // console.log(saleprice);
        res.render('customer_qna_detail', {
          title: "질문과 답변",
          row: row[0],
          myqna: myqna
        });
      });
      connection.release();
    });
  });
});

router.post('/qna_delete/:page', function (req, res, next) {
  var Qtime = req.params.page;
  var qnaDelete_sql = 'DELETE FROM qna_info WHERE Qtime = ?';
  pool.getConnection(function (err, connection) {
    connection.query(qnaDelete_sql, [Qtime], function (err, result) {
      if (err) console.error("err : " + err);
      res.redirect('/qna');
      connection.release();
    });
  });
});

module.exports = router;
