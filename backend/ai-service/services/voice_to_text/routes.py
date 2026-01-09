from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from services.voice_to_text.service import VoiceToTextService
from utils.auth import require_auth
from config import Config
import os
import logging

logger = logging.getLogger(__name__)

voice_to_text_bp = Blueprint('voice_to_text', __name__)
service = VoiceToTextService()

ALLOWED_EXTENSIONS = {'wav', 'mp3', 'm4a', 'flac', 'ogg'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@voice_to_text_bp.route('/transcribe', methods=['POST'])
@require_auth
def transcribe():
    """Transcribe audio to text"""
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400
        
        file = request.files['audio']
        method = request.form.get('method', 'whisper')
        language = request.form.get('language', 'en')
        
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filepath = os.path.join(Config.UPLOAD_FOLDER, filename)
            os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
            file.save(filepath)
            
            result = service.transcribe_audio(filepath, method, language)
            
            # Clean up
            os.remove(filepath)
            
            return jsonify({
                'success': True,
                'transcription': result
            }), 200
        
        return jsonify({'error': 'Invalid file type'}), 400
        
    except Exception as e:
        logger.error(f"Error in transcribe: {str(e)}")
        return jsonify({'error': str(e)}), 500

@voice_to_text_bp.route('/meeting', methods=['POST'])
@require_auth
def transcribe_meeting():
    """Transcribe meeting with speaker identification"""
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400
        
        file = request.files['audio']
        speakers = request.form.get('speakers', '').split(',') if request.form.get('speakers') else None
        
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filepath = os.path.join(Config.UPLOAD_FOLDER, filename)
            os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
            file.save(filepath)
            
            result = service.transcribe_meeting(filepath, speakers)
            
            # Clean up
            os.remove(filepath)
            
            return jsonify({
                'success': True,
                'meeting_transcription': result
            }), 200
        
        return jsonify({'error': 'Invalid file type'}), 400
        
    except Exception as e:
        logger.error(f"Error in transcribe_meeting: {str(e)}")
        return jsonify({'error': str(e)}), 500
