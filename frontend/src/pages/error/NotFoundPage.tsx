import { Result, Button } from 'antd'
import { useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <Result
        status="404"
        title="404"
        subTitle="Trang bạn tìm kiếm không tồn tại hoặc đã bị di chuyển."
        extra={
          <div className="flex items-center gap-3 justify-center">
            <Button type="primary" onClick={() => navigate('/')}>
              Về trang chủ
            </Button>
            <Button onClick={() => navigate(-1)}>
              Quay lại
            </Button>
          </div>
        }
      />
    </div>
  )
}
