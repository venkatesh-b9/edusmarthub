from flask import Blueprint, request, jsonify
from services.learning_path.service import LearningPathService
from utils.auth import require_auth
import logging

logger = logging.getLogger(__name__)

learning_path_bp = Blueprint('learning_path', __name__)
service = LearningPathService()

@learning_path_bp.route('/recommend', methods=['POST'])
@require_auth
def recommend_path():
    """Recommend learning path for student"""
    try:
        data = request.json
        student_profile = data.get('student_profile')
        available_resources = data.get('available_resources', [])
        
        if not student_profile:
            return jsonify({'error': 'student_profile is required'}), 400
        
        result = service.recommend_learning_path(student_profile, available_resources)
        
        return jsonify({
            'success': True,
            'recommendation': result
        }), 200
        
    except Exception as e:
        logger.error(f"Error in recommend_path: {str(e)}")
        return jsonify({'error': str(e)}), 500
