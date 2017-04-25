const jwt = require('jsonwebtoken');
const express = require('express');
const router = new express.Router();
const passport = require('passport');
const MODE_RUN = process.env.MODE_RUN || "development"
const email = require('../../config/config.json')[MODE_RUN].email;
const nodemailer = require('nodemailer');


//Incializamos sequelize
const sequelize = require('../db').sequelize;

//Cargamos los modelos
const models = require('../models')(sequelize);

/**
 * Validate the create license form
 *
 * @param {object} payload - the HTTP body message
 * @returns {object} The result of validation. Object contains a boolean validation result
 *                   and a global message for the whole form.
 */
function validateCreateLicenseForm(payload) {
  let isFormValid = true;
  let message = '';

  if (!payload || typeof payload.expires_at !== 'string' || payload.expires_at.trim().length === 0) {
    isFormValid = false;
    message = 'Please provide the expires date ';
  }

  if (!payload || typeof payload.limit_bytes !== 'string' || payload.limit_bytes.trim().length === 0) {
    isFormValid = false;
    message = message != "" ? message + 'and please provide a limit bytes correct ' : "Please provide a limit bytes correct ";

  }
  if (!payload || typeof payload.sensors !== 'string') {
    isFormValid = false;
    message = message != "" ? message + 'and please provide sensors ' : "Please provide sensors ";

  }
  else{
      const sensors_object = JSON.parse(payload.sensors);
      for(const sensor in sensors_object){
          if(sensors_object[sensor].length == 0){
            isFormValid = false
            message = message != "" ? message + 'and please provide a number of sensor ' + sensor + " " : 'Please provide a number of sensor ' + sensor
          }
        }
  }

  return {
    success: isFormValid,
    message
  };
}

/**
 * Validate the create user form
 *
 * @param {object} payload - the HTTP body message
 * @returns {object} The result of validation. Object contains a boolean validation result
 *                   and a global message for the whole form.
 */
function validateCreateOrgForm(payload) {
  let isFormValid = true;
  let message = '';
  if (!payload || typeof payload.name !== 'string' || payload.name.trim().length === 0) {
    isFormValid = false;
    message = 'Please provide the organization name ';
  }

  if (!payload || typeof payload.email !== 'string' || payload.email.trim().length === 0) {
    isFormValid = false;
    message = message != "" ? message + 'and please provide a organization email address ' : "Please provide a organization email address ";

  }

  if (!payload || typeof payload.cluster_id !== 'string' || payload.cluster_id.trim().length === 0) {
    isFormValid = false;
    message = message != "" ? message + 'and please provide a cluster id ' : "Please provide a cluster id ";

  }

  return {
    success: isFormValid,
    message
  };
}


/**
 * Validate the create user form
 *
 * @param {object} payload - the HTTP body message
 * @returns {object} The result of validation. Object contains a boolean validation result
 *                   and a global message for the whole form.
 */
function validateCreateUserForm(payload) {
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

  if (!(payload.confir_password.trim()===payload.password.trim())){
    isFormValid = false;
    message = message != "" ? message + 'and new passwords must be the same ' : 'New passwords must be the same ';
  }

  if ((typeof payload.password !== 'string' || payload.password.trim().length < 8) ||
   (typeof payload.confir_password !== 'string' || payload.confir_password.trim().length < 8)) {
    isFormValid = false;
    message = message != "" ? message + 'and new password should be between 8 and 15 alphanumeric characters ' : 'New password should be between 8 and 15 alphanumeric characters ';
  }

  return {
    success: isFormValid,
    message
  };
}

