import { Skeleton } from 'antd'
import { GlassCard } from '../GlassCard/GlassCard'

export function AuthFormSkeleton() {
  return (
    <GlassCard>
      <div className="flex justify-center mb-7">
        <Skeleton.Input active style={{ width: 120, height: 28, borderRadius: 6 }} />
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton.Input active style={{ width: 60, height: 14, borderRadius: 4 }} />
          <Skeleton.Input active block style={{ height: 44, borderRadius: 10 }} />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton.Input active style={{ width: 80, height: 14, borderRadius: 4 }} />
          <Skeleton.Input active block style={{ height: 44, borderRadius: 10 }} />
        </div>
        <Skeleton.Input active block style={{ height: 44, borderRadius: 10 }} />
        <Skeleton.Input active style={{ width: 160, height: 14, borderRadius: 4 }} className="mx-auto" />
      </div>
    </GlassCard>
  )
}
