import { getMockReq } from '@jest-mock/express';

import TelegramWidgetStrategy, { VerifyFn } from '../index';
import BadHashError from '../lib/bad-hash-error';
import { getParams as validParams } from './fixtures/valid';

// There's going to be some @ts-ignores in here;
// Need those, because passport modules are often used
// in pure JavaScript projects, so we need some missing
// value testing, here and there...

const botToken = '1234567890:AAFCSzHhGgR3ydLltMLLJflcld8Mhy9ziYu';

describe('Strategy', () => {
  describe('constructing', () => {
    const strategy = new TelegramWidgetStrategy(
      {
        botToken
      },
      (req, user, authData) => {}
    );

    it('has the name TelegramWidgetStrategy', () => {
      expect(strategy.name).toBe('TelegramWidgetStrategy');
    });

    it('throws without botToken option', () => {
      // @ts-ignore the empty TelegramWidgetStrategyOptions
      expect(() => new TelegramWidgetStrategy({}, () => {})).toThrowError(
        'TelegramWidgetStrategy requires a botToken option'
      );
    });

    it('throws without a verify callback', () => {
      expect(
        // @ts-ignore the missing VerifyFn
        () => new TelegramWidgetStrategy({ botToken: 'token' })
      ).toThrowError('TelegramWidgetStrategy requires a verify callback');
    });
  });

  describe('request handling', () => {
    describe('with valid user data', () => {
      let req = getMockReq({ params: validParams });
      let verify = jest.fn();
      const strategy = new TelegramWidgetStrategy({ botToken }, verify);

      it('calls verify with a TelegramUser', () => {
        strategy.authenticate(req);
        expect(verify).toHaveBeenCalledWith(
          req,
          {
            id: validParams.id,
            username: validParams.username,
            firstName: validParams.first_name,
            lastName: validParams.last_name,
            photoUrl: validParams.photo_url,
            authDate: validParams.auth_date,
            hash: validParams.hash
          },
          strategy.verified
        );
      });
    });

    describe('with invalid hash', () => {
      let req = getMockReq({
        params: { ...validParams, hash: 'this is just wrong' }
      });
      let verify = () => {};
      const strategy = new TelegramWidgetStrategy({ botToken }, verify);
      strategy.fail = jest.fn();

      it('fails with a BadHashError', () => {
        strategy.authenticate(req);
        expect(strategy.fail).toHaveBeenCalledWith(new BadHashError(), 400);
      });
    });
  });

  describe('VerifiedCallback handling', () => {
    let req = getMockReq({ params: validParams });
    const err = new Error('called it!');

    describe('with an error', () => {
      it("calls strategy's .error witht that error", () => {
        const strategy = new TelegramWidgetStrategy(
          { botToken },
          (_, __, done) => done(err)
        );
        strategy.error = jest.fn();
        strategy.authenticate(req);
        expect(strategy.error).toHaveBeenCalledWith(err);
      });
    });

    describe('with falsy user parameter', () => {
      it('fails with info and 401 status', () => {
        const strategy = new TelegramWidgetStrategy(
          { botToken },
          (_, __, done) => done(null, null, { message: 'bad auth' })
        );
        strategy.fail = jest.fn();
        strategy.authenticate(req);
        expect(strategy.fail).toHaveBeenCalledWith(
          { message: 'bad auth' },
          401
        );
      });
    });

    describe('with user parameter', () => {
      it('succeeds with user and info', () => {
        const strategy = new TelegramWidgetStrategy(
          { botToken },
          (_, __, done) =>
            done(
              null,
              { user: { id: 'ok', name: 'bob' } },
              { message: 'all good' }
            )
        );
        strategy.success = jest.fn();
        strategy.authenticate(req);
        expect(strategy.success).toHaveBeenCalledWith(
          { user: { id: 'ok', name: 'bob' } },
          { message: 'all good' }
        );
      });
    });
  });
});