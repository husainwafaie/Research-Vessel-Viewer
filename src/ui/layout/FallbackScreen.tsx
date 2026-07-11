export type FallbackVariant = 'unsupported' | 'context-lost' | 'error';

const CONTENT: Record<FallbackVariant, { title: string; body: string }> = {
  unsupported: {
    title: 'WebGL is not available',
    body: 'This experience renders a real-time 3D ocean and needs WebGL, which your browser or device has disabled. Try a current version of Chrome, Edge, Firefox, or Safari with hardware acceleration enabled.',
  },
  'context-lost': {
    title: 'Graphics context lost',
    body: 'The GPU stopped responding — this can happen when a machine wakes from sleep or the driver resets. Reloading brings the vessel back.',
  },
  error: {
    title: 'Something went wrong',
    body: 'The application hit an unexpected error while rendering. Reloading usually resolves it.',
  },
};

/**
 * FallbackScreen — full-viewport failure state.
 *
 * Used for three situations that would otherwise strand the user on a
 * black or frozen page: no WebGL support, a lost GPU context, and a React
 * render error (via AppErrorBoundary). Reload is offered where it helps.
 */
export function FallbackScreen({ variant }: { variant: FallbackVariant }) {
  const { title, body } = CONTENT[variant];
  const showReload = variant !== 'unsupported';

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-[#020c1b] p-6"
      role="alert"
    >
      <div className="glass rounded-2xl px-8 py-8 max-w-md text-center">
        <div className="text-data text-ocean-500 text-xs uppercase tracking-widest mb-2">
          R/V Pelagic Horizon
        </div>
        <h1 className="text-white text-lg font-light mb-3">{title}</h1>
        <p className="text-sm text-ocean-300 leading-relaxed">{body}</p>
        {showReload && (
          <button
            onClick={() => window.location.reload()}
            className="glass-light rounded-lg px-4 py-2 mt-5 text-xs text-ocean-200 hover:text-white transition-colors pointer-events-auto"
          >
            Reload
          </button>
        )}
      </div>
    </div>
  );
}
