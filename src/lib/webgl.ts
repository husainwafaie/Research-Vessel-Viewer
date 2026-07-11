/**
 * isWebGLSupported — probe for a usable WebGL context before mounting the
 * 3D scene, so unsupported browsers get a clear message instead of a crash
 * or a black canvas.
 */
export function isWebGLSupported(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      canvas.getContext('webgl2') ?? canvas.getContext('webgl'),
    );
  } catch {
    return false;
  }
}
