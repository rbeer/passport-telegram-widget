import { createHash, createHmac } from 'crypto';
import { Request } from 'express';
import { Strategy } from 'passport-strategy';
import BadHashError from './lib/bad-hash-error';

type TelegramUser = {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  photoUrl: string;
  authDate: number;
  hash: string;
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

export default class TelegramWidgetStrategy extends Strategy {
  name: string;

  verify: VerifyFn;

  botToken: string;

  botTokenHash: string;

  // @ts-ignore
  constructor(options: TelegramWidgetStrategyOptions, verify: VerifyFn) {
    if (!options.botToken) {
      throw new ReferenceError(
        'TelegramWidgetStrategy requires a botToken option'
      );
    }
    if (typeof verify !== 'function') {
      throw new TypeError('TelegramWidgetStrategy requires a verify callback');
    }
    super();
    this.name = 'telegram-widget';
    this.verify = verify;

    this.botToken = options.botToken;
    this.botTokenHash = createHash('sha256')
      .update(this.botToken)
      .digest('hex');
  }

  authenticate(req: Request) {
    const user: TelegramUser = {
      id: parseInt(req.params.id, 10),
      username: req.params.username,
      firstName: req.params.first_name,
      lastName: req.params.last_name,
      photoUrl: req.params.photo_url,
      authDate: parseInt(req.params.auth_date, 10),
      hash: req.params.hash
    };

    // https://core.telegram.org/widgets/login#checking-authorization
    if (this.verifyHash(user) !== true) {
      return this.fail(new BadHashError(), 400);
    }

    this.verify(req, user, this.verified);
  }

  createDataCheckString(user: TelegramUser) {
    return `auth_date=${user.authDate}\nfirst_name=${user.firstName}\nid=${user.id}\nusername=${user.username}`;
  }

  verifyHash(user: TelegramUser) {
    const checkString = this.createDataCheckString(user);
    const hmac = createHmac('sha256', this.botTokenHash)
      .update(checkString)
      .digest('hex');

    if (user.hash === hmac) {
      return true;
    }
    return false;
  }

  verified: VerifiedCallback = (err, user, info) => {
    if (err) {
      return this.error(err);
    }

    if (!user) {
      return this.fail(info, 401);
    }

    this.success(user, info);
  };
}
