from flask import Blueprint, request, jsonify
from services.model_management.service import ModelManagementService
from utils.auth import require_auth
import logging

logger = logging.getLogger(__name__)

model_management_bp = Blueprint('model_management', __name__)
service = ModelManagementService()

@model_management_bp.route('/train', methods=['POST'])
@require_auth
def train_model():
    """Train model with versioning"""
    try:
        data = request.json
        model_type = data.get('model_type')
        training_data = data.get('training_data', [])
        parameters = data.get('parameters', {})
        experiment_name = data.get('experiment_name')
        
        if not model_type or not training_data:
            return jsonify({'error': 'model_type and training_data are required'}), 400
        
        result = service.train_model(model_type, training_data, parameters, experiment_name)
        
        return jsonify({
            'success': True,
            'training_result': result
        }), 200
        
    except Exception as e:
        logger.error(f"Error in train_model: {str(e)}")
        return jsonify({'error': str(e)}), 500

@model_management_bp.route('/bias-detection', methods=['POST'])
@require_auth
def detect_bias():
    """Detect bias in model"""
    try:
        data = request.json
        # This would require model loading from MLflow
        # Simplified for now
        return jsonify({
            'success': True,
            'message': 'Bias detection endpoint - requires model loading implementation'
        }), 200
        
    except Exception as e:
        logger.error(f"Error in detect_bias: {str(e)}")
        return jsonify({'error': str(e)}), 500

@model_management_bp.route('/explain', methods=['POST'])
@require_auth
def explain_prediction():
    """Explain model prediction"""
    try:
        data = request.json
        # This would require model loading from MLflow
        # Simplified for now
        return jsonify({
            'success': True,
            'message': 'Explainability endpoint - requires model loading implementation'
        }), 200
        
    except Exception as e:
        logger.error(f"Error in explain_prediction: {str(e)}")
        return jsonify({'error': str(e)}), 500

@model_management_bp.route('/ab-test', methods=['POST'])
@require_auth
def ab_test():
    """A/B test two model versions"""
    try:
        data = request.json
        # This would require model loading from MLflow
        # Simplified for now
        return jsonify({
            'success': True,
            'message': 'A/B testing endpoint - requires model loading implementation'
        }), 200
        
    except Exception as e:
        logger.error(f"Error in ab_test: {str(e)}")
        return jsonify({'error': str(e)}), 500

@model_management_bp.route('/versions/<experiment_name>', methods=['GET'])
@require_auth
def get_versions(experiment_name):
    """Get model versions"""
    try:
        versions = service.get_model_versions(experiment_name)
        
        return jsonify({
            'success': True,
            'versions': versions
        }), 200
        
    except Exception as e:
        logger.error(f"Error in get_versions: {str(e)}")
        return jsonify({'error': str(e)}), 500
