from flask import Blueprint, request, jsonify
from services.sentiment_analysis.service import SentimentAnalysisService
from utils.auth import require_auth
import logging

logger = logging.getLogger(__name__)

sentiment_bp = Blueprint('sentiment', __name__)
service = SentimentAnalysisService()

@sentiment_bp.route('/analyze', methods=['POST'])
@require_auth
def analyze_sentiment():
    """Analyze sentiment of text"""
    try:
        data = request.json
        text = data.get('text')
        method = data.get('method', 'ensemble')
        
        if not text:
            return jsonify({'error': 'text is required'}), 400
        
        result = service.analyze_sentiment(text, method)
        
        return jsonify({
            'success': True,
            'sentiment_analysis': result
        }), 200
        
    except Exception as e:
        logger.error(f"Error in analyze_sentiment: {str(e)}")
        return jsonify({'error': str(e)}), 500

@sentiment_bp.route('/analyze-batch', methods=['POST'])
@require_auth
def analyze_batch():
    """Analyze batch of feedback"""
    try:
        data = request.json
        feedback_list = data.get('feedback_list', [])
        
        if not feedback_list:
            return jsonify({'error': 'feedback_list is required'}), 400
        
        result = service.analyze_feedback_batch(feedback_list)
        
        return jsonify({
            'success': True,
            'analysis_result': result
        }), 200
        
    except Exception as e:
        logger.error(f"Error in analyze_batch: {str(e)}")
        return jsonify({'error': str(e)}), 500
