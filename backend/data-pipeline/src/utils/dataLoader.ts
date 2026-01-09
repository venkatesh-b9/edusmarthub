import { Sequelize } from 'sequelize';
import mongoose from 'mongoose';
import { config } from '../config';
import logger from './logger';

export class DataLoader {
  private sequelize: Sequelize;
  private mongoConnection: typeof mongoose | null = null;

  constructor() {
    this.sequelize = new Sequelize(
      config.database.postgres.database,
      config.database.postgres.user,
      config.database.postgres.password,
      {
        host: config.database.postgres.host,
        port: config.database.postgres.port,
        dialect: 'postgres',
        logging: false,
      }
    );
  }

  async initialize(): Promise<void> {
    try {
      await this.sequelize.authenticate();
      await mongoose.connect(config.database.mongodb.uri);
      this.mongoConnection = mongoose;
      logger.info('Data loader initialized');
    } catch (error) {
      logger.error(`Data loader initialization error: ${error}`);
      throw error;
    }
  }

  async load(data: any, destination: string): Promise<void> {
    try {
      switch (destination) {
        case 'analytics':
          await this.loadToAnalytics(data);
          break;
        case 'postgres':
          await this.loadToPostgres(data);
          break;
        case 'mongodb':
          await this.loadToMongoDB(data);
          break;
        default:
          logger.warn(`Unknown destination: ${destination}`);
      }
    } catch (error: any) {
      logger.error(`Error loading data to ${destination}: ${error.message}`);
      throw error;
    }
  }

  private async loadToAnalytics(data: any): Promise<void> {
    // Load to MongoDB for analytics
    if (!this.mongoConnection) {
      await this.initialize();
    }

    const AnalyticsModel = this.mongoConnection!.model('Analytics', new mongoose.Schema({}, { strict: false }));
    await AnalyticsModel.create({
      ...data,
      loadedAt: new Date(),
    });
  }

  private async loadToPostgres(data: any): Promise<void> {
    // Load to PostgreSQL
    const tableName = this.getTableName(data._type || 'unknown');
    
    await this.sequelize.query(
      `INSERT INTO ${tableName} (data, created_at) VALUES (:data, NOW())
       ON CONFLICT DO NOTHING`,
      {
        replacements: { data: JSON.stringify(data) },
      }
    );
  }

  private async loadToMongoDB(data: any): Promise<void> {
    if (!this.mongoConnection) {
      await this.initialize();
    }

    const collectionName = this.getCollectionName(data._type || 'unknown');
    const db = this.mongoConnection!.connection.db;
    const collection = db!.collection(collectionName);
    
    await collection.insertOne({
      ...data,
      loadedAt: new Date(),
    });
  }

  private getTableName(type: string): string {
    const tableMap: Record<string, string> = {
      attendance: 'analytics_attendance',
      grade: 'analytics_grades',
      user: 'analytics_users',
    };
    return tableMap[type] || 'analytics_data';
  }

  private getCollectionName(type: string): string {
    return type.toLowerCase().replace(/[^a-z0-9]/g, '_');
  }

  async cleanup(): Promise<void> {
    await this.sequelize.close();
    if (this.mongoConnection) {
      await this.mongoConnection.disconnect();
    }
  }
}
