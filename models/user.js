'use strict';
const Sequelize = require('sequelize');

module.exports = (sequelize) => {
    class User extends Sequelize.Model{}
    User.init({
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        firstName: {
            type: Sequelize.STRING,
            validate: {
                notEmpty: {
                    msg: '"firstName" is required'
                }
            }
        },
        lastName: {
            type: Sequelize.STRING,
            validate: {
                notEmpty: {
                    msg: '"lastName" is required'
                }
            }
        },
        emailAddress: {
            type: Sequelize.STRING,
            validate: {
                isEmail: true,
                notEmpty: {
                    msg: '"emailAddress" is required'
                }
            }
        },
        password: {
            type: Sequelize.STRING,
            validate: {
                notEmpty: {
                    msg: '"password" is required'
                }
            }
        }
    }, { sequelize });

    User.associate = (models) => {
        User.hasMany(models.Course, {
            as: 'user', //alias
            foreignKey: {
                fieldName: 'userId',
                allowNull: false
            }
        });
    };

    return User;
}