export default class BadHashError extends Error {
  constructor(message?: string) {
    super(message ?? 'data-check-string verifiction failed');
    this.name = 'BadHashError';
  }
}
