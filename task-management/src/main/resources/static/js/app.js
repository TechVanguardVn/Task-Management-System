import { api, auth } from './api.js';

// ============================================================================
// Hằng số
// ============================================================================

const STATUSES = [
  { value: 'TODO', label: 'Cần làm' },
  { value: 'IN_PROGRESS', label: 'Đang làm' },
  { value: 'DONE', label: 'Hoàn thành' },
];
const STATUS_LABEL = Object.fromEntries(STATUSES.map((s) => [s.value, s.label]));
const PRIORITY_LABEL = { HIGH: 'Cao', MEDIUM: 'Trung bình', LOW: 'Thấp' };
const BOARD_PAGE_SIZE = 100; // backend giới hạn tối đa 100 task / trang
const SEARCH_DEBOUNCE_MS = 300;

const ICON_PATHS = {
  calendar: 'M8 3v3M16 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z',
  plus: 'M12 5v14M5 12h14',
};

// ============================================================================
// State
// ============================================================================

const state = {
  page: 'dashboard', // 'dashboard' | 'tasks'
  view: 'board', // 'board' | 'list'
  filters: { search: '', status: '', priority: '' },
  list: { page: 0, size: 10, sort: 'createdAt,desc' },
  upcomingDays: 7,
  editingTask: null, // task đang mở trong dialog (null = tạo mới)
  tasksById: new Map(),
  ai: { loaded: false, enabled: false }, // server có bật tính năng AI không
};

// Đánh số lần mở dialog để bỏ qua kết quả AI trả về sau khi dialog đã đóng / mở lại
let dialogSession = 0;

// Đánh số request để bỏ qua kết quả cũ trả về sau kết quả mới (khi gõ tìm kiếm nhanh)
let boardRequestSeq = 0;
let listRequestSeq = 0;

// ============================================================================
// Tiện ích DOM
// ============================================================================

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

/** Tạo element. Children là string sẽ thành text node (an toàn, không parse HTML). */
function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null || value === false) continue;
    if (key === 'class') el.className = value;
    else if (key === 'dataset') Object.assign(el.dataset, value);
    else if (key.startsWith('on')) el.addEventListener(key.slice(2), value);
    else el.setAttribute(key, value === true ? '' : value);
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return el;
}

function icon(name) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', ICON_PATHS[name]);
  svg.append(path);
  return svg;
}

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

let toastTimer;
function toast(message, type = 'info') {
  const el = $('#toast');
  el.textContent = message;
  el.className = `toast${type === 'error' ? ' error' : ''}`;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 3200);
}

/** Hiện lỗi chung; bỏ qua 401 vì đã được xử lý bằng sự kiện auth:expired. */
function reportError(err) {
  if (err.status !== 401) toast(err.message, 'error');
}

// ============================================================================
// Ngày tháng
// ============================================================================

