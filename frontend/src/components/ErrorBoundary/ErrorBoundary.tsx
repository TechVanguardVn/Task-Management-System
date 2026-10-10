import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Result, Button } from 'antd'
import { useNavigate } from 'react-router-dom'

interface ErrorFallbackProps {
  onReset: () => void
}

function ErrorFallbackUI({ onReset }: ErrorFallbackProps) {
  const navigate = useNavigate()

  const handleReset = () => {
    onReset()
    navigate('/', { replace: true })
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <Result
        status="500"
        title="Đã xảy ra lỗi"
        subTitle="Vui lòng thử lại hoặc liên hệ hỗ trợ."
        extra={
          <Button type="primary" onClick={handleReset}>
            Quay lại trang chủ
          </Button>
        }
      />
    </div>
  )
}

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary:', error, info)
  }

  reset = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallbackUI onReset={this.reset} />
    }
    return this.props.children
  }
}
