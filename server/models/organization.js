const DataTypes = require('sequelize/lib/data-types');

module.exports = function(sequelize) {
  const Organization = sequelize.define('Organization',
      { 
        id:{
            type : DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
            validate: {
                isUUID: 4
            }            
        },
        cluster_id: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: { msg: "Field cluster id shouldn't be empty" }
            }
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: { msg: "Field name shouldn't be empty" }
            }
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false, 
            unique: true,
            validate: {
                isEmail: { msg: "Email should be a correct email" },
                notEmpty: {msg: "Field email shouldn't be empty'"},
            }
        },
        sensors: {
            type: DataTypes.STRING, //Lista de sensores separados por ;
            allowNull: false,
            validate: {
                notEmpty: {msg: "Field sensors shouldn't be empty'"},
            }
        }
        
    },
    //Expansion of the model user
    {
        setterMethods   : {
            email: function(email){
                this.setDataValue('email', email.toLowerCase());
            }
        }
    });
    return Organization;
}