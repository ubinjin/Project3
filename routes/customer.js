var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var pool = mysql.createPool({
  connectionLimit: 20,
  host: '223.194.46.205',
  port: 3306,
  user: 'root',
  password: 'pro4spro4s!',
  database: 'swe'
});

var upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'public/images');
        },
        filename: function (req, file, cb) {
            cb(null, file.originalname);
        }
    }),
});


/* GET home page. */
router.get('/detail', function(req, res, next){
  pool.getConnection(function(err, connection){
    connection.query('SELECT * FROM product_info', function(err, rows){
      if(err) console.error("err : "+err);
      console.log("rows : " + JSON.stringify(rows));

      res.render('detail', {title: "db_test", rows: rows});
      connection.release();
    });
  });
});
module.exports = router;
