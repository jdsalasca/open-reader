import { Component, type ReactNode } from 'react'
import { useI18n } from '../i18n'

interface BoundaryProps {
  fallback: (reset: () => void) => ReactNode
  children: ReactNode
}

class Boundary extends Component<BoundaryProps, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    console.error('[open-reader]', error)
  }

  reset = () => this.setState({ failed: false })

  render() {
    if (this.state.failed) return this.props.fallback(this.reset)
    return this.props.children
  }
}

export function ErrorBoundary({ children }: { children: ReactNode }) {
  const { t } = useI18n()
  return (
    <Boundary
      fallback={(reset) => (
        <div className="crash" role="alert">
          <h1>{t('error.title')}</h1>
          <p>{t('error.body')}</p>
          <div className="crash__actions">
            <button className="btn btn--accent" type="button" onClick={reset}>
              {t('error.reload')}
            </button>
            <button
              className="btn btn--ghost"
              type="button"
              onClick={() => window.location.reload()}
            >
              ↻
            </button>
          </div>
        </div>
      )}
    >
      {children}
    </Boundary>
  )
}