/**
 * Validate the change profile form
 *
 * @param {object} payload - the HTTP body message
 * @returns {object} The result of validation. Object contains a boolean validation result
 *                   and a global message for the whole form.
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
        return res.status(401).json({
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

router.post('/users', (req, res, next) => {
  const validationResult = validateCreateUserForm(req.body);
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
      if(user.role != "admin"){
        return res.status(401).json({
            success: false,
            message: "You don't have permissions",
          });
      }
      else
      {
        return passport.authenticate('local-signup', (err) => {
          if(err){
            if (err.message=="Validation error") {
                return res.status(409).json({
                  success: false,
                  message: "This email is already registered"
                });
              }
            else {
                  return res.status(409).json({
                  success: false,
                  message: err.message
                });
              }
          }
            const smtpTransport = nodemailer.createTransport({
              service: process.env.EMAIL_SERVER || email.server,
              auth: {
                user: process.env.EMAIL_USER || email.email,
                pass: process.env.EMAIL_PASSWORD || email.password
              }
            });
            const mailOptions = {
              to: req.body.email.toLowerCase(),
              from: 'userCreate@demo.com',
              subject: 'Your email has been registered in RedBorder licenses',
              text: 'Hello,\n\n' +
                'You have been registered RedBorder. Your email is ' + req.body.email.toLowerCase() + ' and your password ' + req.body.password + '.\n'
                 + "Please, log in and change your password"
            };
            smtpTransport.sendMail(mailOptions,function(err) {
              res.status(200).json({
              success: true,
              message: 'User registered successfully. A email has been send to ' + req.body.email.trim() + ' with the password'
              });
            });

        })(req, res, next);
      }
    })
});

router.get('/users', (req, res) => {
  models.User.findOne({
        where: {
            id: req.userId
        }
    }).then(function(user){
      if(user.role != "admin"){
        return res.status(401).json({
            success: false,
            message: "You don't have permissions",
          });
      }
      else
      {
          models.User.findAndCount({
            limit: 10,
            offset: 10*(req.query.page-1),
            order: 'name'
        }).then(function(result){
              return res.status(200).json({
                success: true,
                users: result.rows,
                number_users: result.count
              })
          })
      }
    })
  });

router.delete('/users/:id', (req, res) => {
  models.User.findOne({
        where: {
            id: req.userId
        }
    }).then(function(user){
      if(user.role != "admin"){
        return res.status(401).json({
            success: false,
            message: "You don't have permissions",
          });
      }
      else
      {
          models.User.findOne({
            where: {
              id: req.params.id
            }
          }).then(function(user_delete){
            if(!user_delete)
              return res.status(400).json({
                success: false,
                message: "User doesn't exists"
              })
            const name = user_delete.name;
            const email = user_delete.email;
            models.User.destroy({
            where: {id: req.params.id} 
           }).then(function(affectedRows){
            if(affectedRows==1)
              return res.status(200).json({
              success: true,
              message: "User " + name + " (" + email + ") delete correctly"
            })
            else
              return res.status(400).json({
              success: false,
              message: "Error removing user " + name 
            })
          })
        })
      }
    })
  });


router.put('/users/:id', (req, res) => {
  models.User.findOne({
        where: {
            id: req.userId
        }
    }).then(function(user){
      if(user.role != "admin"){ 
        return res.status(401).json({
            success: false,
            message: "You don't have permissions",
          });
      }
      else
      {
          models.User.findOne({
            where: {
              id: req.params.id
            }
          }).then(function(user_edit){
            if(!user_edit)
              return res.status(400).json({
                success: false,
                message: "User doesn't exists"
              })
            user_edit.name=req.body.name;
            user_edit.email=req.body.email;
            user_edit.role=req.body.role;
            user_edit.OrganizationId= (req.body.organization == "No" || req.body.organization == "" ) ? null: req.body.organization;
            user_edit.save()
            .then(function(user_save){
              return res.status(200).json({
              success: true,
              message: "User " + user_save.name + " edited correctly",
              user: user_save
              }) 
            }).catch(function (err) {
              return res.status(400).json({
              success: false,
              message: "Error editing user " + user_edit.name + '. Email already exists.'
              })
            });
          })
      }
    })
  });

router.post('/organizations', (req, res) => {
  const validationResult = validateCreateOrgForm(req.body);
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
      if(user.role != "admin"){
        return res.status(401).json({
            success: false,
            message: "You don't have permissions",
          });
      }
      else
      {
          const NewOrganization = models.Organization.build({
            cluster_id: req.body.cluster_id.trim(),
            name: req.body.name.trim(),
            email: req.body.email.trim()
          });
          NewOrganization.save().then(function(NewOrganization) {
            return res.status(200).json({
              success: true,
              message: 'Organization ' + NewOrganization.name + ' created correctly'
            });
          }, function(err){ 
            return res.status(400).json({
              success: false,
              message: 'Error saving organization ' + req.body.name + '. Email already exists.'
            });
        });
      }
    })
});

router.get('/organizations', (req, res) => {
  models.User.findOne({
        where: {
            id: req.userId
        }
    }).then(function(user){
      if(user.role != "admin"){
        return res.status(401).json({
            success: false,
            message: "You don't have permissions",
          });
      }
      else
      {
          models.Organization.findAll({
          include: [{
            "model": models.User
          }],
          limit: 10,
          offset: 10*(req.query.page-1),
          order: 'name'
        }).then(function(orgs){
          models.Organization.count({}).then(function(number_orgs){
            return res.status(200).json({
              success: true,
              orgs: orgs,
              number_orgs: number_orgs
            })
          });
        })
      }
    })
  });


router.delete('/organizations/:id', (req, res) => {
  models.User.findOne({
        where: {
            id: req.userId
        }
    }).then(function(user){
      if(user.role != "admin"){
        return res.status(401).json({
            success: false,
            message: "You don't have permissions",
          });
      }
      else
      {
          models.Organization.findOne({
            where: {
              id: req.params.id
            }
          }).then(function(org_delete){
            if(!org_delete)
              return res.status(400).json({
                success: false,
                message: "Organization doesn't exists"
              })
            const name = org_delete.name;
            const email = org_delete.email;
            models.Organization.destroy({
            where: {id: req.params.id} 
           }).then(function(affectedRows){
            if(affectedRows==1)
              return res.status(200).json({
              success: true,
              message: "Organization " + name + " (" + email + ") delete correctly"
            })
            else
              return res.status(400).json({
              success: false,
              message: "Error removing organization " + name 
            })
          })
        })
      }
    })
  });

router.put('/organizations/:id', (req, res) => {
  models.User.findOne({
        where: {
            id: req.userId
        }
    }).then(function(user){
      if(user.role != "admin"){
        return res.status(401).json({
            success: false,
            message: "You don't have permissions",
          });
      }
      else
      {
          models.Organization.findOne({
            where: {
              id: req.params.id
            }
          }).then(function(org_edit){
            if(!org_edit)
              return res.status(400).json({
                success: false,
                message: "Organization doesn't exists"
              })
            org_edit.name=req.body.name;
            org_edit.email=req.body.email;
            org_edit.cluster_id=req.body.cluster_id;
            org_edit.save()
            .then(function(org_save){
              return res.status(200).json({
              success: true,
              message: "Organization " + org_save.name + " edited correctly",
              org: org_save
              }) 
            }).catch(function (err) {
              const message = err.message=="Validation error" ? "Email already exists." : err.message; 
              return res.status(400).json({
              success: false,
              message: "Error editing organization " + org_edit.name + '. ' + message
              })
            });
          })
      }
    })
  });

//Metodo get al que se llama al crear un usuario. Devuelve la lista de organizaciones disponibles
router.get('/users/new', (req, res) => {
  models.User.findOne({
        where: {
            id: req.userId
        }
    }).then(function(user){
      if(user.role != "admin"){
        return res.status(401).json({
            success: false,
            message: "You don't have permissions",
          });
      }
      else
      {
          models.Organization.findAll({
          order: 'name'
        }).then(function(list_orgs){
          return res.status(200).json({
            success: true,
            orgs: list_orgs,
          })
        })
      }
    })
  });

//Metodo get al que se llama al editar un usuario. Devuelve dicho usuario
router.get('/users/:id/edit', (req, res) => {
  models.User.findOne({
        where: {
            id: req.userId
        }
    }).then(function(user){
      if(user.role != "admin"){
        return res.status(401).json({
            success: false,
            message: "You don't have permissions",
          });
      }
      else
      {
          models.Organization.findAll({
          order: 'name'
        }).then(function(list_orgs){
           models.User.findOne({
            where: {
                id: req.params.id
            }
          }).then(function(user_edit){
          return res.status(200).json({
            success: true,
            orgs: list_orgs,
            user: user_edit
          })
        })
      })
      }  
    })
  });

  //Metodo get al que se llama al editar un usuario. Devuelve dicho usuario
router.get('/organizations/:id/edit', (req, res) => {
  models.User.findOne({
        where: {
            id: req.userId
        }
    }).then(function(user){
      if(user.role != "admin"){
        return res.status(401).json({
            success: false,
            message: "You don't have permissions",
          });
      }
      else
      {
        models.Organization.findOne({
          where: {
            id: req.params.id
          }
        }).then(function(org){
          return res.status(200).json({
            success: true,
            org: org
          })
        })
      }  
    })
  });

router.get('/organizations/:id/users', (req, res) => {
 models.User.findOne({
        where: {
            id: req.userId
        }
    }).then(function(user){
      if(user.role != "admin"){
        return res.status(401).json({
            success: false,
            message: "You don't have permissions",
          });
      }
      else
      {
          models.User.findAndCount({
            where : {
              OrganizationId: req.params.id=="null" ? null : req.params.id
            },
            limit: 10,
            offset: 10*(req.query.page-1),
            order: 'name'
        }).then(function(result){
              return res.status(200).json({
                success: true,
                users: result.rows,
                number_users: result.count
              })
          })
      }
    })
  });

  //Devuelve las licencias que pertenecen a una organización.
  //Solo pueden acceder a él usuarios administradores y que pertenezcan a la organización que mostrará las licencias
  router.get('/organizations/:id/licenses', (req, res) => {
  models.User.findOne({
        where: {
            id: req.userId
        }
    }).then(function(user){
      if(user.role != "admin" && user.OrganizationId != req.params.id ){
        return res.status(401).json({
            success: false,
            message: "You don't have permissions",
          });
      }
      else
      {
          models.License.findAndCount({
            where : {
              OrganizationId: req.params.id
            },
            limit: 10,
            offset: 10*(req.query.page-1),
            order: 'expires_at'
        }).then(function(result){
              return res.status(200).json({
                success: true,
                licenses: result.rows,
                number_licenses: result.count
              })
          })
      }
    })
  });

router.post('/license', (req, res) => {
  console.log("Creando licencia...");
  const validationResult = validateCreateLicenseForm(req.body);
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
      //Si la licencia que se quiere crear no es para la organización a la que pertenecemos... no podemos
      if(user.OrganizationId != req.body.OrganizationId && user.role != "admin"){
        return res.status(401).json({
            success: false,
            message: "You don't have permissions",
          });
      }
      else
      {
          const NewLicense = models.License.build({
            expires_at: req.body.expires_at.trim(),
            limit_bytes: req.body.limit_bytes.trim(),
            OrganizationId: req.body.OrganizationId.trim(),
            UserId: user.id,
            sensors: req.body.sensors 
          });
          NewLicense.save().then(function(NewLicense) {
            return res.status(200).json({
              success: true,
              message: 'License created correctly'
            });
          }, function(err){ 
            console.log(err);
            return res.status(400).json({
              success: false,
              message: 'Error creating license.<br></br> The sensors and limit bytes must be numbers'
            });
        });
      }
    })
  });
module.exports = router;