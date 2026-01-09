from flask import Blueprint, request, jsonify
from services.performance_prediction.service import PerformancePredictionService
from utils.auth import require_auth
import logging

logger = logging.getLogger(__name__)

performance_bp = Blueprint('performance', __name__)
service = PerformancePredictionService()

@performance_bp.route('/predict', methods=['POST'])
@require_auth
def predict_performance():
    """Predict student performance"""
    try:
        data = request.json
        student_id = data.get('student_id')
        student_data = data.get('student_data')
        
        if not student_data:
            return jsonify({'error': 'student_data is required'}), 400
        
        result = service.predict(student_data)
        
        return jsonify({
            'success': True,
            'student_id': student_id,
            'prediction': result
        }), 200
        
    except Exception as e:
        logger.error(f"Error in predict_performance: {str(e)}")
        return jsonify({'error': str(e)}), 500

@performance_bp.route('/train', methods=['POST'])
@require_auth
def train_model():
    """Train performance prediction model"""
    try:
        data = request.json
        training_data = data.get('training_data')
        
        if not training_data:
            return jsonify({'error': 'training_data is required'}), 400
        
        result = service.train_model(training_data)
        
        return jsonify({
            'success': True,
            'training_result': result
        }), 200
        
    except Exception as e:
        logger.error(f"Error in train_model: {str(e)}")
        return jsonify({'error': str(e)}), 500

@performance_bp.route('/feature-importance', methods=['GET'])
@require_auth
def get_feature_importance():
    """Get feature importance for explainability"""
    try:
        importance = service.get_feature_importance()
        
        return jsonify({
            'success': True,
            'feature_importance': importance
        }), 200
        
    except Exception as e:
        logger.error(f"Error in get_feature_importance: {str(e)}")
        return jsonify({'error': str(e)}), 500
