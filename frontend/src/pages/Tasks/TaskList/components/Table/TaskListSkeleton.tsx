import { Skeleton } from 'antd'

export const TaskListSkeleton = () => {
  return (
    <div className="flex flex-col w-full pb-10 gap-6">
      <div className="bg-white/65 backdrop-blur-2xl rounded-2xl p-4 shadow-[0_12px_32px_-4px_rgba(15,23,42,0.05)] h-20">
        <Skeleton active title={false} paragraph={{ rows: 1, width: '100%' }} />
      </div>

      <div className="bg-white/65 backdrop-blur-2xl rounded-2xl p-6 shadow-[0_16px_36px_-6px_rgba(15,23,42,0.06)] min-h-[400px]">
        <Skeleton active title={false} paragraph={{ rows: 8, width: '100%' }} />
      </div>

      <div className="bg-white/65 backdrop-blur-2xl rounded-2xl p-4 shadow-[0_12px_32px_-4px_rgba(15,23,42,0.04)] h-16">
        <Skeleton active title={false} paragraph={{ rows: 1, width: '100%' }} />
      </div>
    </div>
  )
}
