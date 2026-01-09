import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Base configuration"""
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')
    
    # Database
    POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'localhost')
    POSTGRES_PORT = int(os.getenv('POSTGRES_PORT', 5432))
    POSTGRES_USER = os.getenv('POSTGRES_USER', 'postgres')
    POSTGRES_PASSWORD = os.getenv('POSTGRES_PASSWORD', 'postgres')
    POSTGRES_DB = os.getenv('POSTGRES_DB', 'edusmarthub')
    
    MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/edusmarthub')
    
    # Redis
    REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')
    REDIS_PORT = int(os.getenv('REDIS_PORT', 6379))
    REDIS_DB = int(os.getenv('REDIS_DB', 0))
    
    # MLflow
    MLFLOW_TRACKING_URI = os.getenv('MLFLOW_TRACKING_URI', 'http://localhost:5000')
    
    # Model storage
    MODEL_STORAGE_PATH = os.getenv('MODEL_STORAGE_PATH', './models')
    
    # Main backend API
    BACKEND_API_URL = os.getenv('BACKEND_API_URL', 'http://localhost:3000')
    BACKEND_API_KEY = os.getenv('BACKEND_API_KEY', '')
    
    # File uploads
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', './uploads')
    MAX_UPLOAD_SIZE = 50 * 1024 * 1024  # 50MB
    
    # Model training
    TRAINING_BATCH_SIZE = int(os.getenv('TRAINING_BATCH_SIZE', 32))
    TRAINING_EPOCHS = int(os.getenv('TRAINING_EPOCHS', 10))
    
    # A/B Testing
    AB_TEST_ENABLED = os.getenv('AB_TEST_ENABLED', 'true').lower() == 'true'
    
    # Bias detection
    BIAS_DETECTION_ENABLED = os.getenv('BIAS_DETECTION_ENABLED', 'true').lower() == 'true'
    BIAS_THRESHOLD = float(os.getenv('BIAS_THRESHOLD', 0.1))
    
    # Explainable AI
    EXPLAINABLE_AI_ENABLED = os.getenv('EXPLAINABLE_AI_ENABLED', 'true').lower() == 'true'
    
    # External APIs
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
    PLAGIARISM_API_KEY = os.getenv('PLAGIARISM_API_KEY', '')
    
    # Celery
    CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0')
    CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')

class DevelopmentConfig(Config):
    DEBUG = True
    TESTING = False

class ProductionConfig(Config):
    DEBUG = False
    TESTING = False

class TestingConfig(Config):
    DEBUG = True
    TESTING = True
    POSTGRES_DB = 'edusmarthub_test'

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
