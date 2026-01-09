import { User, UserRole, Permission } from '../../shared/types';
import { NotFoundError, ConflictError } from '../../shared/utils/errors';
import logger from '../../shared/utils/logger';
import sequelize from '../../config/database';
import { Op, QueryTypes } from 'sequelize';

// User model (simplified - would use Sequelize models in production)
interface UserModel {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  schoolId?: string;
  permissions: Permission[];
  isActive: boolean;
  isEmailVerified: boolean;
  mfaEnabled: boolean;
  mfaSecret?: string;
  phoneNumber?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class UserService {
  async findById(id: string): Promise<User | null> {
    // In production, this would query the database
    // For now, return a mock structure
    const [user] = await sequelize.query(
      `SELECT * FROM users WHERE id = :id LIMIT 1`,
      {
        replacements: { id },
        type: QueryTypes.SELECT,
      }
    ) as UserModel[];

    return user ? this.mapToUser(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const [user] = await sequelize.query(
      `SELECT * FROM users WHERE email = :email LIMIT 1`,
      {
        replacements: { email },
        type: QueryTypes.SELECT,
      }
    ) as UserModel[];

    return user ? this.mapToUser(user) : null;
  }

  async create(data: Partial<User>): Promise<User> {
    const existingUser = await this.findByEmail(data.email!);
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    const [result] = await sequelize.query(
      `INSERT INTO users (id, email, "passwordHash", "firstName", "lastName", role, "schoolId", permissions, "isActive", "isEmailVerified", "mfaEnabled", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), :email, :passwordHash, :firstName, :lastName, :role, :schoolId, :permissions, :isActive, :isEmailVerified, :mfaEnabled, NOW(), NOW())
       RETURNING *`,
      {
        replacements: {
          email: data.email,
          passwordHash: data.passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role,
          schoolId: data.schoolId || null,
          permissions: JSON.stringify(data.permissions || []),
          isActive: data.isActive ?? true,
          isEmailVerified: data.isEmailVerified ?? false,
          mfaEnabled: data.mfaEnabled ?? false,
        },
        type: QueryTypes.SELECT,
      }
    ) as UserModel[];

    return this.mapToUser(result);
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundError('User', id);
    }

    const updateFields: string[] = [];
    const replacements: any = { id };

    Object.keys(data).forEach((key) => {
      if (data[key as keyof User] !== undefined) {
        if (key === 'permissions') {
          updateFields.push(`permissions = :permissions`);
          replacements.permissions = JSON.stringify(data.permissions);
        } else {
          updateFields.push(`"${key}" = :${key}`);
          replacements[key] = data[key as keyof User];
        }
      }
    });

    updateFields.push('"updatedAt" = NOW()');

    const [result] = await sequelize.query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = :id RETURNING *`,
      {
        replacements,
        type: QueryTypes.SELECT,
      }
    ) as UserModel[];

    return this.mapToUser(result);
  }

  async delete(id: string): Promise<void> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundError('User', id);
    }

    await sequelize.query(`UPDATE users SET "isActive" = false WHERE id = :id`, {
      replacements: { id },
    });

    logger.info(`User ${id} deactivated`);
  }

  async bulkImport(users: Partial<User>[]): Promise<{ success: number; failed: number; errors: any[] }> {
    let success = 0;
    let failed = 0;
    const errors: any[] = [];

    for (const userData of users) {
      try {
        await this.create(userData);
        success++;
      } catch (error: any) {
        failed++;
        errors.push({
          email: userData.email,
          error: error.message,
        });
      }
    }

    return { success, failed, errors };
  }

  async bulkExport(filters: {
    schoolId?: string;
    role?: UserRole;
    isActive?: boolean;
  }): Promise<User[]> {
    const conditions: string[] = [];
    const replacements: any = {};

    if (filters.schoolId) {
      conditions.push('"schoolId" = :schoolId');
      replacements.schoolId = filters.schoolId;
    }

    if (filters.role) {
      conditions.push('role = :role');
      replacements.role = filters.role;
    }

    if (filters.isActive !== undefined) {
      conditions.push('"isActive" = :isActive');
      replacements.isActive = filters.isActive;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const users = await sequelize.query(
      `SELECT * FROM users ${whereClause} ORDER BY "createdAt" DESC`,
      {
        replacements,
        type: QueryTypes.SELECT,
      }
    ) as UserModel[];

    return users.map((u) => this.mapToUser(u));
  }

  async updateLastLogin(id: string): Promise<void> {
    await sequelize.query(
      `UPDATE users SET "lastLoginAt" = NOW() WHERE id = :id`,
      {
        replacements: { id },
      }
    );
  }

  private mapToUser(model: UserModel): User {
    return {
      id: model.id,
      email: model.email,
      passwordHash: model.passwordHash,
      firstName: model.firstName,
      lastName: model.lastName,
      role: model.role,
      schoolId: model.schoolId,
      permissions: Array.isArray(model.permissions)
        ? model.permissions
        : JSON.parse(model.permissions as any),
      isActive: model.isActive,
      isEmailVerified: model.isEmailVerified,
      mfaEnabled: model.mfaEnabled,
      mfaSecret: model.mfaSecret,
      lastLoginAt: model.lastLoginAt,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }
}
