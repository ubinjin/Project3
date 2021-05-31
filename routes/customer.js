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
  if (req.session.user == undefined) {
    req.session.user = {
      id: req.sessionID,
      pw: '0',
      name: "비회원",
      Ucase: 0,
      authorized: true
    };
    pool.getConnection(function (err, connection) {
      var nonmember_sql = 'insert into register_info values(?, ?, ?, ?, ?, ?, ?, ?)';

      connection.query(nonmember_sql, [req.session.user.id, req.session.user.name, req.session.user.pw, '-', '-', 0, req.session.user.id, 0], function (err, res) {});
    });
  }
  res.redirect('/tab');
});

router.get('/tab', function (req, res, next) {
  let page = 0;
  if (req.session.user == undefined) {
    req.session.user = {
      id: req.sessionID,
      pw: '0',
      name: "비회원",
      Ucase: 0,
      authorized: true
    };
    pool.getConnection(function (err, connection) {
      var nonmember_sql = 'insert into register_info values(?, ?, ?, ?, ?, ?, ?, ?)';
      connection.query(nonmember_sql, [req.session.user.id, req.session.user.name, req.session.user.pw, '-', '-', 0, req.session.user.id, 0], function (err, res) {});
    });
  }
  let user_id = req.session.user.id;
  console.log("user: ", req.session.user.name);

  pool.getConnection(function (err, connection) {
    var ProductList_sql = "SELECT * FROM product_info as p left join (SELECT SUM(Dquantity) as sum, D_PID FROM deal_info, product_info GROUP BY D_PID) as d on p.PID = d.D_PID ORDER BY sum desc;" +
      "SELECT * FROM product_info ORDER BY Salerate desc;" +
      "SELECT * FROM product_info ORDER BY Recommend desc;" +
      "SELECT * FROM product_info as p left join (SELECT count(*) as star_sum, R_PID FROM review_info GROUP BY R_PID) as r on R_PID = PID ORDER BY star_sum desc;" +
      "SELECT p.PID as PID, r.rec_RID as RID FROM product_info as p join (SELECT * FROM recommend_info WHERE rec_RID = ?) as r on p.PID = r.rec_PID;";
      connection.query(ProductList_sql, [user_id, user_id], function (err, rows) {
      if (err) console.error("err : " + err);
      console
      // console.log("rows : " + JSON.stringify(rows))
      res.render('main', {
        title: '당골찬',
        page: page,
        rows: rows,
        name: req.session.user.name
      });
      connection.release();
    });
  });
});


router.get('/tab/:page', function (req, res, next) {
  var page = req.params.page;
  var user_id = req.session.user.id;
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
  } else
    where = " where Pname Like '%" + page + "%' ";
  pool.getConnection(function (err, connection) {
    var ProductList_sql = "SELECT * FROM product_info as p left join (SELECT SUM(Dquantity) as sum, D_PID FROM deal_info, product_info GROUP BY D_PID) as d on p.PID = d.D_PID" + where + "ORDER BY sum desc;" +
      "SELECT * FROM product_info" + where + "ORDER BY Salerate desc;" +
      "SELECT * FROM product_info" + where + "ORDER BY Recommend desc;" +
      "SELECT * FROM product_info as p left join (SELECT count(*) as star_sum, R_PID FROM review_info GROUP BY R_PID) as r on R_PID = PID" + where + "ORDER BY star_sum desc;" +
      "SELECT p.PID as PID, r.rec_RID as RID FROM product_info as p join (SELECT * FROM recommend_info WHERE rec_RID = ?) as r on p.PID = r.rec_PID;";
    connection.query(ProductList_sql, [user_id, user_id], function (err, rows) {
      if (err) console.error("err : " + err);
      // console.log("rows : " + JSON.stringify(rows));
      res.render('main', {
        title: '당골찬',
        page: page,
        rows: rows,
        name: req.session.user.name
      });
      connection.release();
    });
  });

  router.post('/recommend', function (req, res) {
    var PID = req.body.PID;
    var opt = req.body.opt;
    var link = req.body.link;
    var location = req.body.locatoin;
    console.log(location);
    var user_id = req.session.user.id;
    pool.getConnection(function (err, connection) {
      if (opt == 0) {
        var unRecommend_sql = "DELETE FROM recommend_info WHERE rec_PID = ? and rec_RID = ?";
        var unRecommend_sql2 = "UPDATE product_info SET Recommend = Recommend - 1 WHERE PID = ?";
        connection.query(unRecommend_sql, [PID, user_id], function (err, row) {
          connection.query(unRecommend_sql2, [PID]);
          if (err) console.error("err : " + err);
          res.send("<script type='text/javascript'>window.location='" + link + "';</script>");
          //connection.release();
        });
      } else {
        var Recommend_sql = "INSERT INTO recommend_info VALUES(?, ?)";
        var Recommend_sql2 = "UPDATE product_info SET Recommend = Recommend + 1 WHERE PID = ?";
        connection.query(Recommend_sql, [user_id, PID], function (err, row) {
          connection.query(Recommend_sql2, [PID]);
          if (err) console.error("err : " + err);
          res.send("<script type='text/javascript'>window.location='" + link + "';</script>");
          //connection.release();
        });
      }
    });
  });
});

