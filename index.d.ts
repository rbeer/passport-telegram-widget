import { QueryRequest } from './lib/strategy';

declare module 'passport-strategy' {
  interface Strategy {
    authenticate(req: QueryRequest): void;
  }
}
