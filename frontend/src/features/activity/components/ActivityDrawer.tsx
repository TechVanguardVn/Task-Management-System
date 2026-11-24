import React, { useEffect, useState } from 'react';
import { X, Clock, Activity } from 'lucide-react';
import { TaskActivityLogResponse } from '../../../types/task.types';
import { activityService } from '../../../services/api/activityService';

interface ActivityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Ngăn kéo trượt từ cạnh phải màn hình hiển thị toàn bộ lịch sử thao tác (Audit Trail) của người dùng.
 */
export const ActivityDrawer: React.FC<ActivityDrawerProps> = ({ isOpen, onClose }) => {
  const [activities, setActivities] = useState<TaskActivityLogResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchLogs = async () => {
        try {
          setIsLoading(true);
          const data = await activityService.getRecentActivities(30);
          setActivities(data);
        } catch {
          // Bỏ qua lỗi kết nối tạm thời
        } finally {
          setIsLoading(false);
        }
      };
      fetchLogs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-zinc-900 border-l border-gray-200 dark:border-zinc-800 shadow-2xl flex flex-col">
          {/* Header Drawer */}
          <div className="p-5 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-zinc-100">
                Nhật ký hoạt động (Audit Trail)
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Timeline */}
          <div className="flex-1 overflow-y-auto p-5">
            {isLoading ? (
              <div className="py-12 text-center text-xs text-gray-400">Đang tải lịch sử hoạt động...</div>
            ) : activities.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400">Chưa có hoạt động nào được ghi nhận.</div>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200 dark:before:bg-zinc-800">
                {activities.map((item) => (
                  <div key={item.id} className="relative group">
                    {/* Chấm tròn mốc thời gian */}
                    <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-emerald-600 ring-4 ring-white dark:ring-zinc-900" />
                    
                    <div>
                      <p className="text-xs font-semibold text-gray-900 dark:text-zinc-100">
                        {item.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400 dark:text-zinc-500">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(item.createdAt).toLocaleString('vi-VN')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
