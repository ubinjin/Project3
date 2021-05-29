var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var multer = require('multer');
var moment = require('moment');

var pool = mysql.createPool({
  connectionLimit: process.env.DB_connectionLimit,
  host: process.env.DB_host,
  port: process.env.DB_port,
  user: process.env.DB_user,
  password: process.env.DB_password,
  database: process.env.DB_database,
  multipleStatements: true,
  dateStrings: process.env.DB_dateStrings
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


router.get('/', function (req, res, next) {
  res.redirect('/tab');
});

router.get('/tab', function (req, res, next) {
  page = 0;
  var user_id = "2016722036";
  pool.getConnection(function (err, connection) {
    var ProductList_sql = "SELECT * FROM product_info as p join (SELECT SUM(Dquantity) as sum, D_PID FROM deal_info, product_info GROUP BY D_PID) as d on p.PID = d.D_PID ORDER BY sum desc;" +
      "SELECT * FROM product_info ORDER BY Salerate desc;" +
      "SELECT * FROM product_info ORDER BY Recommend desc;" +
      "SELECT * FROM product_info as p left join (SELECT count(*) as star_sum, R_PID FROM review_info GROUP BY R_PID) as r on R_PID = PID ORDER BY star_sum desc;" +
      "SELECT p.PID as PID, r.rec_RID as RID FROM product_info as p join (SELECT * FROM recommend_info WHERE rec_RID = ?) as r on p.PID = r.rec_PID;";
    connection.query(ProductList_sql, [user_id], function (err, rows) {
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
  var user_id = "2016722036";
  var where = "";
  if (page == 0) {
    where = "";
  } else if (page == 1) {
    where = " where Pcategory='새우장' ";
  } else if (page == 2) {
    where = " where Pcategory='게장' ";
  } else if (page == 3) {
    where = " where Pcategory='계란장' ";
  } else if (page == 4) {
    where = " where Pcategory='김치' ";
  }
  else
    where = " where Pname Like '%" + page + "%' ";
  pool.getConnection(function (err, connection) {
    var ProductList_sql = "SELECT * FROM product_info as p join (SELECT SUM(Dquantity) as sum, D_PID FROM deal_info, product_info GROUP BY D_PID) as d on p.PID = d.D_PID" + where + "ORDER BY sum desc;" +
      "SELECT * FROM product_info" + where + "ORDER BY Salerate desc;" +
      "SELECT * FROM product_info" + where + "ORDER BY Recommend desc;" +
      "SELECT * FROM product_info as p left join (SELECT count(*) as star_sum, R_PID FROM review_info GROUP BY R_PID) as r on R_PID = PID" + where + "ORDER BY star_sum desc;" +
      "SELECT p.PID as PID, r.rec_RID as RID FROM product_info as p join (SELECT * FROM recommend_info WHERE rec_RID = ?) as r on p.PID = r.rec_PID;";
    connection.query(ProductList_sql, [user_id], function (err, rows) {
      if (err) console.error("err : " + err);
      // console.log("rows : " + JSON.stringify(rows));
      res.render('main', {
        title: '당골찬',
        page: page,
        rows: rows,
      });
      connection.release();
    });
  });
});

router.post('/recommend', function (req, res) {
  var PID = req.body.PID;
  var opt = req.body.opt;
  var user_id = "2016722036";
  console.log(PID, opt);
  pool.getConnection(function (err, connection) {
    if (opt == 0) {
      var unRecommend_sql = "DELETE FROM recommend_info WHERE rec_PID = ? and rec_RID = ?";
      var unRecommend_sql2 = "UPDATE product_info SET Recommend = Recommend - 1 WHERE PID = ?";
      connection.query(unRecommend_sql, [PID, user_id], function (err, row) {
        connection.query(unRecommend_sql2, [PID]);
        if (err) console.error("err : " + err);
        res.redirect('/tab');
        connection.release();
      });
    } 
    else {
      var Recommend_sql = "INSERT INTO recommend_info VALUES(?, ?)";
      var Recommend_sql2 = "UPDATE product_info SET Recommend = Recommend + 1 WHERE PID = ?";
      connection.query(Recommend_sql, [user_id, PID], function (err, row) {
        connection.query(Recommend_sql2, [PID]);
        if (err) console.error("err : " + err);
        res.redirect('/tab');
        connection.release();
      });
    }
  });
});

////////////////////////////////////////////////// watch product detail info ///////////////////////////////////
router.get('/detail/:PID', function (req, res) {
  var Product_idx = req.params.PID;
  var Saleprice = 0;
  pool.getConnection(function (err, connection) {
    var Productinfo_sql = 'SELECT * FROM product_info where PID=?';
    var Reviewinfo_sql = 'select reg.Rname, rev.R_RID, rev.R_PID, rev.R_DID, rev.Review, rev.Star, rev.Rtime, rev.Rimage from register_info as reg join review_info as rev on reg.RID = rev.R_RID where rev.R_PID=?';
    connection.query(Productinfo_sql, [Product_idx], function (err, product) {
      if (err) console.error("err : " + err);
      connection.query(Reviewinfo_sql, [Product_idx], function (err, review) {
        if (err) console.error("err : " + err);
        Saleprice = product[0].Price * (100-product[0].Salerate) / 100;
        //console.log(beauty_date_to_str(product[0].Ptime));
        res.render('detail', {
          title: "상품 조회",
          product: product[0],
          reviews: review,
          saleprice: Saleprice,
          date: beauty_date_to_str(new Date(product[0].Ptime))
        });
        connection.release();

      });
    });
  });
});
/////////////////////////////////////// buy product //////////////////////////////////////////
router.post('/detail/:PID/buy', upload.single('image'), function (req, res) {
  var now = new Date();
  now = date_to_str(now);
  /* to deal_info table */
  var Product_idx = req.params.PID;
  var DID = req.body.P_RID + "_" + req.body.D_PID + "_" + now;
  var P_RID = req.body.P_RID;
  var S_RID = req.body.S_RID;
  var D_PID = req.body.D_PID;
  var Dtime = now;
  var Dquantity = req.body.Dquantity;
  var Dstate = '결제완료';
  console.log("날짜~!", now);
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

router.get('/detail/:PID/buy', function (req, res) {
  var Product_idx = req.params.PID;
  var Saleprice = 0;
  pool.getConnection(function (err, connection) {
    if (err) console.error("커넥션 객체 얻어오기 에러 : ", err);
    var ProductandRegisterinfo_sql = 'select * from product_info as p, register_info as r where p.PID=? and r.RID = 2016722036';
    connection.query(ProductandRegisterinfo_sql, [Product_idx], function (err, product) {
      if (err) console.error(err);
      //console.log("update에서 1개 글 조회 결과 확인 : ", product);
      Saleprice = product[0].Price * (100-product[0].Salerate) / 100;
      res.render('buy', {
        title: "결제",
        product: product[0],
        saleprice: Saleprice,
        date: beauty_date_to_str(new Date(product[0].Ptime))
      });
      connection.release();
    });
  });
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////// write review //////////////////////////////////////////////////////
router.post('/detail/:PID/review', upload.single('image'), function (req, res, next) {
  var now = new Date();
  now = date_to_str(now);
  var Product_idx = req.params.PID;
  var R_RID = req.body.R_RID;
  var R_PID = req.body.R_PID;
  var R_DID = req.body.R_DID;;
  var Review = req.body.Review;
  var Star = req.body.Star;
  var Rimage = req.file.path;
  var Rtime = now;

  var datas = [R_RID, R_PID, R_DID, Review, Star, Rtime, Rimage];
  pool.getConnection(function (err, connection) {
    var InsertReview_sql = "insert into review_info(R_RID, R_PID, R_DID, Review, Star, Rtime, Rimage) values(?,?,?,?,?,?,?)";
    connection.query(InsertReview_sql, datas, function (err, review) {
      if (err) console.error("err : " + err);
      res.redirect('/customer/detail/' + Product_idx);
    });
  });
});


router.get('/detail/:PID/review', function (req, res) {
  var Product_idx = req.params.PID;
  pool.getConnection(function (err, connection) {
    if (err) console.error("커넥션 객체 얻어오기 에러 : ", err);
    var ProductandDealinfo_sql = 'select * from product_info as p, deal_info as d where d.P_RID = 2016722036 and p.PID = d.D_PID and D_PID = ?';
    connection.query(ProductandDealinfo_sql, [Product_idx], function (err, rows) {
      if (err) console.error(err);
      res.render('write_review', {
        title: "리뷰 작성",
        product_deal: rows[rows.length - 1]
      });
      connection.release();
    });
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////// cart info //////////////////////////////////////////////////////
router.post('/cart/pay', function (req, res) {
  var now = new Date();
  now = date_to_str(now);
  var P_RID = req.body.P_RID;
  var S_RID = req.body.S_RID;
  //var D_PID = req.body.D_PID;
  var Arr_DID = [];
  for (var i=0;i<req.body.D_PID.length;i++){
    Arr_DID[i] = req.body.P_RID + "_" + req.body.D_PID[i] + "_" + now;
  }
  var Dtime =  now;
  var Dstate = '결제완료';
  var Rest_cash = req.body.Rest_cash;
  var datas = [];
  for (var i=0;i<req.body.D_PID.length;i++){
    datas[i] = [Arr_DID[i], P_RID, S_RID, req.body.D_PID[i], Dtime, req.body.Dquantity[i], Dstate, Number(Rest_cash), req.body.D_PID[i]];
  }
  pool.getConnection(function (err, connection) {
    var InsertdealandUpdateCashandDeletecart_multisql = "insert into deal_info(DID, P_RID, S_RID, D_PID, Dtime, Dquantity, Dstate) values(?,?,?,?,?,?,?);" +
      "update register_info set cash = ? where RID = '2016722036';" +
      "delete from cart_info where C_PID=?;";
    for (var i=0;i<datas.length;i++){
      console.log(datas);
      connection.query(InsertdealandUpdateCashandDeletecart_multisql, datas[i]);
    }
    res.redirect('/customer/cart');
    connection.release();
  });
});


router.post('/cart/add', upload.single('image'), function (req, res) {
  var PID = req.body.PID;
  var Cquantity = req.body.Qquantity;
  var now = new Date();
  now = date_to_str(now);
  console.log(Cquantity);
  var datas = [now, 2016722036, PID, Cquantity];
  pool.getConnection(function (err, connection) {
    var InsertCart_sql = "insert into cart_info(Ctime, C_RID, C_PID, Cquantity) values(?,?,?,?)";
    connection.query(InsertCart_sql, datas, function (err, result) {
      console.log("cart 추가: ", result);
      if (err) console.error(err);
      // console.log(result);
      res.redirect('/customer/cart');
      connection.release();
    });
  });
});

router.post('/cart/delete', upload.single('image'), function (req, res) {
  var PID = req.body.PID;
  pool.getConnection(function (err, connection) {
    var DeleteCart_sql = "delete from cart_info where C_PID=?";
    connection.query(DeleteCart_sql, PID, function (err, result) {
      if (err) console.error(err);
      // console.log(result);
      console.log("delete");
      res.redirect('/customer/cart');
      connection.release();
    });
  });
});

router.get('/cart', upload.single('image'), function (req, res, next) {
  pool.getConnection(function (err, connection) {
    var Cartinfo_sql = "select * from cart_info as c, product_info as p, register_info as r where p.PID = c.C_PID and r.RID = c.C_RID and c.C_RID='2016722036'";
    var Priceinfo_sql = "select Price, Salerate from cart_info as c, product_info as p where p.PID = c.C_PID and c.C_RID='2016722036'";
    var Quantityinfo_sql = "select Cquantity from cart_info as c, product_info as p where p.PID = c.C_PID and c.C_RID='2016722036'";
    var GetCash_sql = "select Cash from register_info where RID='2016722036'";
    var Priceinfo = [];
    var Quantityinfo = [];
    var Cash = 0;

    connection.query(Priceinfo_sql, function (err, price) {
      if (err) console.error("err : " + err);
      Priceinfo = price;
      //console.log(Priceinfo);
    });
    connection.query(Quantityinfo_sql, function (err, Quantity) {
      if (err) console.error("err : " + err);
      Quantityinfo = Quantity;
      //console.log(Quantityinfo);
    });
    connection.query(GetCash_sql, function (err, cash){
      if (err) console.error("err : " + err);
      Cash = cash[0].Cash;
      // console.log(cash[0].Cash);
    });
    connection.query(Cartinfo_sql, function (err, cart) {
      if (err) console.error("err : " + err);
      console.log(cart[0].Salerate);
      res.render('cart', {
        title: "장바구니",
        cart: cart,
        cash: Cash,
        price: Priceinfo,
        quantity: Quantityinfo
      });
      connection.release();
    });
  });
});
////////////////////////////////////////////////////////////////////////////////////////////////////

router.post('/search', function(req, res) {
  var search = req.body.search;
  pool.getConnection(function(err, connection) {
    var search_sql = "SELECT * FROM product_info WHERE Pname LIKE '%"+ search + "%';";
    connection.query(search_sql, function (err, result) {
      if (err) console.error("err : " + err);
      console.log("결과는? ", result);
      if (result == undefined) {
        res.send("<script type='text/javascript'>alert('찾으시는 상품이 없습니다!'); window.location='http://localhost:1001/customer';window.reload(true);</script>");
      }
      res.redirect("/tab/" + search);
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
    var userdealInfo_sql = 'SELECT * FROM product_info as p, deal_info as d WHERE d.P_RID = ? and p.PID = d.D_PID order by Dtime desc';
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
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////// buy product /////////////////////////////////////////////////////


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

function date_to_str(format) {

  var year = format.getFullYear();

  var month = format.getMonth() + 1;

  if (month < 10)
    month = '0' + month;

  var date = format.getDate();

  if (date < 10)
    date = '0' + date;

  var hour = format.getHours();

  if (hour < 10)
    hour = '0' + hour;

  var min = format.getMinutes();

  if (min < 10)
    min = '0' + min;

  var sec = format.getSeconds();

  if (sec < 10)
    sec = '0' + sec;

  return year + "-" + month + "-" + date + " " + hour + ":" + min + ":" + sec;

}


function beauty_date_to_str(format) {

  var year = format.getFullYear();

  var month = format.getMonth() + 1;

  if (month < 10) 
      month = '0' + month;
  
  var date = format.getDate();

  if (date < 10) 
      date = '0' + date;  
  return year + "-" + month + "-" + date;

}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
module.exports = router;
