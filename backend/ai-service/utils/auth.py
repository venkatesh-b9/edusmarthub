from functools import wraps
from flask import request, jsonify
import requests
from config import Config
import logging

logger = logging.getLogger(__name__)

def require_auth(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return jsonify({'error': 'Authorization header required'}), 401
        
        # Verify token with main backend
        try:
            response = requests.get(
                f"{Config.BACKEND_API_URL}/api/v1/auth/verify",
                headers={'Authorization': auth_header},
                timeout=5
            )
            
            if response.status_code != 200:
                return jsonify({'error': 'Invalid token'}), 401
            
            # Add user info to request context
            user_data = response.json().get('data', {})
            request.user = user_data
            
        except Exception as e:
            logger.error(f"Auth verification error: {str(e)}")
            return jsonify({'error': 'Authentication failed'}), 401
        
        return f(*args, **kwargs)
    
    return decorated_function
