import { Component, type ErrorInfo, type ReactNode } from 'react';
import { UnexpectedErrorPage } from '../pages/system/ErrorPages';
import { captureFrontendException } from '../observability/monitoring';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    captureFrontendException(error, { componentStack: info.componentStack });
  }

  render() {
    if (this.state.error) {
      return <UnexpectedErrorPage onRetry={() => this.setState({ error: null })} />;
    }
    return this.props.children;
  }
}
