import { Component } from "react";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("Uncaught render error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-cream-50 px-6 text-center">
          <p className="text-lg font-semibold text-ink">Something went wrong.</p>
          <p className="max-w-sm text-sm text-ink/60">
            Try reloading the page. If it keeps happening, check the browser console for details.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-xl bg-sage-500 px-5 py-2.5 text-sm font-medium text-cream-50"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