////////////////////////////////////////////////// watch product detail info ///////////////////////////////////
router.get('/detail/:PID', function (req, res) {
  var Product_idx = req.params.PID;
  var user_id = req.session.user.id;
  console.log(user_id);
  var Saleprice = 0;
  pool.getConnection(function (err, connection) {
    var Productinfo_sql = 'SELECT * FROM product_info where PID=?';
    var Reviewinfo_sql = 'select reg.Rname, rev.R_RID, rev.R_PID, rev.R_DID, rev.Review, rev.Star, rev.Rtime, rev.Rimage from register_info as reg join review_info as rev on reg.RID = rev.R_RID where rev.R_PID=?';
    connection.query(Productinfo_sql, [Product_idx], function (err, product) {
      if (err) console.error("err : " + err);
      connection.query(Reviewinfo_sql, [Product_idx], function (err, review) {
        if (err) console.error("err : " + err);
        Saleprice = product[0].Price * (100 - product[0].Salerate) / 100;
        //console.log(beauty_date_to_str(product[0].Ptime));
        res.render('detail', {
          title: "상품 조회",
          product: product[0],
          reviews: review,
          saleprice: Saleprice,
          date: beauty_date_to_str(new Date(product[0].Ptime)),
          name: req.session.user.name
        });
        connection.release();

      });
    });
  });
});
/////////////////////////////////////// buy product //////////////////////////////////////////
router.post('/detail/:PID/buy', upload.single('image'), function (req, res) {
  var now = new Date();
  var user_id = req.session.user.id;
  now = date_to_str(now);
  console.log(req.body);
  /* to deal_info table */
  var Product_idx = req.params.PID;
  var DID = req.body.P_RID + "_" + req.body.D_PID + "_" + now;
  var P_RID = req.body.P_RID;
  var S_RID = req.body.S_RID;
  var D_PID = req.body.D_PID;
  var Dtime = now;
  var Dquantity = req.body.Dquantity;
  var Dstate = '결제완료';
  var Daddress = req.body.Daddress;
  var DphoneNum = req.body.DphoneNum;
  /* to register_info table(update customer's cash) */
  var Rest_cash = Number(req.body.Cash) - Number(req.body.Price) * Number(req.body.Dquantity);
  var Rest_stock = Number(req.body.Stock) - Number(req.body.Dquantity);
  var Stock = req.body.Stock;
  console.log(Stock);
  console.log(Rest_stock);
  //console.log(Rest_cash);

  var datas = [DID, P_RID, S_RID, D_PID, Dtime, Dquantity, Dstate, Daddress, DphoneNum, Number(Rest_cash), user_id, Number(Rest_stock), D_PID];
  if(Rest_cash >= 0){
    if(Dquantity > 0){
      if(Rest_stock >= 0){
        pool.getConnection(function (err, connection) {
          var InsertdealandUpdateCash_multisql = "insert into deal_info(DID, P_RID, S_RID, D_PID, Dtime, Dquantity, Dstate, Daddress, Dphone) values(?,?,?,?,?,?,?,?,?);" +
            "update register_info set cash = ? where RID = ?;" + 
            "update product_info set stock = ? where PID = ?;";
          connection.query(InsertdealandUpdateCash_multisql, datas, function (err, result) {
            if (err) console.error(err);
            //console.log(result);
            res.send("<script>alert('결제 완료!');window.location='http://localhost:1001/customer/mypage';window.reload(true);</script>");
            connection.release();
          });
        });
      } else {
        res.send("<script>alert('현재 상품은 수량이 " + Stock + "개 남아 " + Dquantity + "개를 구매할 수 없습니다.');window.location='http://localhost:1001/customer/detail/" + Product_idx + "/buy';window.reload(true);</script>");
      }
    } else {
      res.send("<script>alert('수량을 추가하세요!');window.location='http://localhost:1001/customer/detail/" + Product_idx + "/buy';window.reload(true);</script>");
    }
  } else {
    res.send("<script>alert('돈을 충전하세요!');window.location='http://localhost:1001/customer/mypage';window.reload(true);</script>");
  }

});

