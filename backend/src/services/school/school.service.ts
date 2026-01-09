import { School } from '../../shared/types';
import { NotFoundError, ConflictError } from '../../shared/utils/errors';
import logger from '../../shared/utils/logger';
import sequelize from '../../config/database';

export class SchoolService {
  async findById(id: string): Promise<School | null> {
    const [school] = await sequelize.query(
      `SELECT * FROM schools WHERE id = :id LIMIT 1`,
      {
        replacements: { id },
        type: sequelize.QueryTypes.SELECT,
      }
    ) as School[];

    return school || null;
  }

  async findBySubdomain(subdomain: string): Promise<School | null> {
    const [school] = await sequelize.query(
      `SELECT * FROM schools WHERE subdomain = :subdomain LIMIT 1`,
      {
        replacements: { subdomain },
        type: sequelize.QueryTypes.SELECT,
      }
    ) as School[];

    return school || null;
  }

  async create(data: Partial<School>): Promise<School> {
    // Check if subdomain exists
    if (data.subdomain) {
      const existing = await this.findBySubdomain(data.subdomain);
      if (existing) {
        throw new ConflictError('School with this subdomain already exists');
      }
    }

    const [result] = await sequelize.query(
      `INSERT INTO schools (id, name, code, subdomain, address, city, state, country, "postalCode", phone, email, branding, settings, "isActive", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), :name, :code, :subdomain, :address, :city, :state, :country, :postalCode, :phone, :email, :branding, :settings, :isActive, NOW(), NOW())
       RETURNING *`,
      {
        replacements: {
          name: data.name,
          code: data.code,
          subdomain: data.subdomain,
          address: data.address,
          city: data.city,
          state: data.state,
          country: data.country,
          postalCode: data.postalCode,
          phone: data.phone,
          email: data.email,
          branding: JSON.stringify(data.branding || {}),
          settings: JSON.stringify(data.settings || {}),
          isActive: data.isActive ?? true,
        },
        type: sequelize.QueryTypes.SELECT,
      }
    ) as School[];

    // Create schema for multi-tenant isolation
    await this.createTenantSchema(result.id);

    logger.info(`School ${result.name} created with schema ${result.id}`);
    return result;
  }

  async update(id: string, data: Partial<School>): Promise<School> {
    const school = await this.findById(id);
    if (!school) {
      throw new NotFoundError('School', id);
    }

    const updateFields: string[] = [];
    const replacements: any = { id };

    Object.keys(data).forEach((key) => {
      if (data[key as keyof School] !== undefined && key !== 'id') {
        if (key === 'branding' || key === 'settings') {
          updateFields.push(`"${key}" = :${key}`);
          replacements[key] = JSON.stringify(data[key as keyof School]);
        } else {
          updateFields.push(`"${key}" = :${key}`);
          replacements[key] = data[key as keyof School];
        }
      }
    });

    updateFields.push('"updatedAt" = NOW()');

    const [result] = await sequelize.query(
      `UPDATE schools SET ${updateFields.join(', ')} WHERE id = :id RETURNING *`,
      {
        replacements,
        type: sequelize.QueryTypes.SELECT,
      }
    ) as School[];

    return result;
  }

  async getAll(): Promise<School[]> {
    const schools = await sequelize.query(
      `SELECT * FROM schools WHERE "isActive" = true ORDER BY "createdAt" DESC`,
      {
        type: sequelize.QueryTypes.SELECT,
      }
    ) as School[];

    return schools;
  }

  private async createTenantSchema(schoolId: string): Promise<void> {
    // Create isolated schema for multi-tenant data
    const schemaName = `school_${schoolId.replace(/-/g, '_')}`;
    
    await sequelize.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);
    
    // Create tables in tenant schema
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.classes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        section VARCHAR(50),
        grade VARCHAR(50),
        "academicYear" VARCHAR(50),
        "teacherId" UUID,
        capacity INTEGER,
        "currentEnrollment" INTEGER DEFAULT 0,
        subjects JSONB,
        schedule JSONB,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);

    logger.info(`Created tenant schema: ${schemaName}`);
  }

  async getTenantSchema(schoolId: string): Promise<string> {
    return `school_${schoolId.replace(/-/g, '_')}`;
  }
}
