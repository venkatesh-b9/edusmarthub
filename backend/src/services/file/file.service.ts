import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { FileUpload } from '../../shared/types';
import logger from '../../shared/utils/logger';
import sequelize from '../../config/database';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'edusmarthub-uploads';

export class FileService {
  async uploadFile(
    file: Express.Multer.File,
    uploadedBy: string,
    schoolId: string,
    metadata?: Record<string, any>
  ): Promise<FileUpload> {
    const fileId = uuidv4();
    const fileExtension = file.originalname.split('.').pop();
    const s3Key = `${schoolId}/${fileId}.${fileExtension}`;

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: metadata || {},
    });

    await s3Client.send(command);

    // Save file record
    const [result] = await sequelize.query(
      `INSERT INTO file_uploads (id, "schoolId", "uploadedBy", "fileName", "originalName", "mimeType", size, url, "s3Key", bucket, version, "isPublic", metadata, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), :schoolId, :uploadedBy, :fileName, :originalName, :mimeType, :size, :url, :s3Key, :bucket, 1, false, :metadata, NOW(), NOW())
       RETURNING *`,
      {
        replacements: {
          schoolId,
          uploadedBy,
          fileName: `${fileId}.${fileExtension}`,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          url: `https://${BUCKET_NAME}.s3.amazonaws.com/${s3Key}`,
          s3Key,
          bucket: BUCKET_NAME,
          metadata: metadata ? JSON.stringify(metadata) : null,
        },
        type: sequelize.QueryTypes.SELECT,
      }
    ) as FileUpload[];

    logger.info(`File uploaded: ${file.originalname} by ${uploadedBy}`);
    return result;
  }

  async getFileUrl(fileId: string, expiresIn: number = 3600): Promise<string> {
    const [file] = await sequelize.query(
      `SELECT * FROM file_uploads WHERE id = :id LIMIT 1`,
      {
        replacements: { id: fileId },
        type: sequelize.QueryTypes.SELECT,
      }
    ) as FileUpload[];

    if (!file) {
      throw new Error('File not found');
    }

    const command = new GetObjectCommand({
      Bucket: file.bucket,
      Key: file.s3Key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  }

  async deleteFile(fileId: string): Promise<void> {
    const [file] = await sequelize.query(
      `SELECT * FROM file_uploads WHERE id = :id LIMIT 1`,
      {
        replacements: { id: fileId },
        type: sequelize.QueryTypes.SELECT,
      }
    ) as FileUpload[];

    if (!file) {
      throw new Error('File not found');
    }

    // Delete from S3
    const command = new DeleteObjectCommand({
      Bucket: file.bucket,
      Key: file.s3Key,
    });

    await s3Client.send(command);

    // Delete record
    await sequelize.query(`DELETE FROM file_uploads WHERE id = :id`, {
      replacements: { id: fileId },
    });

    logger.info(`File deleted: ${fileId}`);
  }

  async getFilesBySchool(
    schoolId: string,
    filters?: {
      uploadedBy?: string;
      mimeType?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ files: FileUpload[]; total: number }> {
    let query = `SELECT * FROM file_uploads WHERE "schoolId" = :schoolId`;
    const replacements: any = { schoolId };

    if (filters?.uploadedBy) {
      query += ` AND "uploadedBy" = :uploadedBy`;
      replacements.uploadedBy = filters.uploadedBy;
    }

    if (filters?.mimeType) {
      query += ` AND "mimeType" = :mimeType`;
      replacements.mimeType = filters.mimeType;
    }

    query += ` ORDER BY "createdAt" DESC`;

    if (filters?.limit) {
      query += ` LIMIT :limit`;
      replacements.limit = filters.limit;
    }

    if (filters?.offset) {
      query += ` OFFSET :offset`;
      replacements.offset = filters.offset;
    }

    const files = await sequelize.query(query, {
      replacements,
      type: sequelize.QueryTypes.SELECT,
    }) as FileUpload[];

    const [countResult] = await sequelize.query(
      `SELECT COUNT(*) as total FROM file_uploads WHERE "schoolId" = :schoolId`,
      {
        replacements: { schoolId },
        type: sequelize.QueryTypes.SELECT,
      }
    ) as any[];

    return {
      files,
      total: parseInt(countResult?.total || '0'),
    };
  }
}
