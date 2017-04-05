const jwt = require('jsonwebtoken');
const express = require('express');
const router = new express.Router();

//Incializamos sequelize
const sequelize = require('../db').sequelize;

//Cargamos los modelos
const models = require('../models')(sequelize);


/**
 * Validate the change profile form
 *
 * @param {object} payload - the HTTP body message
 * @returns {object} The result of validation. Object contains a boolean validation result,
 *                   errors tips, and a global message for the whole form.
 */
function validateChangeProfileForm(payload) {
  let isFormValid = true;
  let message = '';

  if (!payload || typeof payload.name !== 'string' || payload.name.trim().length === 0) {
    isFormValid = false;
    message = 'Please provide your name ';
  }

  if (!payload || typeof payload.email !== 'string' || payload.email.trim().length === 0) {
    isFormValid = false;
    message = message != "" ? message + 'and please provide your email address ' : "Please provide your email address ";

  }

  if (payload.new_password && payload.confir_new_password && 
    !(payload.confir_new_password.trim()===payload.new_password.trim())){
    isFormValid = false;
    message = message != "" ? message + 'and new passwords must be the same ' : 'New passwords must be the same ';
  }

  if (payload.new_password && (typeof payload.new_password !== 'string' || payload.new_password.trim().length < 8) ||
   payload.confir_new_password && (typeof payload.confir_new_password !== 'string' || payload.confir_new_password.trim().length < 8)) {
    isFormValid = false;
    message = message != "" ? message + 'and new password should be between 8 and 15 alphanumeric characters ' : 'New password should be between 8 and 15 alphanumeric characters ';
  }

  if(!payload.password){
    isFormValid = false;
    message = message != "" ? message + "and password couldn't be empty " : "Password couldn't be empty ";
  }

  return {
    success: isFormValid,
    message
  };
}


router.post('/changeProfile', (req, res) => {
  const validationResult = validateChangeProfileForm(req.body);
  if (!validationResult.success) {
    return res.status(400).json({
      success: false,
      message: validationResult.message,
    });
  }
  models.User.findOne({
        where: {
            id: req.userId
        }
    }).then(function(user){
      if(!user.verifyPassword(req.body.password)){
        return res.status(400).json({
            success: false,
            message: "Current password is not correct.",
          });
      }
      if(req.body.new_password) 
        user.password = req.body.new_password;
        user.email = req.body.email.trim().toLowerCase();
        user.name = req.body.name;
        user.save().then(function(){
          return res.status(200).json({
            success: true,
            message: "You have changed your profile correctly!",
            user
          });
        }, function(){
          return res.status(400).json({
            success: false,
            message: "Error changing user profile. This email alredy exist"
          });
        })
      }, function(err){
        return res.status(400).json({
        success: false,
        message: "Error. User not found.",
        });
      })
});


module.exports = router;