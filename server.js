require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const { User, Task } = require('./models');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key';

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: { title: 'Task Management API', version: '1.0.0', description: 'API quan ly cong viec ca nhan (Intern Mini Project)' },
    servers: [{ url: 'http://localhost:3000' }],
    components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./server.js']
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const auth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: 'Chua dang nhap (Thieu token)' });
  try {
    const token = header.split(' ')[1];
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Token khong hop le hoac da het han' });
  }
};

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Dang ky tai khoan moi
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, email, password]
 *             properties:
 *               fullName: { type: string, example: Nguyen Van A }
 *               email: { type: string, example: user@example.com }
 *               password: { type: string, example: '123456' }
 *     responses:
 *       201: { description: Dang ky thanh cong }
 */
app.post('/api/auth/register', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) return res.status(400).json({ message: 'Vui long nhap du thong tin' });
    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(400).json({ message: 'Email da ton tai' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ fullName, email, password: hashedPassword });
    res.status(201).json({ message: 'Dang ky thanh cong', user: { id: user.id, fullName: user.fullName, email: user.email } });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Dang nhap lay JWT token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: intern@example.com }
 *               password: { type: string, example: '123456' }
 *     responses:
 *       200: { description: Tra ve accessToken }
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Sai email hoac mat khau' });
    }
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ message: 'Dang nhap thanh cong', accessToken: token, user: { id: user.id, fullName: user.fullName, email: user.email } });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Dang xuat
 *     tags: [Auth]
 *     responses:
 *       200: { description: Dang xuat thanh cong }
 */
app.post('/api/auth/logout', auth, (req, res) => {
  res.json({ message: 'Dang xuat thanh cong (Vui long xoa token o phia client)' });
});

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Thong ke Dashboard & cong viec sap den han
 *     tags: [Dashboard]
 *     responses:
 *       200: { description: Du lieu thong ke }
 */
app.get('/api/dashboard', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const [total, todo, inProgress, done] = await Promise.all([
      Task.count({ where: { userId } }),
      Task.count({ where: { userId, status: 'TODO' } }),
      Task.count({ where: { userId, status: 'IN_PROGRESS' } }),
      Task.count({ where: { userId, status: 'DONE' } })
    ]);
    const threeDaysLater = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const upcomingTasks = await Task.findAll({
      where: { userId, status: { [Op.ne]: 'DONE' }, dueDate: { [Op.between]: [new Date(), threeDaysLater] } },
      order: [['dueDate', 'ASC']]
    });
    res.json({ summary: { total, todo, inProgress, done }, upcomingTasks });
  } catch (err) { res.status(500).json({ message: err.message }); }
});
/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Lay danh sach task (tim kiem, loc, phan trang)
 *     tags: [Tasks]
 *     parameters:
 *       - in
 query
 *         name: search
 *         schema: { type: string }
 *       - in
 query
 *         name: status
 *         schema: { type: string, enum: [TODO, IN_PROGRESS, DONE] }
 *       - in
 query
 *         name: priority
 *         schema: { type: string, enum: [LOW, MEDIUM, HIGH] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200: { description: Danh sach cong viec }
 */
app.get('/api/tasks', auth, async (req, res) => {
  try {
    const { search, status, priority, page = 1, limit = 10 } = req.query;
    const where = { userId: req.user.id };
    if (search) where.title = { [Op.like]: `%%\${search}\%` };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    const offset = (Number(page) - 1) * Number(limit);
    const { count, rows } = await Task.findAndCountAll({ where, limit: Number(limit), offset, order: [['createdAt', 'DESC']] });
    res.json({ data: rows, pagination: { totalItems: count, currentPage: Number(page), totalPages: Math.ceil(count / Number(limit)) } });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Tao cong viec moi
 *     tags: [Tasks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string, example: Nop bai test Intern }
 *               description: { type: string, example: Tao PR vao repo goc }
 *               status: { type: string, enum: [TODO, IN_PROGRESS, DONE], default: TODO }
 *               priority: { type: string, enum: [LOW, MEDIUM, HIGH], default: MEDIUM }
 *               dueDate: { type: string, format: date-time }
 *     responses:
 *       201: { description: Tao thanh cong }
 */
app.post('/api/tasks', auth, async (req, res) => {
  try {
    const { title, description, status, priority, dueDate } = req.body;
    if (!title) return res.status(400).json({ message: 'Tieu de cong viec la bat buoc' });
    const task = await Task.create({ userId: req.user.id, title, description, status, priority, dueDate });
    res.status(201).json(task);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     summary: Cap nhat cong viec
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               status: { type: string, enum: [TODO, IN_PROGRESS, DONE] }
 *               priority: { type: string, enum: [LOW, MEDIUM, HIGH] }
 *               dueDate: { type: string, format: date-time }
 *     responses:
 *       200: { description: Cap nhat thanh cong }
 */
app.put('/api/tasks/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!task) return res.status(404).json({ message: 'Khong tim thay cong viec' });
    await task.update(req.body);
    res.json(task);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Xoa cong viec
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Da xoa }
 */
app.delete('/api/tasks::id', auth, async (req, res) => {
  try {
    const task = await Task.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!task) return res.status(404).json({ message: 'Khong tim thay cong viec' });
    await task.destroy();
    res.json({ message: 'Xoa cong viec thanh cong' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server dang chay tai http://localhost:\${PORT}/api-docs`));
