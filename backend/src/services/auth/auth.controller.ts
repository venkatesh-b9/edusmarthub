import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { validate } from '../../shared/utils/validation';
import { z } from 'zod';
import { ApiResponse } from '../../shared/types';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  mfaCode: z.string().optional(),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['teacher', 'parent', 'student']),
  schoolId: z.string().uuid().optional(),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

const mfaSetupSchema = z.object({
  method: z.enum(['sms', 'email', 'authenticator']),
  phoneNumber: z.string().optional(),
});

const verifyMfaSchema = z.object({
  code: z.string().length(6),
  secret: z.string().optional(),
});

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = validate(loginSchema, req.body);
      const result = await this.authService.login(
        data.email,
        data.password,
        data.mfaCode
      );

      const response: ApiResponse = {
        success: true,
        data: result,
        message: 'Login successful',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = validate(registerSchema, req.body);
      const result = await this.authService.register(data);

      const response: ApiResponse = {
        success: true,
        data: result,
        message: 'Registration successful',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = validate(refreshTokenSchema, req.body);
      const result = await this.authService.refreshToken(data.refreshToken);

      const response: ApiResponse = {
        success: true,
        data: result,
        message: 'Token refreshed successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization?.substring(7);
      if (token) {
        await this.authService.logout(token);
      }

      const response: ApiResponse = {
        success: true,
        message: 'Logout successful',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  setupMFA = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const data = validate(mfaSetupSchema, req.body);
      const result = await this.authService.setupMFA(req.user.userId, data);

      const response: ApiResponse = {
        success: true,
        data: result,
        message: 'MFA setup initiated',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  verifyMFA = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const data = validate(verifyMfaSchema, req.body);
      await this.authService.verifyMFA(req.user.userId, data.code, data.secret);

      const response: ApiResponse = {
        success: true,
        message: 'MFA verified successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  oauthCallback = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { provider, code } = req.query;
      const result = await this.authService.handleOAuthCallback(
        provider as string,
        code as string
      );

      // Redirect to frontend with token
      const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?token=${result.accessToken}`;
      res.redirect(redirectUrl);
    } catch (error) {
      next(error);
    }
  };

  initiateOAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { provider } = req.params;
      const authUrl = await this.authService.getOAuthUrl(provider);

      const response: ApiResponse = {
        success: true,
        data: { authUrl },
        message: 'OAuth URL generated',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
