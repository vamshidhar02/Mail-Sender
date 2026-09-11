import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { AUTH_ERROR_FRAGMENT_KEY, AUTH_TOKEN_FRAGMENT_KEY } from '@mailer/shared';

import { AuthService } from './auth.service';

/**
 * The sign-in decision and the shape of the redirect are the two things the
 * dashboard cannot recover from if they are wrong, and neither needs Google or
 * a database to exercise.
 */
describe('AuthService', () => {
  const build = async (config: Record<string, unknown>) => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: { sign: jest.fn(() => 'signed.jwt.value') } },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, fallback?: unknown) => config[key] ?? fallback,
            getOrThrow: (key: string) => {
              if (!(key in config)) throw new Error('missing ' + key);
              return config[key];
            },
          },
        },
      ],
    }).compile();

    return moduleRef.get(AuthService);
  };

  describe('assertAllowedToSignIn', () => {
    it('accepts any account when the allowlist is empty', async () => {
      const service = await build({ 'auth.allowedEmails': [] });

      expect(() => service.assertAllowedToSignIn('anyone@example.com')).not.toThrow();
    });

    it('accepts an allowlisted address regardless of case', async () => {
      const service = await build({ 'auth.allowedEmails': ['owner@example.com'] });

      expect(() => service.assertAllowedToSignIn('Owner@Example.com')).not.toThrow();
    });

    it('refuses an address that is not on a non-empty allowlist', async () => {
      const service = await build({ 'auth.allowedEmails': ['owner@example.com'] });

      expect(() => service.assertAllowedToSignIn('stranger@example.com')).toThrow(
        ForbiddenException,
      );
    });
  });

  describe('buildRedirectUrl', () => {
    const config = { 'auth.webAppUrl': 'https://dashboard.example.com' };

    it('puts the token in the fragment, never the query string', async () => {
      const service = await build(config);

      const url = service.buildRedirectUrl({ token: 'abc.def.ghi' });

      expect(url).toBe(
        'https://dashboard.example.com/auth/callback#' + AUTH_TOKEN_FRAGMENT_KEY + '=abc.def.ghi',
      );
      expect(url).not.toContain('?');
    });

    it('escapes an error message so spaces cannot break the fragment', async () => {
      const service = await build(config);

      const url = service.buildRedirectUrl({ error: 'Sign-in was cancelled.' });

      expect(url).toContain('#' + AUTH_ERROR_FRAGMENT_KEY + '=');
      expect(url).toContain('Sign-in%20was%20cancelled.');
    });
  });
});