router.get('/detail/:PID/buy', function (req, res) {
  var Cart_now = new Date();
  Cart_now = date_to_str(Cart_now);
  var user_id = req.session.user.id;
  var Product_idx = req.params.PID;
  var Saleprice = 0;
  pool.getConnection(function (err, connection) {
    if (err) console.error("커넥션 객체 얻어오기 에러 : ", err);
    var ProductandRegisterinfo_sql = 'select * from product_info as p, register_info as r where p.PID=? and r.RID = ?';
    connection.query(ProductandRegisterinfo_sql, [Product_idx, user_id], function (err, product) {
      if (err) console.error(err);
      console.log("update에서 1개 글 조회 결과 확인 : ", product);
      console.log(Cart_now);
      Saleprice = product[0].Price * (100 - product[0].Salerate) / 100;
      res.render('buy', {
        title: "결제",
        product: product[0],
        saleprice: Saleprice,
        date: beauty_date_to_str(new Date(product[0].Ptime)),
        cart_time: Cart_now,
        user_id: user_id,
        name: req.session.user.name
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
  var R_DID = req.body.R_DID;
  var Review = req.body.Review;
  var Star = req.body.Star;
  var Rimage = req.file.path;
  var Rtime = now;
  console.log(req.body);
  var datas = [R_RID, R_PID, R_DID, Review, Star, Rtime, Rimage];
  pool.getConnection(function (err, connection) {
    var InsertReview_sql = "insert into review_info(R_RID, R_PID, R_DID, Review, Star, Rtime, Rimage) values(?,?,?,?,?,?,?)";
    connection.query(InsertReview_sql, datas, function (err, review) {
      if (err) console.error("err : " + err);
      //res.redirect('/customer/detail/' + Product_idx);
      res.send("<script>alert('작성 완료!');window.location='http://localhost:1001/customer/detail/" + Product_idx + "' ;window.reload(true);</script>");
    });
  });
});


router.get('/detail/:PID/review', function (req, res) {
  var Product_idx = req.params.PID;
  var user_id = req.session.user.id;
  pool.getConnection(function (err, connection) {
    if (err) console.error("커넥션 객체 얻어오기 에러 : ", err);
    var ProductandDealinfo_sql = 'select * from product_info as p, deal_info as d where d.P_RID = ? and p.PID = d.D_PID and D_PID = ?';
    connection.query(ProductandDealinfo_sql, [user_id, Product_idx], function (err, rows) {
      if (err) console.error(err);
      console.log(user_id);
      console.log(rows);
      res.render('write_review', {
        title: "리뷰 작성",
        product_deal: rows[rows.length - 1],
        user_id: user_id,
        name: req.session.user.name
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
  var user_id = req.session.user.id;
  var D_PID = req.body.D_PID;
  var Dquantity = req.body.Dquantity;
  var Ctime = req.body.Ctime;
  var Stock = req.body.Stock;
  var Price = req.body.Price;
  var Cash = req.body.Cash;
  var P_RID = req.body.P_RID;
  var S_RID = req.body.S_RID;
  var Arr_D_PID = [];
  var Arr_Dquantity = [];
  var Arr_Ctime = [];
  var Arr_Stock = [];
  var Arr_Price = [];
  var Arr_Cash = [];
  if (req.body.D_PID instanceof Array) {
    console.log("배열이다.");
    Arr_D_PID = D_PID;
    Arr_Dquantity = Dquantity;
    Arr_Ctime = Ctime;
    Arr_Stock = Stock;
    Arr_Price = Price;
    Arr_Cash = Cash;
  } else {
    console.log("변수다.");
    Arr_D_PID.push(D_PID);
    Arr_Dquantity.push(Dquantity);
    Arr_Ctime.push(Ctime);
    Arr_Stock.push(Stock);
    Arr_Price.push(Price);
    Arr_Cash.push(Cash);
  }
  //console.log(Arr_Cash);
  // var Arr_Ctime = [];
  for (var i = 0; i < req.body.D_PID.length; i++) {
    Arr_Ctime[i] = date_to_str(new Date(Arr_Ctime[i]));
  }
  var Arr_DID = [];
  for (var i = 0; i < req.body.D_PID.length; i++) {
    Arr_DID[i] = P_RID + "_" + Arr_D_PID[i] + "_" + Arr_Ctime[i];
  }
  var Dtime = now;
  var Dstate = '결제완료';
  var Rest_cash = 0;
  var pay_price = 0;
  for (var i = 0; i < Arr_D_PID.length; i++) {
    pay_price += Number(Arr_Dquantity[i] * Arr_Price[i]);
    Arr_Stock[i] = Arr_Stock[i] - Arr_Dquantity[i];

  }
  console.log(pay_price);
  Rest_cash = Arr_Cash - pay_price;
  var datas = [];

  for (var i = 0; i < Arr_D_PID.length; i++) {
    datas[i] = [Arr_DID[i], P_RID, S_RID, Arr_D_PID[i], Dtime, Arr_Dquantity[i], Dstate, Number(Rest_cash), user_id, Arr_D_PID[i], Arr_Stock[i], Arr_D_PID[i]];
    console.log(datas[i]);
  }
  pool.getConnection(function (err, connection) {
    var InsertdealandUpdateCashandDeletecart_multisql = "insert into deal_info(DID, P_RID, S_RID, D_PID, Dtime, Dquantity, Dstate) values(?,?,?,?,?,?,?);" +
      "update register_info set cash = ? where RID = ?;" +
      "delete from cart_info where C_PID=?;" +
      "update product_info set stock = ? where PID = ?;";
    for (var i = 0; i < datas.length; i++) {
      connection.query(InsertdealandUpdateCashandDeletecart_multisql, datas[i], function(err, rrr) {
        console.log(err);
      });
    }
    //res.redirect('/customer/mypage');
    res.send("<script>alert('결제 완료!');window.location='http://localhost:1001/customer/mypage';window.reload(true);</script>");
    connection.release();
  });
});

router.post('/cart/add', upload.single('image'), function (req, res) {
  var PID = req.body.PID;
  var Cquantity = req.body.Qquantity;
  var now = new Date();
  now = date_to_str(now);
  var Stock = req.body.Stock;
  var Rest_stock = Number(Stock) - Cquantity;
  console.log(Rest_stock);
  //console.log(req.body);
  var datas = [now, req.session.user.id, PID, Cquantity];
  console.log(Cquantity);
  console.log(req.body);
  if (Rest_stock > 0) {
    if (Cquantity > 0) {
      pool.getConnection(function (err, connection) {
        var InsertCart_sql = "insert into cart_info(Ctime, C_RID, C_PID, Cquantity) values(?,?,?,?)";
        connection.query(InsertCart_sql, datas, function (err, result) {
          if (err) console.error(err);
          // console.log(result);
          res.redirect('/customer/cart');
          connection.release();
        });
      });
    } else {
      res.send("<script>alert('수량을 추가하세요!');window.location='http://localhost:1001/customer/detail/" + PID + "/buy';window.reload(true);</script>");
    }
  } else {
    res.send("<script>alert('현재 상품은 수량이 " + Stock + "개 남아 " + Cquantity + "개를 구매할 수 없습니다.');window.location='http://localhost:1001/customer/detail/" + PID + "/buy';window.reload(true);</script>");
  }

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
  var user_id = req.session.user.id;
  pool.getConnection(function (err, connection) {
    var Cartinfo_sql = "select * from cart_info as c, product_info as p, register_info as r where p.PID = c.C_PID and r.RID = c.C_RID and c.C_RID=?";
    var Priceinfo_sql = "select Price, Salerate from cart_info as c, product_info as p where p.PID = c.C_PID and c.C_RID=?";
    var Quantityinfo_sql = "select Cquantity from cart_info as c, product_info as p where p.PID = c.C_PID and c.C_RID=?";
    var Stockinfo_sql = "select Stock from cart_info as c, product_info as p where p.PID = c.C_PID and c.C_RID=?";
    var GetCash_sql = "select Cash from register_info where RID=?";
    var Priceinfo = [];
    var Quantityinfo = [];
    var Stockinfo = [];
    var Cash = 0;
    var Pay_price = 0;
    console.log(user_id);
    connection.query(Priceinfo_sql, user_id, function (err, price) {
      if (err) console.error("err : " + err);
      Priceinfo = price;
      console.log(Priceinfo);
    });
    connection.query(Quantityinfo_sql, user_id, function (err, Quantity) {
      if (err) console.error("err : " + err);
      Quantityinfo = Quantity;
      console.log(Quantityinfo);
    });
    connection.query(Stockinfo_sql, user_id, function (err, Stock) {
      if (err) console.error("err : " + err);
      Stockinfo = Stock;
      console.log(Stockinfo);
    });
    connection.query(GetCash_sql, user_id, function (err, cash) {
      if (err) console.error("err : " + err);
      Cash = cash[0].Cash;
      // console.log(cash[0].Cash);
    });
    connection.query(Cartinfo_sql, [user_id], function (err, cart) {
      if (err) console.error("err : " + err);
      res.render('cart', {
        title: "장바구니",
        cart: cart,
        cash: Cash,
        price: Priceinfo,
        quantity: Quantityinfo,
        stock: Stockinfo,
        pay_price: Pay_price,
        user_id: user_id,
        name: req.session.user.name
      });
      connection.release();
    });
  });
});
////////////////////////////////////////////////////////////////////////////////////////////////////

router.post('/search', function (req, res) {
  var search = req.body.search;
  pool.getConnection(function (err, connection) {
    var search_sql = "SELECT * FROM product_info WHERE Pname LIKE '%" + search + "%';";
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
  var Q_RID = req.session.user.id;

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
  var user_id = req.session;
  if (req.session.user != undefined)
    user_id = req.session.user.id;
  else
    user_id = null;
  if (user_id == null) {
    res.send('<script type="text/javascript">alert("로그인 후 이용 바랍니다.");window.location="http://localhost:1001/customer/";window.reload(true);</script>');
  }
  pool.getConnection(function (err, connection) {
    var userInfo_sql = 'SELECT * FROM register_info where RID = ?;';
    var userdealInfo_sql = 'SELECT * FROM product_info as p, deal_info as d WHERE d.P_RID = ? and p.PID = d.D_PID order by Dtime desc;';
    var userqna_sql = 'SELECT * FROM qna_info WHERE Q_RID = ?;';
    var userreview_sql = 'SELECT * FROM review_info as r JOIN product_info as p ON r.R_PID = p.PID WHERE r.R_RID = ?;';
    var recommend_sql = 'select * from recommend_info as r, product_info as p where r.rec_RID = ? and r.rec_RID = ? and r.rec_PID = p.PID;';
    var merged_sql = userInfo_sql + userdealInfo_sql + userqna_sql + userreview_sql + recommend_sql;
    connection.query(merged_sql, [user_id, user_id, user_id, user_id, user_id, user_id], function (err, rows) {
      if (err) console.error("err : " + err);
      console.log(rows[0]);
      // console.log(saleprice);
      res.render('mypage', {
        title: "마이 페이지",
        rows: rows,
        name: req.session.user.name
      });
      connection.release();
    });
  });
});

router.post('/cash_add', function (req, res, next) {
  var cash = req.body.cash;
  var user_id = req.session.user.id;
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
  var user_id = req.session.user.id;
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
  var user_id = req.session.user.id;
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
        notices: row,
        name: req.session.user.name
      });
      connection.release();
    });
  });
});

router.get('/notice_detail/:Ntime', function (req, res, next) {
  // Session ID 가져오기
  var Ntime = req.params.Ntime;
  var user_id = req.session.user.id;
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
        notice: row[0],
        name: req.session.user.name
      });
      connection.release();
    });
  });
});

router.get('/qna', function (req, res) {
  // Session ID 가져오기
  var user_id = req.session.user.id;
  if (user_id == null) {
    res.send('<script type="text/javascript">alert("로그인 후 이용 바랍니다.");</script>');
    res.redirect('/');
  }
  pool.getConnection(function (err, connection) {
    var userInfo_sql = 'select * from qna_info as q join (select RID, Rname from register_info) as r on q.Q_RID=RID;';
    connection.query(userInfo_sql, function (err, row) {
      if (err) console.error("err : " + err);
      // console.log("질문답변 접속 : ", row);
      // console.log(saleprice);
      res.render('customer_qna', {
        title: "질문과 답변",
        row: row,
        name: req.session.user.name
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
  var user_id = req.session.user.id;
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
          myqna: myqna,
          name: req.session.user.name
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