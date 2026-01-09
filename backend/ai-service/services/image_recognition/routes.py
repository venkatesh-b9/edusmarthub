from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from services.image_recognition.service import ImageRecognitionService
from utils.auth import require_auth
from config import Config
import os
import logging

logger = logging.getLogger(__name__)

image_recognition_bp = Blueprint('image_recognition', __name__)
service = ImageRecognitionService()

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@image_recognition_bp.route('/register-face', methods=['POST'])
@require_auth
def register_face():
    """Register face for recognition"""
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        student_id = request.form.get('student_id')
        
        if not student_id:
            return jsonify({'error': 'student_id is required'}), 400
        
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filepath = os.path.join(Config.UPLOAD_FOLDER, filename)
            os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
            file.save(filepath)
            
            service.register_face(student_id, filepath)
            
            # Clean up
            os.remove(filepath)
            
            return jsonify({
                'success': True,
                'message': f'Face registered for student {student_id}'
            }), 200
        
        return jsonify({'error': 'Invalid file type'}), 400
        
    except Exception as e:
        logger.error(f"Error in register_face: {str(e)}")
        return jsonify({'error': str(e)}), 500

@image_recognition_bp.route('/recognize', methods=['POST'])
@require_auth
def recognize():
    """Recognize faces in image"""
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filepath = os.path.join(Config.UPLOAD_FOLDER, filename)
            os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
            file.save(filepath)
            
            result = service.recognize_face(filepath)
            
            # Clean up
            os.remove(filepath)
            
            return jsonify({
                'success': True,
                'recognition_result': result
            }), 200
        
        return jsonify({'error': 'Invalid file type'}), 400
        
    except Exception as e:
        logger.error(f"Error in recognize: {str(e)}")
        return jsonify({'error': str(e)}), 500

@image_recognition_bp.route('/attendance', methods=['POST'])
@require_auth
def process_attendance():
    """Process image for attendance"""
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        class_id = request.form.get('class_id')
        
        if not class_id:
            return jsonify({'error': 'class_id is required'}), 400
        
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filepath = os.path.join(Config.UPLOAD_FOLDER, filename)
            os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
            file.save(filepath)
            
            result = service.process_attendance_image(filepath, class_id)
            
            # Clean up
            os.remove(filepath)
            
            return jsonify({
                'success': True,
                'attendance_result': result
            }), 200
        
        return jsonify({'error': 'Invalid file type'}), 400
        
    except Exception as e:
        logger.error(f"Error in process_attendance: {str(e)}")
        return jsonify({'error': str(e)}), 500
