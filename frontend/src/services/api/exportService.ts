import { axiosClient } from './axiosClient';

export const exportService = {
  /**
   * Tải về file tasks.csv (chuẩn UTF-8 có BOM tương thích tốt với Excel).
   */
  async downloadTasksCsv(): Promise<void> {
    const response = await axiosClient.get('/export/tasks/csv', {
      responseType: 'blob',
    });

    // Tạo link tải ảo và tự động kích hoạt click để tải file về máy người dùng
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'tasks.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Lấy dữ liệu công việc dạng JSON.
   */
  async getTasksJson(): Promise<any> {
    const response = await axiosClient.get('/export/tasks/json');
    return response.data.data;
  },
};
