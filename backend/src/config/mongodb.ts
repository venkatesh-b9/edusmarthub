import mongoose from 'mongoose';
import logger from '../shared/utils/logger';

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/edusmarthub';

export const connectMongoDB = async (): Promise<void> => {
  try {
    await mongoose.connect(mongoUri);
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    throw error;
  }
};

export const disconnectMongoDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');
  } catch (error) {
    logger.error('Error disconnecting MongoDB:', error);
    throw error;
  }
};

export default mongoose;
