import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticator } from 'otplib';
import qrcode from 'qrcode';
import { User, UserRole, Permission, JwtPayload } from '../../shared/types';
import { UnauthorizedError, ConflictError, NotFoundError } from '../../shared/utils/errors';
import logger from '../../shared/utils/logger';
import sequelize from '../../config/database';
import redis from '../../config/redis';
import { UserService } from '../user/user.service';

export class AuthService {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  async login(
    email: string,
    password: string,
    mfaCode?: string
  ): Promise<{ accessToken: string; refreshToken: string; user: Partial<User> }> {
    // Find user
    const user = await this.userService.findByEmail(email);
    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Check MFA if enabled
    if (user.mfaEnabled) {
      if (!mfaCode) {
        throw new UnauthorizedError('MFA code required');
      }

      const isValidMFA = await this.verifyMFACode(user.mfaSecret!, mfaCode);
      if (!isValidMFA) {
        throw new UnauthorizedError('Invalid MFA code');
      }
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Update last login
    await this.userService.updateLastLogin(user.id);

    // Log login
    logger.info(`User ${user.email} logged in successfully`);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        schoolId: user.schoolId,
      },
    };
  }

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    schoolId?: string;
  }): Promise<{ accessToken: string; refreshToken: string; user: Partial<User> }> {
    // Check if user exists
    const existingUser = await this.userService.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(
      data.password,
      parseInt(process.env.BCRYPT_ROUNDS || '12')
    );

    // Create user
    const user = await this.userService.create({
      ...data,
      passwordHash,
      permissions: this.getDefaultPermissions(data.role),
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    logger.info(`User ${user.email} registered successfully`);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        schoolId: user.schoolId,
      },
    };
  }

  async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET not configured');
    }

    try {
      const decoded = jwt.verify(refreshToken, secret) as JwtPayload;

      // Check if token is blacklisted
      const isBlacklisted = await redis.get(`refresh_token:${refreshToken}`);
      if (isBlacklisted) {
        throw new UnauthorizedError('Token has been revoked');
      }

      // Get user
      const user = await this.userService.findById(decoded.userId);
      if (!user || !user.isActive) {
        throw new UnauthorizedError('User not found or inactive');
      }

      // Generate new tokens
      return await this.generateTokens(user);
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Refresh token expired');
      }
      throw new UnauthorizedError('Invalid refresh token');
    }
  }

  async logout(token: string): Promise<void> {
    try {
      const decoded = jwt.decode(token) as JwtPayload;
      if (decoded && decoded.exp) {
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          await redis.setex(`blacklist:${token}`, ttl, '1');
        }
      }
    } catch (error) {
      logger.error('Error during logout:', error);
    }
  }

  async setupMFA(
    userId: string,
    method: 'sms' | 'email' | 'authenticator'
  ): Promise<{ secret?: string; qrCode?: string; phoneNumber?: string }> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    if (method === 'authenticator') {
      const secret = authenticator.generateSecret();
      const otpauthUrl = authenticator.keyuri(
        user.email,
        'EduSmartHub',
        secret
      );
      const qrCode = await qrcode.toDataURL(otpauthUrl);

      // Store secret temporarily (user needs to verify before enabling)
      await redis.setex(`mfa_setup:${userId}`, 600, secret); // 10 minutes

      return { secret, qrCode };
    }

    // For SMS/Email, return setup info
    return { phoneNumber: user.phoneNumber };
  }

  async verifyMFA(userId: string, code: string, secret?: string): Promise<void> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    let mfaSecret = secret || user.mfaSecret;
    if (!mfaSecret) {
      // Get from temporary storage
      const tempSecret = await redis.get(`mfa_setup:${userId}`);
      if (!tempSecret) {
        throw new Error('MFA setup not found or expired');
      }
      mfaSecret = tempSecret;
    }

    const isValid = authenticator.verify({ token: code, secret: mfaSecret });
    if (!isValid) {
      throw new UnauthorizedError('Invalid MFA code');
    }

    // Enable MFA and store secret
    if (!user.mfaEnabled) {
      await this.userService.update(userId, {
        mfaEnabled: true,
        mfaSecret: mfaSecret,
      });
      await redis.del(`mfa_setup:${userId}`);
    }
  }

  async getOAuthUrl(provider: string): Promise<string> {
    // Implementation for OAuth providers
    const redirectUri = process.env.OAUTH_REDIRECT_URI || '';
    
    if (provider === 'google') {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const scope = 'openid email profile';
      return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
    }
    
    if (provider === 'microsoft') {
      const clientId = process.env.MICROSOFT_CLIENT_ID;
      const scope = 'openid email profile';
      return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
    }

    throw new Error(`Unsupported OAuth provider: ${provider}`);
  }

  async handleOAuthCallback(
    provider: string,
    code: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // Exchange code for tokens and create/update user
    // This is a simplified version - full implementation would exchange tokens
    throw new Error('OAuth callback not fully implemented');
  }

  private async generateTokens(user: User): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
      permissions: user.permissions,
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    });

    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });

    // Store refresh token in Redis
    await redis.setex(
      `refresh_token:${refreshToken}`,
      7 * 24 * 60 * 60, // 7 days
      user.id
    );

    return { accessToken, refreshToken };
  }

  private async verifyMFACode(secret: string, code: string): Promise<boolean> {
    return authenticator.verify({ token: code, secret });
  }

  private getDefaultPermissions(role: UserRole): Permission[] {
    const rolePermissions: Record<UserRole, Permission[]> = {
      [UserRole.SUPER_ADMIN]: Object.values(Permission),
      [UserRole.SCHOOL_ADMIN]: [
        Permission.USER_CREATE,
        Permission.USER_READ,
        Permission.USER_UPDATE,
        Permission.SCHOOL_READ,
        Permission.SCHOOL_UPDATE,
        Permission.ATTENDANCE_READ,
        Permission.GRADE_READ,
        Permission.MESSAGE_SEND,
        Permission.ANNOUNCEMENT_CREATE,
        Permission.ANALYTICS_READ,
        Permission.REPORT_GENERATE,
      ],
      [UserRole.TEACHER]: [
        Permission.ATTENDANCE_CREATE,
        Permission.ATTENDANCE_READ,
        Permission.ATTENDANCE_UPDATE,
        Permission.GRADE_CREATE,
        Permission.GRADE_READ,
        Permission.GRADE_UPDATE,
        Permission.MESSAGE_SEND,
        Permission.MESSAGE_READ,
        Permission.ANNOUNCEMENT_CREATE,
      ],
      [UserRole.PARENT]: [
        Permission.ATTENDANCE_READ,
        Permission.GRADE_READ,
        Permission.MESSAGE_SEND,
        Permission.MESSAGE_READ,
        Permission.PAYMENT_READ,
        Permission.FILE_READ,
      ],
      [UserRole.STUDENT]: [
        Permission.ATTENDANCE_READ,
        Permission.GRADE_READ,
        Permission.MESSAGE_SEND,
        Permission.MESSAGE_READ,
        Permission.FILE_READ,
      ],
    };

    return rolePermissions[role] || [];
  }
}
