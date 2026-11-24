import { Component } from 'react'

export class AppErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="grid min-h-dvh place-content-center gap-4 px-6 text-center">
          <h1 className="text-2xl font-semibold">Đã xảy ra lỗi</h1>
          <p className="text-slate-500">Vui lòng tải lại trang để thử lại.</p>
          <button
            className="button-primary justify-self-center"
            onClick={() => window.location.reload()}
          >
            Tải lại trang
          </button>
        </main>
      )
    }
    return this.props.children
  }
}
