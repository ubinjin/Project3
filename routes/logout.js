require('dotenv').config();
var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var crypto = require('crypto');


router.get('/', function(req, res) {
    delete req.session.user;
    req.session.save(() => {
        res.redirect('/');
    });
});

module.exports = router;
