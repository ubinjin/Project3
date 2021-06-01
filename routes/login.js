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
    multipleStatements: true,
    dateStrings: process.env.DB_dateStrings
});

router.get('/', function(req, res, next) {
    if (req.session.user) {
        if (req.session.user.Ucase == "0") {
            if (req.session.user.name === "비회원") {
                res.render('login', {
                    title: "로그인 페이지",
                });
            }
            else res.send("<script>alert('이미 로그인된 고객님입니다.. 먼저 로그아웃 해주세요');window.location='http://localhost:1001/tab';window.reload(true);</script>");
        }
        else if (req.session.user.Ucase == "1")
            res.send("<script>alert('이미 로그인된 고객님입니다.. 먼저 로그아웃 해주세요');window.location='http://localhost:1001/admin';window.reload(true);</script>");
        else {
            delete req.session.user;
            req.session.save(() => {
                res.redirect('/login');
            });
            res.send("<script>alert('비정상적인 접근(세션)입니다..');history.back();</script>");
        }
    }
    else {
        res.render('login', {
            title: "로그인 페이지",
        });
    }
});

router.post("/", function(req, res, next) {

    if (req.session.user) {
        if (req.session.user.name === "비회원") {
            next();
        }
        else if (req.session.user.Ucase == "0") {
            res.send("<script>alert('이미 로그인된 고객님입니다.. 먼저 로그아웃 해주세요');window.location='http://localhost:1001/tab';window.reload(true);</script>");
        }
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
    else next();
});
router.post("/", function(req, res, next) {
    var in_id = req.body.id;
    var in_passwd = req.body.passwd;
    var not_member_ID = req.session.user.id;
    var not_member_name = req.session.user.name;
    console.log(req.session.user);
    var salt = Math.round((new Date().valueOf() + Math.random())) + "";
    var hashPassword = crypto.createHash("sha512").update(in_passwd + salt).digest("hex");

    if (in_id && in_passwd) {
        pool.getConnection(function(err, connection) {
            var sqlForIDPW = "select * from register_info where RID =? and password = ?;";
            connection.query(sqlForIDPW, [in_id, in_passwd], function(error, results, fields) {
                console.log(JSON.stringify(JSON.stringify(results)));
                console.log(JSON.stringify(JSON.stringify(fields)));
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
                        pw: hashPassword,
                        name: results[0].Rname,
                        Ucase: results[0].Ucase,
                        authorized: true
                    };

                    req.session.save(() => {
                        //0 구매자
                        console.log(results[0].Ucase);
                        if (results[0].Ucase == "0") {
                            console.log(not_member_ID);
                            console.log(not_member_name);
                            if (not_member_name === "비회원") {
                                console.log(not_member_ID);
                                var sqlForRegDeletion = "delete from register_info where RID=?;"; //기존 비회원 register 삭제
                                var sqlForCartPaste = "update cart_info set C_RID=? where C_RID=?;"; //회원이 담은것으로 변경
                                var merged_sql = sqlForCartPaste + sqlForRegDeletion;
                                //update만 하는것으로 수정
                                connection.query(merged_sql, [in_id, not_member_ID, not_member_ID], function(error, results, fields) {

                                });
                            }
                            res.redirect('/');
                        }
                        else if (results[0].Ucase == "1") {
                            var sqlForCartDeletion = "delete from cart_info where C_RID=?;"; //회원이 담은것으로 변경
                            var sqlForRegDeletion = "delete from register_info where RID=?"; //기존 비회원 register 삭제
                            var merged_sql2 = sqlForCartDeletion + sqlForRegDeletion;

                            connection.query(merged_sql2, [not_member_ID, not_member_ID], function(error, res) {
                                console.log(error);
                            });
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
            connection.release();
        });
    }
    else {
        res.send("<script>alert('알수없는 오류!.');history.back();</script>");
    }
});


module.exports = router;
