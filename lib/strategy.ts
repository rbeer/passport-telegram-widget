import { createHash, createHmac } from 'crypto';

import { Request } from 'express';
import { Strategy } from 'passport-strategy';

import BadHashError from './errors/bad-hash-error';
import BadQueryError from './errors/bad-query-error';

interface QueryTypes {
  id: string;
  auth_date: string;
  hash: string;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  [key: string]: string | undefined;
}

type TelegramUser = {
  id: string;
  auth_date: string;
  hash: string;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  [key: string]: string | undefined;
};

type TelegramWidgetStrategyOptions = {
  botToken: string;
};

export type VerifiedCallback = (
  err: Error | null,
  user?: any,
  info?: string | { message?: string; type?: string }
) => void;

export type VerifyFn = (
  req: Express.Request,
  user: TelegramUser,
  done: VerifiedCallback
) => void;

export type QueryRequest = Request<
  {},
  any,
  any,
  QueryTypes,
  Record<string, any>
>;

export default class TelegramWidgetStrategy extends Strategy {
  name: string;

  verify: VerifyFn;

  botTokenHash: Buffer;

  constructor(options: TelegramWidgetStrategyOptions, verify: VerifyFn) {
    super();

    if (!options.botToken) {
      throw new ReferenceError(
        'TelegramWidgetStrategy requires a botToken option'
      );
    }
    if (typeof verify !== 'function') {
      throw new TypeError('TelegramWidgetStrategy requires a verify callback');
    }

    this.name = 'telegram-widget';
    this.verify = verify;

    this.botTokenHash = createHash('sha256').update(options.botToken).digest();
  }

  authenticate(req: QueryRequest) {
    const user: TelegramUser = {
      id: req.query.id,
      auth_date: req.query.auth_date,
      hash: req.query.hash,
      first_name: req.query.first_name
    };

    for (const key in req.query) {
      if (!req.query[key]) {
        continue;
      }
      if (typeof req.query[key] !== 'string') {
        return this.fail(new BadQueryError(key), 400);
      }
      user[key] = req.query[key] as string;
    }

    // https://core.telegram.org/widgets/login#checking-authorization
    if (this.verifyHash(user) !== true) {
      return this.fail(new BadHashError(), 400);
    }

    this.verify(req, user, this.verified.bind(this));
  }

  verifyHash({ hash, ...data }: TelegramUser) {
    const checkString = Object.keys(data)
      .sort()
      .map((key) => `${key}=${data[key]}`)
      .join('\n');

    const hmac = createHmac('sha256', this.botTokenHash)
      .update(checkString.trimEnd())
      .digest('hex');

    if (hash === hmac) {
      return true;
    }
    return false;
  }

  verified(
    err: Error | null,
    user: any,
    info?: string | { message?: string; type?: string }
  ) {
    if (err) {
      return this.error(err);
    }

    if (!user) {
      return this.fail(info, 401);
    }

    this.success(user, info);
  }
}
