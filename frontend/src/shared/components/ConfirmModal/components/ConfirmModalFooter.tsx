import { Button } from 'antd'

interface ConfirmModalFooterProps {
  okText: string
  cancelText: string
  okType: 'primary' | 'danger'
  onOk: () => void
  onCancel: () => void
  isPending: boolean
}

export const ConfirmModalFooter = ({
  okText,
  cancelText,
  okType,
  onOk,
  onCancel,
  isPending,
}: ConfirmModalFooterProps) => {
  const isDanger = okType === 'danger'

  return (
    <div className="flex items-center justify-between gap-3 p-4 bg-slate-50/50 backdrop-blur-md border-t border-slate-100/50">
      <Button
        className="flex-1 h-11 rounded-xl text-slate-600 font-medium hover:text-slate-900 hover:bg-slate-100/80 border-transparent bg-transparent shadow-none"
        onClick={onCancel}
        disabled={isPending}
      >
        {cancelText}
      </Button>
      <Button
        type="primary"
        danger={isDanger}
        className={`flex-1 h-11 rounded-xl font-medium shadow-sm border-0 ${
          !isDanger ? 'bg-indigo-600 hover:bg-indigo-700' : ''
        }`}
        onClick={onOk}
        loading={isPending}
      >
        {okText}
      </Button>
    </div>
  )
}
