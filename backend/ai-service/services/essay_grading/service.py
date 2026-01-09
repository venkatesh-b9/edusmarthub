import re
import difflib
from Levenshtein import distance
import nltk
from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.corpus import stopwords
from textblob import TextBlob
import requests
from transformers import pipeline
import os
from config import Config
import logging

logger = logging.getLogger(__name__)

# Download NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')
try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

class EssayGradingService:
    def __init__(self):
        self.grading_model = None
        self.sentiment_analyzer = pipeline(
            "sentiment-analysis",
            model="distilbert-base-uncased-finetuned-sst-2-english"
        )
        self.load_grading_model()
    
    def load_grading_model(self):
        """Load essay grading model"""
        try:
            # In production, load a fine-tuned model
            # For now, use a rule-based approach with ML enhancements
            self.grading_model = True
        except Exception as e:
            logger.warning(f"Could not load grading model: {str(e)}")
    
    def grade_essay(self, essay_text, rubric=None, max_score=100):
        """Grade an essay with automated scoring"""
        try:
            # Analyze essay components
            analysis = self._analyze_essay(essay_text)
            
            # Calculate scores based on rubric
            scores = self._calculate_scores(analysis, rubric, max_score)
            
            # Overall grade
            total_score = sum(scores.values())
            
            # Generate feedback
            feedback = self._generate_feedback(analysis, scores)
            
            return {
                'total_score': total_score,
                'max_score': max_score,
                'percentage': (total_score / max_score) * 100,
                'scores_by_criteria': scores,
                'feedback': feedback,
                'analysis': {
                    'word_count': analysis['word_count'],
                    'sentence_count': analysis['sentence_count'],
                    'readability_score': analysis['readability_score'],
                    'grammar_score': analysis['grammar_score']
                }
            }
            
        except Exception as e:
            logger.error(f"Error grading essay: {str(e)}")
            raise
    
    def check_plagiarism(self, essay_text, reference_texts=None):
        """Check for plagiarism"""
        try:
            plagiarism_results = []
            
            if reference_texts:
                for ref_text in reference_texts:
                    similarity = self._calculate_similarity(essay_text, ref_text)
                    plagiarism_results.append({
                        'reference_text': ref_text[:100] + '...',
                        'similarity': similarity,
                        'is_plagiarized': similarity > 0.8
                    })
            
            # Check against online sources if API key available
            if Config.PLAGIARISM_API_KEY:
                online_check = self._check_online_plagiarism(essay_text)
                plagiarism_results.extend(online_check)
            
            # Overall plagiarism score
            max_similarity = max([r['similarity'] for r in plagiarism_results], default=0)
            
            return {
                'plagiarism_score': max_similarity,
                'is_plagiarized': max_similarity > 0.8,
                'matches': plagiarism_results,
                'recommendation': 'Review required' if max_similarity > 0.8 else 'Original work'
            }
            
        except Exception as e:
            logger.error(f"Error checking plagiarism: {str(e)}")
            raise
    
    def _analyze_essay(self, text):
        """Analyze essay characteristics"""
        # Word and sentence count
        words = word_tokenize(text.lower())
        sentences = sent_tokenize(text)
        word_count = len([w for w in words if w.isalnum()])
        sentence_count = len(sentences)
        
        # Readability (Flesch Reading Ease approximation)
        avg_sentence_length = word_count / sentence_count if sentence_count > 0 else 0
        avg_word_length = sum(len(w) for w in words) / word_count if word_count > 0 else 0
        readability_score = 206.835 - (1.015 * avg_sentence_length) - (84.6 * avg_word_length / 4.7)
        readability_score = max(0, min(100, readability_score))
        
        # Grammar check (using TextBlob)
        blob = TextBlob(text)
        grammar_score = 100 - len(blob.correct().split()) / max(len(text.split()), 1) * 10
        grammar_score = max(0, min(100, grammar_score))
        
        # Vocabulary diversity
        unique_words = len(set(words))
        vocabulary_diversity = unique_words / word_count if word_count > 0 else 0
        
        return {
            'word_count': word_count,
            'sentence_count': sentence_count,
            'readability_score': readability_score,
            'grammar_score': grammar_score,
            'vocabulary_diversity': vocabulary_diversity,
            'avg_sentence_length': avg_sentence_length
        }
    
    def _calculate_scores(self, analysis, rubric, max_score):
        """Calculate scores based on rubric"""
        if not rubric:
            # Default rubric
            rubric = {
                'content': 0.4,
                'organization': 0.2,
                'language': 0.2,
                'mechanics': 0.2
            }
        
        scores = {}
        
        # Content score (based on length and vocabulary)
        content_score = min(analysis['word_count'] / 500, 1.0) * 100 * rubric.get('content', 0.4)
        scores['content'] = content_score
        
        # Organization score (based on sentence structure)
        org_score = min(analysis['sentence_count'] / 10, 1.0) * 100 * rubric.get('organization', 0.2)
        scores['organization'] = org_score
        
        # Language score (based on vocabulary and grammar)
        lang_score = (analysis['vocabulary_diversity'] * 50 + analysis['grammar_score'] * 0.5) * rubric.get('language', 0.2)
        scores['language'] = lang_score
        
        # Mechanics score (grammar and readability)
        mech_score = (analysis['grammar_score'] * 0.6 + analysis['readability_score'] * 0.4) * rubric.get('mechanics', 0.2)
        scores['mechanics'] = mech_score
        
        return scores
    
    def _generate_feedback(self, analysis, scores):
        """Generate feedback for the essay"""
        feedback = []
        
        if analysis['word_count'] < 300:
            feedback.append("Essay is too short. Aim for at least 300 words.")
        elif analysis['word_count'] > 1000:
            feedback.append("Essay is quite long. Consider being more concise.")
        
        if analysis['grammar_score'] < 70:
            feedback.append("Grammar needs improvement. Review sentence structure and punctuation.")
        
        if analysis['readability_score'] < 60:
            feedback.append("Essay readability could be improved. Use simpler sentence structures.")
        
        if scores.get('content', 0) < 30:
            feedback.append("Content needs more depth. Expand on your main points.")
        
        if not feedback:
            feedback.append("Good work! Continue developing your writing skills.")
        
        return feedback
    
    def _calculate_similarity(self, text1, text2):
        """Calculate similarity between two texts"""
        # Normalize texts
        text1_normalized = re.sub(r'[^\w\s]', '', text1.lower())
        text2_normalized = re.sub(r'[^\w\s]', '', text2.lower())
        
        # Calculate similarity using multiple methods
        # 1. Sequence matcher
        seq_similarity = difflib.SequenceMatcher(None, text1_normalized, text2_normalized).ratio()
        
        # 2. Levenshtein distance
        max_len = max(len(text1_normalized), len(text2_normalized))
        if max_len == 0:
            lev_similarity = 1.0
        else:
            lev_distance = distance(text1_normalized, text2_normalized)
            lev_similarity = 1 - (lev_distance / max_len)
        
        # Average similarity
        return (seq_similarity + lev_similarity) / 2
    
    def _check_online_plagiarism(self, text):
        """Check plagiarism against online sources"""
        # This would integrate with a plagiarism detection API
        # For now, return empty results
        return []
