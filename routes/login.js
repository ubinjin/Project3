require('dotenv').config();
var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var crypto = require('crypto');

var pool = mysql.createPool({
    connectionLimit: process.env.DB_connectionLimit,
    host: process.env.DB_host,
    port: process.env.DB_port,
    user: process.env.DB_user,
    password: process.env.DB_password,
    database: process.env.DB_database,
    dateStrings: process.env.DB_dateStrings
});

router.get('/', function(req, res, next) {
    res.render('login', {
        title: "로그인 페이지",
    });
});

router.post("/", function(req, res, next) {
    var in_id = req.body.id;
    var in_passwd = req.body.passwd;
    console.log(in_id)
    var salt = Math.round((new Date().valueOf() + Math.random())) + "";
    var hashPassword = crypto.createHash("sha512").update(in_passwd + salt).digest("hex");
    if (req.session.user) {
        if (req.session.user.Ucase == "0")
            res.send("<script>alert('이미 로그인된 고객님입니다.. 먼저 로그아웃 해주세요');window.location='http://localhost:1001/tab';window.reload(true);</script>");
        else if (req.session.user.Ucase == "1")
            res.send("<script>alert('이미 로그인된 관리자입니다.. 먼저 로그아웃 해주세요');window.location='http://localhost:1001/admin/seller_list/1';window.reload(true);</script>");
        else {
            delete req.session.user;
            req.session.save(() => {
                res.redirect('/login');
            });
            res.send("<script>alert('비정상적인 접근(세션)입니다..');history.back();</script>");
        }
    }
    else if (in_id && in_passwd) {
        pool.getConnection(function(err, connection) {
            var sqlForIDPW = "select * from register_info where RID =? and password = ?";
            connection.query(sqlForIDPW, [in_id, in_passwd], function(error, results, fields) {
                if (error) {
                    console.error("err: " + error);
                    console.log(results);
                    console.log(fields);
                }
                else if (results.length > 0) {
                    //req.session.loggedin=true;
                    //req.session.stu_id = student_id;
                    // res.json({stu_id :in_stu_id});
                    req.session.user = {
                        id: in_id,
                        pw: in_passwd,
                        name: results[0].Rname,
                        Ucase: results[0].Ucase,
                        authorized: true
                    };

                    req.session.save(() => {
                        //0 구매자
                        console.log(results[0].Ucase);
                        if (results[0].Ucase == "0") {
                            res.redirect('/tab');
                        }
                        else if (results[0].Ucase == "1") {
                            res.redirect('/admin');
                        }
                        else {
                            res.send("<script>alert('비정상적인 유저입니다..');history.back();</script>");
                        }
                    });
                }
                else {
                    res.send("<script>alert('아이디 혹은 비밀번호를 확인하세요.');history.back();</script>");
                    //res.redirect('/login?e=' + encodeURIComponent('Incorrect username or password'));
                }
            });
        });
    }
    else {
        res.send("<script>alert('알수없는 오류!.');history.back();</script>");
    }
});


module.exports = router;
