from flask import Flask
from flask_cors import CORS
from flask_restful import Api
import os
from dotenv import load_dotenv
import logging
from logging.handlers import RotatingFileHandler

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-change-in-production')
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max file size

# Enable CORS
CORS(app, resources={
    r"/api/*": {
        "origins": os.getenv('ALLOWED_ORIGINS', 'http://localhost:3000').split(','),
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Initialize API
api = Api(app)

# Configure logging
if not os.path.exists('logs'):
    os.mkdir('logs')

file_handler = RotatingFileHandler(
    'logs/ai-service.log',
    maxBytes=10240000,
    backupCount=10
)
file_handler.setFormatter(logging.Formatter(
    '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
))
file_handler.setLevel(logging.INFO)
app.logger.addHandler(file_handler)
app.logger.setLevel(logging.INFO)
app.logger.info('AI Service starting up')

# Import and register routes
from services.performance_prediction.routes import performance_bp
from services.early_warning.routes import early_warning_bp
from services.essay_grading.routes import essay_grading_bp
from services.sentiment_analysis.routes import sentiment_bp
from services.learning_path.routes import learning_path_bp
from services.anomaly_detection.routes import anomaly_bp
from services.resource_optimization.routes import resource_optimization_bp
from services.chatbot.routes import chatbot_bp
from services.image_recognition.routes import image_recognition_bp
from services.voice_to_text.routes import voice_to_text_bp
from services.model_management.routes import model_management_bp
from services.timetable_generation.routes import timetable_bp

# Register blueprints
app.register_blueprint(performance_bp, url_prefix='/api/v1/ai/performance')
app.register_blueprint(early_warning_bp, url_prefix='/api/v1/ai/early-warning')
app.register_blueprint(essay_grading_bp, url_prefix='/api/v1/ai/essay-grading')
app.register_blueprint(sentiment_bp, url_prefix='/api/v1/ai/sentiment')
app.register_blueprint(learning_path_bp, url_prefix='/api/v1/ai/learning-path')
app.register_blueprint(anomaly_bp, url_prefix='/api/v1/ai/anomaly')
app.register_blueprint(resource_optimization_bp, url_prefix='/api/v1/ai/resource-optimization')
app.register_blueprint(chatbot_bp, url_prefix='/api/v1/ai/chatbot')
app.register_blueprint(image_recognition_bp, url_prefix='/api/v1/ai/image')
app.register_blueprint(voice_to_text_bp, url_prefix='/api/v1/ai/voice')
app.register_blueprint(model_management_bp, url_prefix='/api/v1/ai/models')
app.register_blueprint(timetable_bp, url_prefix='/api/v1/ai/timetable')

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    return {
        'status': 'healthy',
        'service': 'ai-service',
        'version': '1.0.0'
    }, 200

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return {'error': 'Not found'}, 404

@app.errorhandler(500)
def internal_error(error):
    app.logger.error(f'Server Error: {error}')
    return {'error': 'Internal server error'}, 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug)
