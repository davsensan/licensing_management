const express = require('express');
const passport = require('passport');
const bodyParser = require('body-parser');
const app = express();

//Inicializamos sequelize
const sequelize = require('./db').sequelize;

//Cargamos los diferentes modelos
const models = require('./models')(sequelize);

//Sincronizamos los modelos a la base de datos
if (process.env.MODE_RUN == "test"){
	sequelize.sync({force:true});
}else{
	sequelize.sync()
	.then(() =>{
		//If there aren't users, create one admin user by default in production mode...
		models.User.findAll({where: {
			role: "admin"
		}})
		.then(function (users){
			if(users.length == 0){
				const NewUser = models.User.build({
				  name: "Admin",
				  email: "admin@redborder.com", 
				  password: "adminadmin",
				  role: "admin"
				})
		  	NewUser.save().then(function() {
		  		console.log("New default admin user created.");
		  		console.log("	Email: admin@redborder.com");
		  		console.log("	Password: adminadmin");
		  		console.log("Please, change this user profile");
		  	});
		  }
		})
	})
}


// tell the app to look for static files in these directories
app.use(express.static('./server/static/'));
app.use(express.static('./client/dist/'));
// tell the app to parse HTTP body messages
app.use(bodyParser.urlencoded({ extended: false }));	
// pass the passport middleware
app.use(passport.initialize());
// load passport strategies
const localSignupStrategy = require('./passport/local-signup');
const localLoginStrategy = require('./passport/local-login');
passport.use('local-signup', localSignupStrategy);
passport.use('local-login', localLoginStrategy);
// pass the authenticaion checker middleware
const authCheckMiddleware = require('./middleware/auth-check');
app.use('/api', authCheckMiddleware);
// routes
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);
// start the server
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000 or http://127.0.0.1:3000');
	});

module.exports = app;