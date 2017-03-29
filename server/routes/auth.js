const express = require('express');
const passport = require('passport');
const router = new express.Router();
const nodemailer = require('nodemailer');
const async = require('async');
const crypto = require('crypto');
const Model = require('../models/models');
const email = require('../../config/config.json')[process.env.MODE_RUN].email;

router.post('/login', (req, res, next) => {
  return passport.authenticate('local-login', (err, token, userData) => {
    if (err) {
      if (err.name === 'IncorrectCredentialsError') {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Could not process the form.'
      });
    }
    return res.json({
      success: true,
      message: 'You have successfully logged in!',
      token,
      user: {
        name: userData.name,
        email: req.body.email.toLowerCase()
       } 
    });
  })(req, res, next);
});

router.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      Model.User.findByEmail(req.body.email, function(err, user) {
        if (!user) {
          return res.status(400).json({
          success: false,
          message: "No user registered with this email!"
          });
        }

        //Se ha creado anteriormente un token aleatorio
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour 

        user.save().then(function(user) {
          done(err, token, user);
          }, function(err){
             done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: email.email,
          pass: email.password
        }
      });
      var mailOptions = {
        to: user.email.toLowerCase(),
        from: 'passwordreset@demo.com',
        subject: 'Node.js Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/#/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions,function(err) {
        res.status(200).json({
        message: "An e-mail has been sent to " + user.email.toLowerCase() + " with further instructions."
        });
        done(err, 'done');
      });
      
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/');
  });
});

router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      Model.User.findOne({
                    where: {
                        resetPasswordToken: req.params.token,
                        resetPasswordExpires: {$gt: Date.now()}
                    }
                })
      .then(function(user, err){
        if (!user) {
          return res.status(400).json({
          success: false,
          message: "Password reset token is invalid or has expired."
          });
        }

        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        user.save().then(function(user, err) {
            done(err, user);
          });
        });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: email.email,
          pass: email.password
        }
      });
      var mailOptions = {
        to: user.email.toLowerCase(),
        from: 'passwordreset@demo.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email.toLowerCase() + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions,function(err) {
        res.status(200).json({
        message: "An e-mail has been sent to " + user.email.toLowerCase() + " with confirmation. The password has been changed"
        });
        done(err, 'done');
      });
    }
  ], function(err) {
    res.redirect('/');
  });
});


module.exports = router;