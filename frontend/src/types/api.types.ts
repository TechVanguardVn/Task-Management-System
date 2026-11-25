/**
 * Cấu trúc đóng gói dữ liệu phản hồi chuẩn từ Backend Spring Boot.
 */
export interface ApiResponse<T> {
  success: boolean;
  code: number;
  message: string;
  data: T;
  errors?: ValidationErrorDetail[];
  timestamp: string;
}

export interface ValidationErrorDetail {
  field: string;
  detail: string;
}

/**
 * Cấu trúc phân trang chuẩn mực cho các danh sách lớn.
 */
export interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}
