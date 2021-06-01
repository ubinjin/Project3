require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mysql = require("mysql");
var session = require("express-session");
var MySQLStore = require("express-mysql-session")(session);
// MYSQL-SESSION setup starts
var connection = mysql.createConnection({
    connectionLimit: process.env.DB_connectionLimit,
    host: process.env.DB_host,
    port: process.env.DB_port,
    user: process.env.DB_user,
    password: process.env.DB_password,
    database: process.env.DB_database,
    dateStrings: process.env.DB_dateStrings
});
var options = {
    connectionLimit: process.env.DB_connectionLimit,
    host: process.env.DB_host,
    port: process.env.DB_port,
    user: process.env.DB_user,
    password: process.env.DB_password,
    database: process.env.DB_database,
    dateStrings: process.env.DB_dateStrings
};

// const {
//     request,
//     response
// } = require('./app');

var sessionStore = new MySQLStore(options);

// MYSQL-SESSION setup end
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var testRouter = require('./routes/test');

var customer = require('./routes/customer');
var fs = require('fs');
var ejs = require('ejs');

var adminRouter = require('./routes/admin');
var joinFormRouter = require('./routes/joinForm');

var loginRouter = require('./routes/login');

var logoutRouter = require('./routes/logout');

var app = express();
app.use(
    session({
        key: "session_cookie_name",
        secret: "session_cookie_secret",
        store: sessionStore,
        resave: false,
        saveUninitialized: false,
    })
);
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.static(path.join(__dirname, 'public/images')));
app.use('/', customer);
app.use('/customer', customer);

global.headerFormat = fs.readFileSync(
    "./views/header.html",
    "utf8"
);
global.header = ejs.render(headerFormat);
global.headerFormat2 = fs.readFileSync(
    "./views/header2.html",
    "utf8"
);
global.header2 = ejs.render(headerFormat2);
global.headerFormat3 = fs.readFileSync(
    "./views/header3.html",
    "utf8"
);
global.header3 = ejs.render(headerFormat3);
app.use('/upload', express.static(path.join(__dirname + '/upload')));

app.use('/index', indexRouter);
app.use('/users', usersRouter);
app.use('/test', testRouter);
app.use('/login', loginRouter);
app.use('/logout', logoutRouter);
app.route(/^\/admin(?:\/(.*))?$/).all(function(req, res, next) {
    var path = req.params[0];
    console.log("좆됐다 ㅋㅋ");
    console.log(req.session.user);
    if (req.session.user) {
        if (req.session.user.Ucase == "1")
            next();
        else
            return res.redirect('/');
    }
    else {
        var fullUrl = req.protocol + '://' + req.headers.host + req.originalUrl;
        console.log(fullUrl);
        console.log('로그인 정보 없음 리다이렉트');
        console.log('http://' + req.headers.host);
        return res.redirect('http://' + req.headers.host);
    }
});
app.use('/admin', adminRouter);
app.use('/joinForm', joinFormRouter);

app.use(express.static(__dirname + '/join_images'));
app.use('/admin', express.static('./join_images'));
app.use('/join_images', express.static('./join_images'));


var connection = mysql.createConnection(options); // or mysql.createPool(options);
var sessionStore = new MySQLStore({} /* session store options */ , connection);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
