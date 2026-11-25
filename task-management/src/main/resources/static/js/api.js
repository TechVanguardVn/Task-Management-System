
const TOKEN_KEY = 'taskManager.token';
const USER_KEY = 'taskManager.user';

const store = (() => {
  try { return window.sessionStorage; } catch { return null; } // có thể bị chặn (chế độ riêng tư...)
})();

try {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
} catch { /* bỏ qua */ }

export class ApiError extends Error {
  constructor(status, message, fieldErrors = null) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors; // { title: "Tiêu đề không được để trống", ... }
  }
}

export const auth = {
  get token() {
    try { return store?.getItem(TOKEN_KEY) ?? null; } catch { return null; }
  },
  /** Lưu kết quả đăng nhập (AuthResponse): token + thông tin user để hiển thị. */
  save(authResponse) {
    // Chỉ lưu khi server thật sự trả về token, tránh lưu "undefined" rồi tưởng là đã đăng nhập
    if (typeof authResponse?.accessToken !== 'string' || !authResponse.accessToken) {
      throw new ApiError(0, 'Phản hồi đăng nhập không hợp lệ, vui lòng thử lại');
    }
    try {
      store?.setItem(TOKEN_KEY, authResponse.accessToken);
      store?.setItem(USER_KEY, JSON.stringify({
        email: authResponse.email,
        fullName: authResponse.fullName,
      }));
    } catch { /* bỏ qua */ }
  },
  clear() {
    try {
      store?.removeItem(TOKEN_KEY);
      store?.removeItem(USER_KEY);
    } catch { /* bỏ qua */ }
  },
  /** { email, fullName } của user đang đăng nhập. Chỉ để hiển thị, không dùng để phân quyền. */
  get user() {
    try {
      return JSON.parse(store?.getItem(USER_KEY) ?? 'null') || { email: '', fullName: '' };
    } catch {
      return { email: '', fullName: '' };
    }
  },
};

const DEFAULT_MESSAGES = {
  400: 'Dữ liệu không hợp lệ',
  401: 'Bạn cần đăng nhập',
  403: 'Bạn không có quyền thực hiện thao tác này',
  404: 'Không tìm thấy dữ liệu',
  409: 'Dữ liệu bị trùng',
  500: 'Server gặp lỗi, vui lòng thử lại sau',
};

/**
 * @param {string} path      đường dẫn trên CHÍNH server này, ví dụ "/api/tasks"
 * @param {object} options   { method, body, query, requireAuth }
 *
 * requireAuth = false cho các API xác thực bằng mật khẩu (đăng nhập, đăng ký): không gửi token cũ,
 * và lỗi 401 khi đó nghĩa là "sai email/mật khẩu" chứ không phải "hết phiên" (không tự đăng xuất).
 * Nếu sau này thêm "đổi mật khẩu" (cần token), backend nên trả 400 khi sai mật khẩu hiện tại,
 * vì 401 ở API cần đăng nhập sẽ bị hiểu là hết phiên và đẩy người dùng ra màn hình đăng nhập.
 */
export async function api(path, { method = 'GET', body, query, requireAuth = true } = {}) {
  const url = new URL(path, window.location.origin);
  // Chặn gửi token sang tên miền khác: new URL() bỏ qua origin gốc nếu path là URL đầy đủ
  // ("https://evil.com/...") hoặc bắt đầu bằng "//evil.com"
  if (url.origin !== window.location.origin) {
    throw new ApiError(0, 'Địa chỉ API không hợp lệ');
  }
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
    }
  }

  const headers = { Accept: 'application/json, text/plain' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (requireAuth && auth.token) headers.Authorization = `Bearer ${auth.token}`;

  let response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Không kết nối được tới server');
  }

  if (response.status === 401 && requireAuth) {
    auth.clear();
    window.dispatchEvent(new CustomEvent('auth:expired'));
    throw new ApiError(401, 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
  }

  if (!response.ok) {
    let data = null;
    try { data = await response.json(); } catch { /* body rỗng hoặc không phải JSON */ }
    throw new ApiError(
      response.status,
      data?.message || DEFAULT_MESSAGES[response.status] || `Lỗi ${response.status}`,
      data?.errors || null,
    );
  }

  // Đọc dạng text trước rồi mới parse: một số API (vd: register) trả chuỗi thường,
  // nhưng có thể bị gắn Content-Type application/json tùy header Accept.
  const text = await response.text();
  if (!text) return null;
  const contentType = response.headers.get('Content-Type') || '';
  if (contentType.includes('application/json')) {
    try { return JSON.parse(text); } catch { /* không phải JSON hợp lệ → trả về text */ }
  }
  return text;
}
