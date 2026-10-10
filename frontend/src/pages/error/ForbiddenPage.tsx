import { Result, Button } from 'antd'
import { useNavigate } from 'react-router-dom'

export default function ForbiddenPage() {
  const navigate = useNavigate()
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <Result
        status="403"
        title="403"
        subTitle="Bạn không có quyền truy cập vào trang này."
        extra={
          <Button type="primary" onClick={() => navigate('/')}>
            Về trang chủ
          </Button>
        }
      />
    </div>
  )
}
