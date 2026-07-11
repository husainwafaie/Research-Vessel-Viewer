import { Component, type ReactNode } from 'react';
import { FallbackScreen, type FallbackVariant } from './FallbackScreen';

interface Props {
  children: ReactNode;
  /**
   * Which failure to report if an error is caught. A lost GPU context makes
   * downstream libraries throw during render (e.g. the postprocessing
   * composer), so App passes 'context-lost' while the context is down —
   * the user then sees the accurate message, not a generic error.
   */
  variant?: FallbackVariant;
}

interface State {
  hasError: boolean;
}

/**
 * AppErrorBoundary — last line of defence around the whole app.
 *
 * A render error anywhere in the tree (scene or UI) would otherwise unmount
 * everything and leave a white page; this catches it and shows the shared
 * FallbackScreen with a reload option. Must be a class component — error
 * boundaries have no hook equivalent.
 */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // Surface the real failure for debugging — the boundary must never
    // swallow it silently
    console.error('AppErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return <FallbackScreen variant={this.props.variant ?? 'error'} />;
    }
    return this.props.children;
  }
}