/** "2026-11-24" → Date theo giờ máy (không dùng new Date(iso) vì sẽ hiểu là UTC). */
function parseLocalDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function formatDate(iso) {
  return parseLocalDate(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** "2026-12-02" → "02/12/2026" (để hiện trong ô nhập). */
function isoToVn(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/**
 * "2/12/2026", "02-12-2026", "02.12.2026" → "2026-12-02".
 * Trả về null nếu sai định dạng hoặc ngày không tồn tại (vd 31/02/2026).
 */
function vnToIso(text) {
  const match = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(text.trim());
  if (!match) return null;
  const [d, m, y] = match.slice(1).map(Number);
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function dueInfo(task) {
  if (!task.dueDate) return null;
  const date = formatDate(task.dueDate);
  if (task.status === 'DONE') return { text: date, cls: '' };
  const days = Math.round((parseLocalDate(task.dueDate) - startOfToday()) / 86_400_000);
  if (days < 0) return { text: `Quá hạn ${-days} ngày`, cls: 'overdue', title: date };
  if (days === 0) return { text: 'Hôm nay', cls: 'soon', title: date };
  if (days === 1) return { text: 'Ngày mai', cls: 'soon', title: date };
  if (days <= 3) return { text: `Còn ${days} ngày`, cls: 'soon', title: date };
  return { text: date, cls: '' };
}

// ============================================================================
// Thành phần giao diện nhỏ
// ============================================================================

function statusBadge(status) {
  return h('span', { class: `badge status-${status}` }, h('span', { class: `dot ${status}` }), STATUS_LABEL[status]);
}

function priorityBadge(priority) {
  return h('span', { class: `badge priority-${priority}` }, PRIORITY_LABEL[priority]);
}

function dueLabel(task) {
  const info = dueInfo(task);
  if (!info) return h('span', { class: 'due' }, 'Không có hạn');
  return h('span', { class: `due ${info.cls}`, title: info.title }, icon('calendar'), info.text);
}

/** Mở task khi click hoặc nhấn Enter (để dùng được bằng bàn phím). */
function openOnActivate(task) {
  return {
    onclick: () => openTaskDialog(task),
    onkeydown: (e) => { if (e.key === 'Enter') openTaskDialog(task); },
  };
}

// ============================================================================
// Form: hiển thị lỗi, trạng thái đang gửi
// ============================================================================

function formValues(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function clearFormErrors(form) {
  $$('.field-error', form).forEach((el) => { el.textContent = ''; });
  $$('.field.invalid', form).forEach((el) => el.classList.remove('invalid'));
  const general = $('.form-error', form);
  general.textContent = '';
  general.hidden = true;
}

function showFormError(form, message) {
  const general = $('.form-error', form);
  general.textContent = message;
  general.hidden = false;
}

/** Hiện lỗi theo từng field (key trùng với "name" của input). Trả về true nếu hiện được hết. */
function showFieldErrors(form, errors) {
  let allShown = true;
  for (const [name, message] of Object.entries(errors)) {
    const slot = $(`[data-error-for="${CSS.escape(name)}"]`, form);
    if (slot) {
      slot.textContent = message;
      slot.closest('.field')?.classList.add('invalid');
    } else {
      allShown = false;
    }
  }
  return allShown;
}

function showApiErrorInForm(form, err) {
  if (err.fieldErrors && showFieldErrors(form, err.fieldErrors)) return;
  showFormError(form, err.message);
}

/** Khóa nút submit trong lúc chờ server để tránh bấm 2 lần. */
async function withBusy(form, fn) {
  const buttons = $$('button[type="submit"]', form);
  buttons.forEach((b) => { b.disabled = true; });
  try {
    await fn();
  } finally {
    buttons.forEach((b) => { b.disabled = false; });
  }
}

// ============================================================================
// Đăng nhập / Đăng ký / Đăng xuất
// ============================================================================

function showAuthView() {
  closeTaskDialog();
  $('#app-view').hidden = true;
  $('#auth-view').hidden = false;
}

function showAppView() {
  $('#auth-view').hidden = true;
  $('#app-view').hidden = false;
  const { email, fullName } = auth.user;
  const displayName = fullName || email;
  $('#user-email').textContent = displayName;
  $('#user-email').title = email;
  $('#user-avatar').textContent = (displayName[0] || '?').toUpperCase();
  $('#dashboard-greeting').textContent = displayName ? `Xin chào, ${displayName}` : 'Tổng quan công việc của bạn';
}

function switchAuthTab(tab) {
  $$('[data-auth-tab]').forEach((b) => {
    const active = b.dataset.authTab === tab;
    b.classList.toggle('active', active);
    b.setAttribute('aria-selected', String(active));
  });
  $('#login-form').hidden = tab !== 'login';
  $('#register-form').hidden = tab !== 'register';
  clearFormErrors($('#login-form'));
  clearFormErrors($('#register-form'));
}

async function login(email, password) {
  const authResponse = await api('/api/auth/login', {
    method: 'POST',
    body: { email, password },
    requireAuth: false,
  });
  auth.save(authResponse);
}

async function handleLogin(event) {
  event.preventDefault();
  const form = event.currentTarget;
  clearFormErrors(form);
  const { email = '', password = '' } = formValues(form);
  if (!email.trim() || !password) {
    showFormError(form, 'Vui lòng nhập email và mật khẩu');
    return;
  }
  await withBusy(form, async () => {
    try {
      await login(email.trim(), password);
      form.reset();
      route();
    } catch (err) {
      showFormError(form, err.status === 401 ? 'Email hoặc mật khẩu không đúng' : err.message);
    }
  });
}

async function handleRegister(event) {
  event.preventDefault();
  const form = event.currentTarget;
  clearFormErrors(form);
  const { fullName = '', email = '', password = '' } = formValues(form);
  await withBusy(form, async () => {
    try {
      await api('/api/auth/register', {
        method: 'POST',
        body: { fullName: fullName.trim(), email: email.trim(), password },
        requireAuth: false,
      });
      // Đăng ký xong thì đăng nhập luôn
      await login(email.trim(), password);
      form.reset();
      toast('Tạo tài khoản thành công');
      route();
    } catch (err) {
      if (err.status === 409) showFieldErrors(form, { email: err.message });
      else showApiErrorInForm(form, err);
    }
  });
}

async function logout() {
  try {
    await api('/api/auth/logout', { method: 'POST' });
  } catch {
    // Token đã hết hạn / không hợp lệ thì coi như đã đăng xuất
  }
  auth.clear();
  state.ai = { loaded: false, enabled: false };
  showAuthView();
  toast('Đã đăng xuất');
}

/**
 * Hỏi server sau khi đăng nhập: có bật AI không (chưa cấu hình key thì ẩn mọi nút AI).
 * Chỉ ghi nhớ khi hỏi THÀNH CÔNG. Lỗi (server đang khởi động lại, token cũ bị 401...) thì
 * lần sau hỏi lại, tránh ẩn AI vĩnh viễn cho tới khi đăng xuất.
 */
async function loadAiStatus() {
  if (state.ai.loaded) return;
  try {
    const status = await api('/api/ai/status');
    state.ai = { loaded: true, enabled: Boolean(status.enabled) };
  } catch {
    state.ai = { loaded: false, enabled: false };
  }
}

/** Hiện / ẩn ô AI trong dialog: chỉ khi server bật AI và đang TẠO task mới. */
function updateAiBox() {
  const showAi = state.ai.enabled && !state.editingTask && dialog.open;
  $('#ai-box').hidden = !showAi;
  return showAi;
}

// ============================================================================
// Điều hướng
// ============================================================================

function route() {
  if (!auth.token) {
    showAuthView();
    return;
  }
  showAppView();
  state.page = window.location.hash === '#/tasks' ? 'tasks' : 'dashboard';
  $$('[data-nav]').forEach((a) => a.classList.toggle('active', a.dataset.nav === state.page));
  $('#dashboard-view').hidden = state.page !== 'dashboard';
  $('#tasks-view').hidden = state.page !== 'tasks';
  loadAiStatus();
  refresh();
}

function refresh() {
  return state.page === 'dashboard' ? loadDashboard() : loadTasks();
}

// ============================================================================
// Dashboard
// ============================================================================

async function loadDashboard() {
  try {
    const stats = await api('/api/dashboard', { query: { days: state.upcomingDays } });
    renderStats(stats);
    renderUpcoming(stats.upcomingTasks, stats.upcomingDays);
  } catch (err) {
    reportError(err);
  }
}

function renderStats(s) {
  const percentDone = s.totalTasks ? Math.round((s.doneTasks * 100) / s.totalTasks) : 0;
  const card = (cls, dot, label, value, extra = null) => h('div', { class: `stat ${cls}` },
    h('span', { class: 'stat-label' }, dot ? h('span', { class: `dot ${dot}` }) : null, label),
    h('span', { class: 'stat-value' }, value),
    extra);

  $('#stats').replaceChildren(
    card('total', null, 'Tổng số task', s.totalTasks,
      h('div', {},
        h('div', { class: 'progress', title: `Hoàn thành ${percentDone}%` }, h('span', { style: `width:${percentDone}%` })),
        h('small', { class: 'muted' }, `${percentDone}% đã hoàn thành`))),
    card('', 'TODO', 'Chưa bắt đầu', s.todoTasks),
    card('', 'IN_PROGRESS', 'Đang thực hiện', s.inProgressTasks),
    card('', 'DONE', 'Đã hoàn thành', s.doneTasks),
    card('overdue', 'OVERDUE', 'Quá hạn', s.overdueTasks),
  );
}

function renderUpcoming(tasks, days) {
  const list = $('#upcoming-list');
  if (!tasks.length) {
    list.replaceChildren(h('li', { class: 'column-empty' }, `Không có task nào đến hạn trong ${days} ngày tới`));
    return;
  }
  tasks.forEach((t) => state.tasksById.set(t.id, t));
  list.replaceChildren(...tasks.map((task) => h('li', { class: 'upcoming-item', tabindex: 0, ...openOnActivate(task) },
    h('span', { class: 'upcoming-title' }, task.title),
    statusBadge(task.status),
    priorityBadge(task.priority),
    dueLabel(task))));
}

// ============================================================================
// Công việc: Board / List
// ============================================================================

function setView(view) {
  state.view = view;
  $$('[data-view]').forEach((b) => {
    const active = b.dataset.view === view;
    b.classList.toggle('active', active);
    b.setAttribute('aria-selected', String(active));
  });
  $('#board').hidden = view !== 'board';
  $('#list').hidden = view !== 'list';
  // Board đã chia cột theo trạng thái nên không cần lọc / sắp xếp theo kiểu List
  $$('.list-only').forEach((el) => { el.hidden = view !== 'list'; });
  loadTasks();
}

function loadTasks() {
  return state.view === 'board' ? loadBoard() : loadList();
}

// ---------- Kanban board ----------

async function loadBoard() {
  const seq = ++boardRequestSeq;
  const board = $('#board');
  if (!board.children.length) board.replaceChildren(h('p', { class: 'loading' }, 'Đang tải...'));
  try {
    const pages = await Promise.all(STATUSES.map((s) => api('/api/tasks', {
      query: {
        status: s.value,
        search: state.filters.search,
        priority: state.filters.priority,
        size: BOARD_PAGE_SIZE,
        sort: 'createdAt,desc',
      },
    })));
    if (seq !== boardRequestSeq) return; // đã có request mới hơn
    board.replaceChildren(...STATUSES.map((s, i) => renderColumn(s, pages[i])));
  } catch (err) {
    reportError(err);
  }
}

/** Trong cột: task có hạn gần nhất lên trước, task không có hạn xuống cuối. */
function sortByDueDate(tasks) {
  return [...tasks].sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate.localeCompare(b.dueDate);
  });
}

function renderColumn(status, page) {
  const tasks = sortByDueDate(page.content);
  tasks.forEach((t) => state.tasksById.set(t.id, t));

  const column = h('section', { class: 'column', dataset: { status: status.value }, 'aria-label': status.label },
    h('div', { class: 'column-head' },
      h('span', { class: `dot ${status.value}` }),
      status.label,
      h('span', { class: 'column-count' }, page.totalElements)),
    h('div', { class: 'column-body' },
      tasks.length ? tasks.map(renderCard) : h('div', { class: 'column-empty' }, 'Kéo thẻ vào đây')),
    page.totalElements > tasks.length
      ? h('small', { class: 'muted' }, `Đang hiện ${tasks.length}/${page.totalElements} task. Xem đủ ở tab List.`)
      : null,
    h('button', { type: 'button', class: 'add-task', onclick: () => openTaskDialog(null, status.value) },
      icon('plus'), 'Thêm task'));

  // Kéo thả (HTML5 Drag and Drop)
  column.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    column.classList.add('drag-over');
  });
  column.addEventListener('dragleave', (e) => {
    if (!column.contains(e.relatedTarget)) column.classList.remove('drag-over');
  });
  column.addEventListener('drop', (e) => {
    e.preventDefault();
    column.classList.remove('drag-over');
    const id = Number(e.dataTransfer.getData('text/plain'));
    if (id) moveTask(id, status.value);
  });
  return column;
}

function renderCard(task) {
  const card = h('article', {
    class: `card${task.status === 'DONE' ? ' done' : ''}`,
    draggable: 'true',
    tabindex: 0,
    dataset: { id: task.id },
    'aria-label': task.title,
    ...openOnActivate(task),
  },
  h('div', { class: 'card-top' }, dueLabel(task), priorityBadge(task.priority)),
  h('div', { class: 'card-title' }, task.title),
  task.description ? h('p', { class: 'card-desc' }, task.description) : null);

  card.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', String(task.id));
    e.dataTransfer.effectAllowed = 'move';
    card.classList.add('dragging');
  });
  card.addEventListener('dragend', () => card.classList.remove('dragging'));
  return card;
}

