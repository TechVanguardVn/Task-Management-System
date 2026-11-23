 'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) { User.hasMany(models.Task, { foreignKey: 'userId', as: 'tasks' }); }
  }
  User.init({ fullName: DataTypes.STRING, email: { type: DataTypes.STRING, unique: true }, password: DataTypes.STRING }, { sequelize, modelName: 'User' });
  return User;
};