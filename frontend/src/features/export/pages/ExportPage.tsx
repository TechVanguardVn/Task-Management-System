import React, { useState } from 'react';
import { exportService } from '../../../services/api/exportService';
import { Button } from '../../../components/common/Button';
import { Download, FileText, Code2, Check } from 'lucide-react';

export const ExportPage: React.FC = () => {
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [isExportingJson, setIsExportingJson] = useState(false);
  const [jsonContent, setJsonContent] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleDownloadCsv = async () => {
    try {
      setIsExportingCsv(true);
      await exportService.downloadTasksCsv();
    } catch {
      alert('Không thể tải file CSV. Vui lòng thử lại.');
    } finally {
      setIsExportingCsv(false);
    }
  };

  const handleFetchJson = async () => {
    try {
      setIsExportingJson(true);
      const data = await exportService.getTasksJson();
      setJsonContent(JSON.stringify(data, null, 2));
    } catch {
      // Bỏ qua lỗi kết nối json
    } finally {
      setIsExportingJson(false);
    }
  };

  const handleCopyJson = () => {
    if (jsonContent) {
      navigator.clipboard.writeText(jsonContent);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-zinc-100">Xuất Báo Cáo & Dữ Liệu (Export)</h1>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
          Trích xuất danh sách công việc cá nhân ra định dạng Excel CSV hoặc cấu trúc JSON
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card Xuất file CSV */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mb-4">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-zinc-100 mb-1">
              File Microsoft Excel (CSV)
            </h3>
            <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed mb-6">
              Xuất toàn bộ công việc với đầy đủ cột thông tin: Tiêu đề, Trạng thái, Độ ưu tiên, Ngày hết hạn, Tiến độ % và Mô tả. Được mã hóa UTF-8 BOM chuẩn để không bị lỗi font Tiếng Việt khi mở trên Excel.
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            className="w-full"
            onClick={handleDownloadCsv}
            isLoading={isExportingCsv}
          >
            <Download className="w-4 h-4" />
            <span>Tải về file tasks.csv</span>
          </Button>
        </div>

        {/* Card Xuất cấu trúc JSON */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 flex items-center justify-center mb-4">
              <Code2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-zinc-100 mb-1">
              Cấu trúc Dữ liệu JSON
            </h3>
            <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed mb-6">
              Trích xuất dữ liệu thô phục vụ mục đích sao lưu, lập trình API bên thứ 3 hoặc tích hợp với các công cụ tự động hóa khác.
            </p>
          </div>

          <Button
            variant="secondary"
            size="md"
            className="w-full"
            onClick={handleFetchJson}
            isLoading={isExportingJson}
          >
            <Code2 className="w-4 h-4" />
            <span>Xem & Trích xuất JSON</span>
          </Button>
        </div>
      </div>

      {/* Vùng xem trước JSON */}
      {jsonContent && (
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-900 dark:text-zinc-100">Dữ liệu JSON</span>
            <Button variant="ghost" size="sm" onClick={handleCopyJson}>
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : null}
              <span>{isCopied ? 'Đã sao chép' : 'Sao chép JSON'}</span>
            </Button>
          </div>
          <pre className="p-4 bg-gray-50 dark:bg-zinc-950 rounded-lg text-xs font-mono text-gray-800 dark:text-zinc-200 overflow-x-auto max-h-80 border border-gray-100 dark:border-zinc-800">
            {jsonContent}
          </pre>
        </div>
      )}
    </div>
  );
};