/** Body cho PUT: gửi đủ các field vì PUT thay thế toàn bộ task. */
function toRequestBody(task) {
  return {
    title: task.title,
    description: task.description || null,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate || null,
  };
}

async function moveTask(id, newStatus) {
  const task = state.tasksById.get(id);
  if (!task || task.status === newStatus) return;

  // Cập nhật giao diện ngay cho mượt, sau đó tải lại board theo dữ liệu thật từ server
  const card = $(`.card[data-id="${id}"]`);
  const targetBody = $(`.column[data-status="${newStatus}"] .column-body`);
  if (card && targetBody) {
    $('.column-empty', targetBody)?.remove();
    targetBody.prepend(card);
    card.classList.add('saving');
  }

  try {
    await api(`/api/tasks/${id}`, { method: 'PUT', body: toRequestBody({ ...task, status: newStatus }) });
    toast(`Đã chuyển "${task.title}" sang ${STATUS_LABEL[newStatus]}`);
  } catch (err) {
    reportError(err);
  } finally {
    if (state.page === 'tasks' && state.view === 'board') loadBoard();
  }
}

// ---------- List ----------

async function loadList() {
  const seq = ++listRequestSeq;
  const { search, status, priority } = state.filters;
  const { page, size, sort } = state.list;
  try {
    const data = await api('/api/tasks', { query: { search, status, priority, page, size, sort } });
    if (seq !== listRequestSeq) return;
    // Xóa task cuối cùng của trang cuối → lùi về trang trước
    if (!data.content.length && data.page > 0 && data.totalPages > 0) {
      state.list.page = data.totalPages - 1;
      loadList();
      return;
    }
    data.content.forEach((t) => state.tasksById.set(t.id, t));
    renderList(data);
  } catch (err) {
    reportError(err);
  }
}

