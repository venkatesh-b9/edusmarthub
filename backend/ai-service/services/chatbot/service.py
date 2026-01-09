from transformers import pipeline, AutoTokenizer, AutoModelForCausalLM
from sentence_transformers import SentenceTransformer
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import logging

logger = logging.getLogger(__name__)

class ChatbotService:
    def __init__(self):
        self.qa_pipeline = pipeline(
            "question-answering",
            model="distilbert-base-cased-distilled-squad"
        )
        self.sentence_model = SentenceTransformer('all-MiniLM-L6-v2')
        self.knowledge_base = []
        self.conversation_history = {}
    
    def initialize_knowledge_base(self, documents):
        """Initialize knowledge base with documents"""
        self.knowledge_base = []
        for doc in documents:
            embeddings = self.sentence_model.encode(doc.get('content', ''))
            self.knowledge_base.append({
                'id': doc.get('id'),
                'content': doc.get('content'),
                'embeddings': embeddings,
                'metadata': doc.get('metadata', {})
            })
        logger.info(f"Initialized knowledge base with {len(self.knowledge_base)} documents")
    
    def chat(self, user_id, message, context=None):
        """Process chat message and generate response"""
        try:
            # Retrieve relevant context from knowledge base
            relevant_context = self._retrieve_context(message)
            
            # Generate response
            response = self._generate_response(message, relevant_context, context)
            
            # Update conversation history
            if user_id not in self.conversation_history:
                self.conversation_history[user_id] = []
            
            self.conversation_history[user_id].append({
                'user': message,
                'bot': response,
                'timestamp': str(logger.handlers[0].formatter.formatTime(logger.makeRecord('', 0, '', 0, '', (), None)) if logger.handlers else '')
            })
            
            return {
                'response': response,
                'confidence': self._calculate_confidence(message, relevant_context),
                'sources': [ctx.get('metadata', {}) for ctx in relevant_context[:3]]
            }
            
        except Exception as e:
            logger.error(f"Error in chat: {str(e)}")
            raise
    
    def _retrieve_context(self, query, top_k=5):
        """Retrieve relevant context from knowledge base"""
        if not self.knowledge_base:
            return []
        
        query_embedding = self.sentence_model.encode(query)
        
        similarities = []
        for doc in self.knowledge_base:
            similarity = cosine_similarity(
                query_embedding.reshape(1, -1),
                doc['embeddings'].reshape(1, -1)
            )[0][0]
            similarities.append((doc, similarity))
        
        # Sort by similarity and return top k
        similarities.sort(key=lambda x: x[1], reverse=True)
        return [doc for doc, _ in similarities[:top_k]]
    
    def _generate_response(self, message, context, additional_context):
        """Generate response using QA pipeline"""
        # Combine context
        context_text = ' '.join([doc['content'] for doc in context])
        
        if additional_context:
            context_text += ' ' + str(additional_context)
        
        if not context_text:
            # Fallback response
            return self._generate_fallback_response(message)
        
        # Use QA pipeline
        try:
            result = self.qa_pipeline({
                'question': message,
                'context': context_text[:512]  # Limit context length
            })
            return result['answer']
        except Exception as e:
            logger.warning(f"QA pipeline error: {str(e)}")
            return self._generate_fallback_response(message)
    
    def _generate_fallback_response(self, message):
        """Generate fallback response"""
        fallback_responses = [
            "I'm sorry, I don't have enough information to answer that. Could you provide more details?",
            "That's an interesting question. Let me connect you with a human representative who can help.",
            "I'm still learning. Could you rephrase your question?"
        ]
        return fallback_responses[0]  # Simple fallback
    
    def _calculate_confidence(self, query, context):
        """Calculate confidence in response"""
        if not context:
            return 0.0
        
        # Average similarity of retrieved context
        avg_similarity = sum(
            cosine_similarity(
                self.sentence_model.encode(query).reshape(1, -1),
                ctx['embeddings'].reshape(1, -1)
            )[0][0] for ctx in context
        ) / len(context) if context else 0
        
        return float(avg_similarity)
    
    def get_conversation_history(self, user_id, limit=10):
        """Get conversation history for user"""
        if user_id not in self.conversation_history:
            return []
        
        return self.conversation_history[user_id][-limit:]
