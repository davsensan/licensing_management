const jwt = require('jsonwebtoken');
const config_json = require('../../config/config.json');

const MODE_RUN = process.env.MODE_RUN || "development"
const config = config_json[MODE_RUN]

//Incializamos sequelize
const sequelize = require('../db').sequelize;

//Cargamos los modelos
const models = require('../models')(sequelize);

/**
 *  The Auth Checker middleware function.
 */
module.exports = (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(404).end(); //Por seguridad enviamos el 404 para que el usuario no sepa que existe tal página
  }
  // get the last part from a authorization header string like "bearer token-value"
  const token = req.headers.authorization.split(' ')[1];

  // decode the token using a secret key-phrase
  return jwt.verify(token, config.jwtSecret, (err, decoded) => {
    // the 401 code is for unauthorized status
    if (err) { return res.status(401).end(); }

    const userId = decoded.sub;
    req.userId = userId;
    // check if a user exists
    return models.User.findOne({where: {id: userId}})
    .then(function(User){
      if(!User) //Si el usuario no existe, no estará permitido su acceso y pensará que no existe la página
        return res.status(404).end();
      else
        return next();
      }, function(err){
      return res.status(401).end();
      })
    });
}