function renderList(data) {
  const body = $('#list-body');
  if (!data.content.length) {
    body.replaceChildren(h('tr', { class: 'empty-row' }, h('td', { colspan: 4 }, 'Không có task nào phù hợp')));
  } else {
    body.replaceChildren(...data.content.map((task) => h('tr', { tabindex: 0, ...openOnActivate(task) },
      h('td', { class: 'title-cell' }, task.title),
      h('td', {}, statusBadge(task.status)),
      h('td', {}, priorityBadge(task.priority)),
      h('td', {}, dueLabel(task)))));
  }

  const from = data.totalElements ? data.page * data.size + 1 : 0;
  const to = data.page * data.size + data.content.length;
  $('#pagination').replaceChildren(
    h('span', {}, `${from}–${to} trên ${data.totalElements} task`),
    h('div', { class: 'pager' },
      h('button', {
        type: 'button', class: 'btn small', disabled: data.first,
        onclick: () => { state.list.page -= 1; loadList(); },
      }, '← Trước'),
      h('span', { class: 'muted' }, `Trang ${data.totalPages ? data.page + 1 : 0}/${data.totalPages}`),
      h('button', {
        type: 'button', class: 'btn small', disabled: data.last,
        onclick: () => { state.list.page += 1; loadList(); },
      }, 'Sau →')),
  );
}

