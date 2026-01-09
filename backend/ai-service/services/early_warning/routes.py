from flask import Blueprint, request, jsonify
from services.early_warning.service import EarlyWarningService
from utils.auth import require_auth
import logging

logger = logging.getLogger(__name__)

early_warning_bp = Blueprint('early_warning', __name__)
service = EarlyWarningService()

@early_warning_bp.route('/assess', methods=['POST'])
@require_auth
def assess_student():
    """Assess individual student risk"""
    try:
        data = request.json
        student_data = data.get('student_data')
        
        if not student_data:
            return jsonify({'error': 'student_data is required'}), 400
        
        result = service.calculate_risk_score(student_data)
        
        return jsonify({
            'success': True,
            'assessment': result
        }), 200
        
    except Exception as e:
        logger.error(f"Error in assess_student: {str(e)}")
        return jsonify({'error': str(e)}), 500

@early_warning_bp.route('/detect-batch', methods=['POST'])
@require_auth
def detect_at_risk():
    """Detect at-risk students from batch"""
    try:
        data = request.json
        students_data = data.get('students_data')
        
        if not students_data:
            return jsonify({'error': 'students_data is required'}), 400
        
        results = service.detect_at_risk_students(students_data)
        
        return jsonify({
            'success': True,
            'at_risk_students': results,
            'total_assessed': len(results),
            'high_risk_count': sum(1 for r in results if r['risk_level'] == 'high')
        }), 200
        
    except Exception as e:
        logger.error(f"Error in detect_at_risk: {str(e)}")
        return jsonify({'error': str(e)}), 500

@early_warning_bp.route('/train', methods=['POST'])
@require_auth
def train_model():
    """Train early warning model"""
    try:
        data = request.json
        training_data = data.get('training_data')
        
        if not training_data:
            return jsonify({'error': 'training_data is required'}), 400
        
        result = service.train_anomaly_detector(training_data)
        
        return jsonify({
            'success': True,
            'training_result': result
        }), 200
        
    except Exception as e:
        logger.error(f"Error in train_model: {str(e)}")
        return jsonify({'error': str(e)}), 500
