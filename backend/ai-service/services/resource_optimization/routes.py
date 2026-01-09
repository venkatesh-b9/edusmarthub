from flask import Blueprint, request, jsonify
from services.resource_optimization.service import ResourceOptimizationService
from utils.auth import require_auth
import logging

logger = logging.getLogger(__name__)

resource_optimization_bp = Blueprint('resource_optimization', __name__)
service = ResourceOptimizationService()

@resource_optimization_bp.route('/class-sizes', methods=['POST'])
@require_auth
def optimize_class_sizes():
    """Optimize class sizes"""
    try:
        data = request.json
        historical_data = data.get('historical_data', [])
        constraints = data.get('constraints', {})
        
        if not historical_data:
            return jsonify({'error': 'historical_data is required'}), 400
        
        result = service.optimize_class_sizes(historical_data, constraints)
        
        return jsonify({
            'success': True,
            'optimization_result': result
        }), 200
        
    except Exception as e:
        logger.error(f"Error in optimize_class_sizes: {str(e)}")
        return jsonify({'error': str(e)}), 500

@resource_optimization_bp.route('/predict-needs', methods=['POST'])
@require_auth
def predict_resource_needs():
    """Predict future resource needs"""
    try:
        data = request.json
        school_data = data.get('school_data', {})
        forecast_period = data.get('forecast_period_days', 90)
        
        result = service.predict_resource_needs(school_data, forecast_period)
        
        return jsonify({
            'success': True,
            'prediction': result
        }), 200
        
    except Exception as e:
        logger.error(f"Error in predict_resource_needs: {str(e)}")
        return jsonify({'error': str(e)}), 500