// ============================================================================
// Dialog tạo / sửa / xóa task
// ============================================================================

const dialog = $('#task-dialog');
const taskForm = $('#task-form');

function openTaskDialog(task = null, presetStatus = 'TODO') {
  dialogSession += 1;
  state.editingTask = task;
  clearFormErrors(taskForm);
  $('#task-dialog-title').textContent = task ? 'Sửa task' : 'Thêm task';
  $('#task-delete').hidden = !task;

  const f = taskForm.elements;
  f.title.value = task?.title ?? '';
  f.description.value = task?.description ?? '';
  f.status.value = task?.status ?? presetStatus;
  f.priority.value = task?.priority ?? 'MEDIUM';
  f.dueDate.value = isoToVn(task?.dueDate);

  $('#ai-input').value = '';
  setAiError('');
  setAiBusy(false);

  dialog.showModal();
  // Ô "Mô tả nhanh bằng AI" chỉ dùng khi tạo task mới
  const showAi = updateAiBox();
  (showAi ? $('#ai-input') : f.title).focus();

  // Chưa biết server có bật AI không (lần hỏi trước bị lỗi) → hỏi lại rồi hiện ô AI nếu được
  if (!state.ai.loaded && !task) {
    const session = dialogSession;
    loadAiStatus().then(() => {
      if (session === dialogSession && updateAiBox() && !f.title.value) $('#ai-input').focus();
    });
  }
}

