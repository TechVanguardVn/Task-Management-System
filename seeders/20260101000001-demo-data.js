 'use strict';
const bcrypt = require('bcryptjs');
module.exports = {
  async up(queryInterface) {
    const hash = await bcrypt.hash('123456', 10);
    await queryInterface.bulkInsert('Users', [{ id: 1, fullName: 'Intern Demo User', email: 'intern@example.com', password: hash, createdAt: new Date(), updatedAt: new Date() }]);
    const tomorrow = new Date(Date.now() + 86400000);
    const nextWeek = new Date(Date.now() + 7 * 86400000);
    await queryInterface.bulkInsert('Tasks', [
      { userId: 1, title: 'Thiet ke Database & Migration', description: 'Tao bang Users va Tasks', status: 'DONE', priority: 'HIGH', dueDate: new Date(), createdAt: new Date(), updatedAt: new Date() },
      { userId: 1, title: 'Xay dung API Authentication', description: 'Dang ky, dang nhap JWT', status: 'IN_PROGRESS', priority: 'HIGH', dueDate: tomorrow, createdAt: new Date(), updatedAt: new Date() },
      { userId: 1, title: 'Hoan thien Swagger & README', description: 'Viet huong dan chay du an', status: 'TODO', priority: 'MEDIUM', dueDate: tomorrow, createdAt: new Date(), updatedAt: new Date() },
      { userId: 1, title: 'Quay video demo 3-5 phut', description: 'Demo cac chuc nang chinh', status: 'TODO', priority: 'LOW', dueDate: nextWeek, createdAt: new Date(), updatedAt: new Date() }
    ]);
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('Tasks', null, {});
    await queryInterface.bulkDelete('Users', null, {});
  }
};