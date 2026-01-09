from flask import Blueprint, request, jsonify
from services.chatbot.service import ChatbotService
from utils.auth import require_auth
import logging

logger = logging.getLogger(__name__)

chatbot_bp = Blueprint('chatbot', __name__)
service = ChatbotService()

@chatbot_bp.route('/chat', methods=['POST'])
@require_auth
def chat():
    """Chat with AI assistant"""
    try:
        data = request.json
        user_id = data.get('user_id') or request.user.get('userId', 'anonymous')
        message = data.get('message')
        context = data.get('context')
        
        if not message:
            return jsonify({'error': 'message is required'}), 400
        
        result = service.chat(user_id, message, context)
        
        return jsonify({
            'success': True,
            'chat_response': result
        }), 200
        
    except Exception as e:
        logger.error(f"Error in chat: {str(e)}")
        return jsonify({'error': str(e)}), 500

@chatbot_bp.route('/initialize', methods=['POST'])
@require_auth
def initialize():
    """Initialize chatbot knowledge base"""
    try:
        data = request.json
        documents = data.get('documents', [])
        
        service.initialize_knowledge_base(documents)
        
        return jsonify({
            'success': True,
            'message': f'Knowledge base initialized with {len(documents)} documents'
        }), 200
        
    except Exception as e:
        logger.error(f"Error in initialize: {str(e)}")
        return jsonify({'error': str(e)}), 500

@chatbot_bp.route('/history/<user_id>', methods=['GET'])
@require_auth
def get_history(user_id):
    """Get conversation history"""
    try:
        limit = request.args.get('limit', 10, type=int)
        history = service.get_conversation_history(user_id, limit)
        
        return jsonify({
            'success': True,
            'history': history
        }), 200
        
    except Exception as e:
        logger.error(f"Error in get_history: {str(e)}")
        return jsonify({'error': str(e)}), 500