function closeTaskDialog() {
  dialogSession += 1;
  if (dialog.open) dialog.close();
  state.editingTask = null;
}

// ---------- Thêm nhanh bằng AI ----------

function setAiError(message) {
  const el = $('#ai-error');
  el.textContent = message;
  el.hidden = !message;
}

function setAiBusy(busy) {
  const button = $('#ai-fill');
  button.disabled = busy;
  button.textContent = busy ? 'Đang phân tích...' : 'Điền tự động';
  $('#ai-input').disabled = busy;
}

/** Gửi câu mô tả cho AI, điền gợi ý vào form. Người dùng vẫn phải bấm "Lưu" để tạo task. */
async function fillWithAi() {
  const text = $('#ai-input').value.trim();
  setAiError('');
  if (!text) {
    setAiError('Nhập một câu mô tả công việc, ví dụ: "Họp nhóm 9h sáng mai"');
    $('#ai-input').focus();
    return;
  }

  const session = dialogSession;
  setAiBusy(true);
  try {
    const suggestion = await api('/api/ai/parse-task', { method: 'POST', body: { text } });
    if (session !== dialogSession) return; // dialog đã đóng / mở task khác trong lúc chờ

    clearFormErrors(taskForm);
    const f = taskForm.elements;
    f.title.value = suggestion.title ?? '';
    f.description.value = suggestion.description ?? '';
    f.priority.value = suggestion.priority ?? 'MEDIUM';
    f.dueDate.value = isoToVn(suggestion.dueDate);
    const filled = [f.title, f.description, f.priority, f.dueDate];
    // Câu có nói tiến độ ("đang làm", "đã xong") thì đổi trạng thái; không nói thì giữ cột đang chọn
    if (suggestion.status) {
      f.status.value = suggestion.status;
      filled.push(f.status);
    }
    filled.forEach((el) => {
      el.classList.remove('ai-filled');
      void el.offsetWidth; // chạy lại animation nếu bấm nhiều lần
      el.classList.add('ai-filled');
    });
    f.title.focus();
  } catch (err) {
    if (session !== dialogSession || err.status === 401) return;
    setAiError(err.message);
  } finally {
    if (session === dialogSession) setAiBusy(false);
  }
}

// ---------- Ô "Hạn hoàn thành" dạng dd/mm/yyyy ----------

function bindDueDateInput() {
  const input = taskForm.elements.dueDate;
  const picker = $('#due-picker');

  // Gõ "02" → "02/", "02/12" → "02/12/" cho nhanh (không chèn khi đang xóa)
  input.addEventListener('input', (e) => {
    if (e.inputType === 'insertText' && /^\d{2}(\/\d{2})?$/.test(input.value)) input.value += '/';
  });
  // Rời ô: chuẩn hóa "2/12/2026" → "02/12/2026"
  input.addEventListener('blur', () => {
    const iso = vnToIso(input.value);
    if (iso) input.value = isoToVn(iso);
  });

  // Nút lịch: mở lịch chọn ngày của trình duyệt, chọn xong điền lại dạng dd/mm/yyyy
  $('#due-picker-btn').addEventListener('click', () => {
    picker.value = vnToIso(input.value) ?? '';
    try {
      picker.showPicker();
    } catch {
      picker.focus();
    }
  });
  picker.addEventListener('change', () => {
    input.value = isoToVn(picker.value);
    input.closest('.field')?.classList.remove('invalid');
    $('[data-error-for="dueDate"]', taskForm).textContent = '';
    input.focus();
  });
}

