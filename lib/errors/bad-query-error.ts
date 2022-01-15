export default class BadQueryError extends Error {
  constructor(missingKey: string) {
    super(`Query string is missing '${missingKey}'`);
    this.name = 'BadQueryError';
  }
}
