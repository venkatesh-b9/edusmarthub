from textblob import TextBlob
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from transformers import pipeline
import logging

logger = logging.getLogger(__name__)

class SentimentAnalysisService:
    def __init__(self):
        self.vader_analyzer = SentimentIntensityAnalyzer()
        self.transformer_analyzer = pipeline(
            "sentiment-analysis",
            model="cardiffnlp/twitter-roberta-base-sentiment-latest"
        )
    
    def analyze_sentiment(self, text, method='ensemble'):
        """Analyze sentiment of text"""
        try:
            results = {}
            
            if method in ['vader', 'ensemble']:
                vader_scores = self.vader_analyzer.polarity_scores(text)
                results['vader'] = {
                    'compound': vader_scores['compound'],
                    'positive': vader_scores['pos'],
                    'neutral': vader_scores['neu'],
                    'negative': vader_scores['neg'],
                    'sentiment': self._get_sentiment_label(vader_scores['compound'])
                }
            
            if method in ['textblob', 'ensemble']:
                blob = TextBlob(text)
                polarity = blob.sentiment.polarity
                subjectivity = blob.sentiment.subjectivity
                results['textblob'] = {
                    'polarity': polarity,
                    'subjectivity': subjectivity,
                    'sentiment': self._get_sentiment_label(polarity)
                }
            
            if method in ['transformer', 'ensemble']:
                transformer_result = self.transformer_analyzer(text)[0]
                results['transformer'] = {
                    'label': transformer_result['label'],
                    'score': transformer_result['score']
                }
            
            # Ensemble result
            if method == 'ensemble':
                ensemble_sentiment = self._ensemble_sentiment(results)
                results['ensemble'] = ensemble_sentiment
            
            return results
            
        except Exception as e:
            logger.error(f"Error analyzing sentiment: {str(e)}")
            raise
    
    def analyze_feedback_batch(self, feedback_list):
        """Analyze batch of feedback texts"""
        results = []
        
        for feedback in feedback_list:
            text = feedback.get('text', '')
            metadata = feedback.get('metadata', {})
            
            sentiment_result = self.analyze_sentiment(text)
            
            results.append({
                'feedback_id': feedback.get('id'),
                'text': text[:100] + '...' if len(text) > 100 else text,
                'sentiment': sentiment_result.get('ensemble', {}).get('sentiment', 'neutral'),
                'confidence': sentiment_result.get('ensemble', {}).get('confidence', 0),
                'metadata': metadata
            })
        
        # Aggregate statistics
        sentiment_counts = {}
        for result in results:
            sentiment = result['sentiment']
            sentiment_counts[sentiment] = sentiment_counts.get(sentiment, 0) + 1
        
        return {
            'individual_results': results,
            'aggregate_statistics': {
                'total_feedback': len(results),
                'sentiment_distribution': sentiment_counts,
                'average_confidence': sum(r['confidence'] for r in results) / len(results) if results else 0
            }
        }
    
    def _get_sentiment_label(self, score):
        """Get sentiment label from score"""
        if score > 0.1:
            return 'positive'
        elif score < -0.1:
            return 'negative'
        else:
            return 'neutral'
    
    def _ensemble_sentiment(self, results):
        """Combine results from multiple methods"""
        scores = []
        
        if 'vader' in results:
            scores.append(results['vader']['compound'])
        
        if 'textblob' in results:
            scores.append(results['textblob']['polarity'])
        
        if 'transformer' in results:
            # Map transformer label to score
            label = results['transformer']['label']
            score = results['transformer']['score']
            if 'POSITIVE' in label.upper():
                scores.append(score)
            elif 'NEGATIVE' in label.upper():
                scores.append(-score)
            else:
                scores.append(0)
        
        if scores:
            avg_score = sum(scores) / len(scores)
            confidence = 1 - (max(scores) - min(scores)) if len(scores) > 1 else 1.0
            
            return {
                'sentiment': self._get_sentiment_label(avg_score),
                'score': avg_score,
                'confidence': confidence
            }
        
        return {
            'sentiment': 'neutral',
            'score': 0,
            'confidence': 0
        }