async function saveTask(event) {
  event.preventDefault();
  clearFormErrors(taskForm);
  const f = taskForm.elements;
  const dueText = f.dueDate.value.trim();
  const body = {
    title: f.title.value.trim(),
    description: f.description.value.trim() || null,
    status: f.status.value,
    priority: f.priority.value,
    dueDate: dueText ? vnToIso(dueText) : null,
  };
  if (!body.title) {
    showFieldErrors(taskForm, { title: 'Tiêu đề không được để trống' });
    f.title.focus();
    return;
  }
  if (dueText && !body.dueDate) {
    showFieldErrors(taskForm, { dueDate: 'Ngày không hợp lệ, nhập dạng dd/mm/yyyy' });
    f.dueDate.focus();
    return;
  }

  const editing = state.editingTask;
  await withBusy(taskForm, async () => {
    try {
      if (editing) {
        await api(`/api/tasks/${editing.id}`, { method: 'PUT', body });
      } else {
        await api('/api/tasks', { method: 'POST', body });
      }
      closeTaskDialog();
      toast(editing ? 'Đã cập nhật task' : 'Đã tạo task mới');
      refresh();
    } catch (err) {
      if (err.status === 401) return;
      if (err.status === 404) {
        closeTaskDialog();
        toast('Task không còn tồn tại', 'error');
        refresh();
        return;
      }
      showApiErrorInForm(taskForm, err);
    }
  });
}

async function deleteTask() {
  const task = state.editingTask;
  if (!task) return;
  // eslint-disable-next-line no-alert
  if (!window.confirm(`Xóa task "${task.title}"? Thao tác này không thể hoàn tác.`)) return;
  try {
    await api(`/api/tasks/${task.id}`, { method: 'DELETE' });
    closeTaskDialog();
    toast('Đã xóa task');
    refresh();
  } catch (err) {
    reportError(err);
  }
}

// ============================================================================
// Gắn sự kiện
// ============================================================================

function bindEvents() {
  // Đăng nhập / đăng ký
  $$('[data-auth-tab]').forEach((b) => b.addEventListener('click', () => switchAuthTab(b.dataset.authTab)));
  $('#login-form').addEventListener('submit', handleLogin);
  $('#register-form').addEventListener('submit', handleRegister);
  $('#logout-btn').addEventListener('click', logout);

  // Token hết hạn / bị thu hồi khi đang dùng
  window.addEventListener('auth:expired', () => {
    state.ai = { loaded: false, enabled: false }; // đăng nhập lại thì hỏi lại trạng thái AI
    showAuthView();
    toast('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', 'error');
  });

  // Điều hướng
  window.addEventListener('hashchange', route);

  // Dashboard
  $('#upcoming-days').addEventListener('change', (e) => {
    state.upcomingDays = Number(e.target.value);
    loadDashboard();
  });

  // Board / List + bộ lọc
  $$('[data-view]').forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));
  $('#filter-search').addEventListener('input', debounce((e) => {
    state.filters.search = e.target.value.trim();
    state.list.page = 0;
    loadTasks();
  }, SEARCH_DEBOUNCE_MS));
  $('#filter-status').addEventListener('change', (e) => {
    state.filters.status = e.target.value;
    state.list.page = 0;
    loadTasks();
  });
  $('#filter-priority').addEventListener('change', (e) => {
    state.filters.priority = e.target.value;
    state.list.page = 0;
    loadTasks();
  });
  $('#list-sort').addEventListener('change', (e) => {
    state.list.sort = e.target.value;
    state.list.page = 0;
    loadList();
  });

  // Dialog task
  $$('[data-action="new-task"]').forEach((b) => b.addEventListener('click', () => openTaskDialog()));
  taskForm.addEventListener('submit', saveTask);
  $('#task-cancel').addEventListener('click', closeTaskDialog);
  $('#task-delete').addEventListener('click', deleteTask);
  $('#ai-fill').addEventListener('click', fillWithAi);
  $('#ai-input').addEventListener('keydown', (e) => {
    // Enter trong ô AI = "Điền tự động" (không submit form)
    if (e.key === 'Enter') {
      e.preventDefault();
      fillWithAi();
    }
  });
  bindDueDateInput();
  dialog.addEventListener('close', () => {
    dialogSession += 1;
    state.editingTask = null;
  });
  // Click ra ngoài hộp thoại (vùng nền mờ) để đóng
  dialog.addEventListener('click', (e) => {
    const r = dialog.getBoundingClientRect();
    const outside = e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    if (e.target === dialog && outside) closeTaskDialog();
  });
}

bindEvents();
route();
