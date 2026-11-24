export function apiErrorMessage(error, context) {
  if (error?.code === 'ERR_CANCELED' || error?.name === 'AbortError')
    return null
  if (error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT')
    return 'Máy chủ phản hồi quá chậm. Vui lòng thử lại.'
  const status = error?.response?.status
  if (!status) return 'Không thể kết nối đến máy chủ.'
  if (context === 'login' && status === 401)
    return 'Email hoặc mật khẩu không chính xác.'
  if (context === 'register' && status === 409)
    return 'Email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác.'
  if (status === 400 || status === 422)
    return 'Dữ liệu không hợp lệ. Vui lòng kiểm tra các trường được đánh dấu.'
  if (status === 401) return 'Phiên đăng nhập đã hết hạn.'
  if (status === 403) return 'Bạn không có quyền thực hiện thao tác này.'
  if (status === 404) return 'Không tìm thấy dữ liệu yêu cầu.'
  if (status === 409)
    return 'Dữ liệu bị xung đột hoặc dự án đã lưu trữ. Vui lòng tải lại trước khi thử lại.'
  if (status === 429)
    return 'Bạn đã thử quá nhiều lần. Vui lòng đợi một lát rồi thử lại.'
  if (status >= 500) return 'Máy chủ gặp sự cố. Vui lòng thử lại sau.'
  return 'Không thể hoàn tất yêu cầu. Vui lòng thử lại.'
}

export function mutationRecovery(error) {
  return [400, 422].includes(error?.response?.status)
    ? 'Kiểm tra thông tin trong biểu mẫu rồi gửi lại yêu cầu.'
    : 'Kết quả thao tác chưa được xác nhận. Vui lòng tải lại dữ liệu trước khi thử lại.'
}
