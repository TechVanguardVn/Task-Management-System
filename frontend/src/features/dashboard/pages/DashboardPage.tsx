import React, { useState, useEffect } from 'react';
import { dashboardService, DashboardMetrics } from '../../../services/api/dashboardService';
import { CheckSquare, Clock, AlertTriangle, TrendingUp, Calendar, ArrowRight, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';

interface DashboardPageProps {
  onOpenCreateTaskModal: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onOpenCreateTaskModal }) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setIsLoading(true);
        const data = await dashboardService.getMetrics();
        setMetrics(data);
      } catch {
        // Lỗi kết nối hoặc timeout
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (isLoading || !metrics) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-5 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const metricCards = [
    {
      title: 'Tổng số công việc',
      value: metrics.totalTasks,
      icon: CheckSquare,
      color: 'text-zinc-700 dark:text-zinc-300',
      bg: 'bg-zinc-100 dark:bg-zinc-800',
    },
    {
      title: 'Chưa bắt đầu',
      value: metrics.todoTasks,
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/50',
    },
    {
      title: 'Đang thực hiện',
      value: metrics.inProgressTasks,
      icon: TrendingUp,
      color: 'text-sky-600 dark:text-sky-400',
      bg: 'bg-sky-50 dark:bg-sky-950/50',
    },
    {
      title: 'Đã hoàn thành',
      value: metrics.doneTasks,
      icon: CheckSquare,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Tiêu đề & Nút thao tác nhanh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-zinc-100">Bảng điều khiển Tổng quan</h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
            Hiệu suất công việc thời gian thực
          </p>
        </div>

        <Button variant="primary" size="md" onClick={onOpenCreateTaskModal}>
          <Plus className="w-4 h-4" />
          <span>Tạo công việc mới</span>
        </Button>
      </div>

      {/* 4 Thẻ số liệu thống kê */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card, i) => (
          <div
            key={i}
            className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1">{card.title}</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">{card.value}</h3>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.bg} ${card.color}`}>
              <card.icon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Grid 2 cột: Tỉ lệ hoàn thành & Danh sách sắp đến hạn */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tỉ lệ hoàn thành */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-zinc-100 mb-1">Tiến độ Hoàn thành</h3>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mb-6">Tỉ lệ công việc đã hoàn thành trên tổng số</p>
          </div>

          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-gray-100 dark:text-zinc-800"
                  strokeWidth="3.8"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-600 transition-all duration-1000 ease-out"
                  strokeDasharray={`${metrics.completionRate}, 100`}
                  strokeWidth="3.8"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-3xl font-extrabold text-gray-900 dark:text-zinc-100">
                  {metrics.completionRate}%
                </span>
                <span className="block text-[10px] text-gray-400 uppercase font-semibold">Đã xong</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-600 dark:text-zinc-400">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span>Hoàn thành: {metrics.doneTasks}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-zinc-700" />
                <span>Còn lại: {metrics.totalTasks - metrics.doneTasks}</span>
              </div>
            </div>
          </div>

          <Link
            to="/tasks"
            className="mt-4 flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-500 pt-4 border-t border-gray-100 dark:border-zinc-800"
          >
            <span>Xem tất cả công việc</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Danh sách công việc sắp đến hạn (7 ngày tới) */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-zinc-100">Sắp đến hạn (7 ngày tới)</h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                  Các công việc ưu tiên cần hoàn tất sớm
                </p>
              </div>

              {metrics.overdueTasks > 0 && (
                <Badge variant="danger" size="sm">
                  {metrics.overdueTasks} việc quá hạn
                </Badge>
              )}
            </div>

            {metrics.upcomingTasks.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400 dark:text-zinc-500">
                Tuyệt vời! Không có công việc nào sắp đến hạn chót trong 7 ngày tới.
              </div>
            ) : (
              <div className="space-y-3">
                {metrics.upcomingTasks.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/30 hover:border-gray-300 dark:hover:border-zinc-700 transition-colors"
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <h4 className="text-xs font-semibold text-gray-900 dark:text-zinc-100 truncate">
                        {t.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500 dark:text-zinc-400">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(t.dueDate).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {t.isOverdue ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-full">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Quá hạn</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-full">
                          Còn {t.daysRemaining === 0 ? 'hôm nay' : `${t.daysRemaining} ngày`}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Link
            to="/kanban"
            className="mt-6 flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-500 pt-4 border-t border-gray-100 dark:border-zinc-800"
          >
            <span>Mở Bảng Kanban để xử lý</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
