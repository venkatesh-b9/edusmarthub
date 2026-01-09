from flask import Blueprint, request, jsonify
from services.essay_grading.service import EssayGradingService
from utils.auth import require_auth
import logging

logger = logging.getLogger(__name__)

essay_grading_bp = Blueprint('essay_grading', __name__)
service = EssayGradingService()

@essay_grading_bp.route('/grade', methods=['POST'])
@require_auth
def grade_essay():
    """Grade an essay"""
    try:
        data = request.json
        essay_text = data.get('essay_text')
        rubric = data.get('rubric')
        max_score = data.get('max_score', 100)
        
        if not essay_text:
            return jsonify({'error': 'essay_text is required'}), 400
        
        result = service.grade_essay(essay_text, rubric, max_score)
        
        return jsonify({
            'success': True,
            'grading_result': result
        }), 200
        
    except Exception as e:
        logger.error(f"Error in grade_essay: {str(e)}")
        return jsonify({'error': str(e)}), 500

@essay_grading_bp.route('/plagiarism', methods=['POST'])
@require_auth
def check_plagiarism():
    """Check essay for plagiarism"""
    try:
        data = request.json
        essay_text = data.get('essay_text')
        reference_texts = data.get('reference_texts', [])
        
        if not essay_text:
            return jsonify({'error': 'essay_text is required'}), 400
        
        result = service.check_plagiarism(essay_text, reference_texts)
        
        return jsonify({
            'success': True,
            'plagiarism_result': result
        }), 200
        
    except Exception as e:
        logger.error(f"Error in check_plagiarism: {str(e)}")
        return jsonify({'error': str(e)}), 500
