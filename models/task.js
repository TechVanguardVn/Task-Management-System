 'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Task extends Model {
    static associate(models) { Task.belongsTo(models.User, { foreignKey: 'userId', as: 'user' }); }
  }
  Task.init({
    userId: DataTypes.INTEGER, title: DataTypes.STRING,  description: DataTypes.TEXT,
    status: { type: DataTypes.STRING,  defaultValue: 'TODO' },
    priority: { type: DataTypes.STRING,  defaultValue: 'MEDIUM'},
    dueDate: DataTypes.DATE
  }, { sequelize, modelName: 'Task' });
  return Task;
};