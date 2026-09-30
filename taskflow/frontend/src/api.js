// Wrapper fetch: tự gắn token, chuẩn hóa lỗi validation của Laravel
export async function api(path, { method = 'GET', body } = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch('/api' + path, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) {
      localStorage.removeItem('token');
      location.reload();
    }
    throw new Error(data.errors ? Object.values(data.errors)[0][0] : data.message || 'Đã có lỗi xảy ra');
  }
  return data;
}

export const STATUSES = [
  ['TODO', 'To Do'],
  ['IN_PROGRESS', 'In Progress'],
  ['DONE', 'Done'],
];
export const PRIORITIES = [
  ['LOW', 'Low'],
  ['MEDIUM', 'Medium'],
  ['HIGH', 'High'],
];
