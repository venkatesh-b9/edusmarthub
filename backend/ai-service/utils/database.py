from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from sqlalchemy.ext.declarative import declarative_base
from pymongo import MongoClient
import redis
from config import Config

# PostgreSQL
engine = create_engine(
    f"postgresql://{Config.POSTGRES_USER}:{Config.POSTGRES_PASSWORD}@"
    f"{Config.POSTGRES_HOST}:{Config.POSTGRES_PORT}/{Config.POSTGRES_DB}",
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True
)

SessionLocal = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine))
Base = declarative_base()

# MongoDB
mongo_client = MongoClient(Config.MONGODB_URI)
mongo_db = mongo_client[Config.MONGODB_URI.split('/')[-1].split('?')[0]]

# Redis
redis_client = redis.Redis(
    host=Config.REDIS_HOST,
    port=Config.REDIS_PORT,
    db=Config.REDIS_DB,
    decode_responses=True
)

def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_mongo_db():
    """Get MongoDB database"""
    return mongo_db

def get_redis():
    """Get Redis client"""
    return redis_client
