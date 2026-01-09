from flask import Blueprint, request, jsonify
from services.anomaly_detection.service import AnomalyDetectionService
from utils.auth import require_auth
import logging

logger = logging.getLogger(__name__)

anomaly_bp = Blueprint('anomaly', __name__)
service = AnomalyDetectionService()

@anomaly_bp.route('/attendance', methods=['POST'])
@require_auth
def detect_attendance_anomalies():
    """Detect attendance pattern anomalies"""
    try:
        data = request.json
        attendance_data = data.get('attendance_data', [])
        school_id = data.get('school_id')
        
        if not attendance_data:
            return jsonify({'error': 'attendance_data is required'}), 400
        
        result = service.detect_attendance_anomalies(attendance_data, school_id)
        
        return jsonify({
            'success': True,
            'anomaly_detection': result
        }), 200
        
    except Exception as e:
        logger.error(f"Error in detect_attendance_anomalies: {str(e)}")
        return jsonify({'error': str(e)}), 500

@anomaly_bp.route('/grades', methods=['POST'])
@require_auth
def detect_grade_anomalies():
    """Detect grade pattern anomalies"""
    try:
        data = request.json
        grade_data = data.get('grade_data', [])
        
        if not grade_data:
            return jsonify({'error': 'grade_data is required'}), 400
        
        result = service.detect_grade_anomalies(grade_data)
        
        return jsonify({
            'success': True,
            'anomaly_detection': result
        }), 200
        
    except Exception as e:
        logger.error(f"Error in detect_grade_anomalies: {str(e)}")
        return jsonify({'error': str(e)}), 500
