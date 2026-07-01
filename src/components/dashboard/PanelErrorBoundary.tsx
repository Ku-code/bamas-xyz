import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** When this value changes, the boundary resets (e.g. the active panel id),
   *  so navigating to another panel recovers from a previous panel's error. */
  resetKey?: string | number;
  /** Optional label for the failing area, shown in the fallback. */
  label?: string;
}

interface State {
  hasError: boolean;
}

/**
 * Isolates a single dashboard panel so a crash in one lazy-loaded section shows
 * a local retry message instead of blanking the whole app via the top-level
 * ErrorBoundary.
 */
export class PanelErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidUpdate(prevProps: Props) {
    // Reset when the caller switches panels.
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Dashboard panel error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-64 gap-4 text-center px-4">
          <p className="text-lg font-semibold text-destructive">
            {this.props.label ? `Couldn't load ${this.props.label}` : "Something went wrong in this section"}
          </p>
          <p className="text-sm text-muted-foreground max-w-sm">
            This section failed to load. You can retry, or switch to another section from the sidebar.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default PanelErrorBoundary;
