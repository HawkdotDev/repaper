import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallbackTitle?: string
  fallbackMessage?: string
  onReset?: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught error:', error, errorInfo)
    this.setState({ errorInfo })
  }

  public handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-75 h-full p-8 text-center bg-zinc-900/40 border border-zinc-800 rounded-xl m-4">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4 border border-rose-500/20">
            <AlertTriangle size={24} />
          </div>
          <h3 className="text-lg font-semibold text-zinc-100 mb-2">
            {this.props.fallbackTitle || 'Something went wrong'}
          </h3>
          <p className="text-sm text-zinc-400 max-w-md mb-6 leading-relaxed">
            {this.props.fallbackMessage ||
              this.state.error?.message ||
              'An unexpected error occurred while rendering this component.'}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg transition-colors border border-zinc-700/60"
            >
              <RefreshCw size={14} />
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-xs font-medium rounded-lg transition-colors border border-purple-500/30"
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
