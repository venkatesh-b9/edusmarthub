import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.cluster import KMeans
import pandas as pd
from utils.database import get_db
import logging

logger = logging.getLogger(__name__)

class LearningPathService:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(max_features=100)
        self.kmeans = None
    
    def recommend_learning_path(self, student_profile, available_resources):
        """Recommend learning path for a student"""
        try:
            # Analyze student strengths and weaknesses
            strengths = self._identify_strengths(student_profile)
            weaknesses = self._identify_weaknesses(student_profile)
            
            # Match resources to student needs
            recommendations = self._match_resources(
                student_profile,
                available_resources,
                strengths,
                weaknesses
            )
            
            # Generate learning path
            learning_path = self._generate_path(recommendations, student_profile)
            
            return {
                'learning_path': learning_path,
                'recommended_resources': recommendations,
                'estimated_completion_time': self._estimate_completion_time(learning_path),
                'difficulty_progression': self._calculate_difficulty_progression(learning_path)
            }
            
        except Exception as e:
            logger.error(f"Error recommending learning path: {str(e)}")
            raise
    
    def _identify_strengths(self, profile):
        """Identify student strengths"""
        strengths = []
        
        subjects = profile.get('subjects', {})
        for subject, data in subjects.items():
            if data.get('average_score', 0) >= 80:
                strengths.append({
                    'subject': subject,
                    'score': data.get('average_score'),
                    'level': 'strong'
                })
        
        return strengths
    
    def _identify_weaknesses(self, profile):
        """Identify student weaknesses"""
        weaknesses = []
        
        subjects = profile.get('subjects', {})
        for subject, data in subjects.items():
            if data.get('average_score', 0) < 60:
                weaknesses.append({
                    'subject': subject,
                    'score': data.get('average_score'),
                    'level': 'needs_improvement',
                    'topics': data.get('weak_topics', [])
                })
        
        return weaknesses
    
    def _match_resources(self, profile, resources, strengths, weaknesses):
        """Match resources to student needs"""
        recommendations = []
        
        # Prioritize resources for weaknesses
        for weakness in weaknesses:
            subject = weakness['subject']
            matching_resources = [
                r for r in resources
                if r.get('subject') == subject and
                r.get('difficulty_level') in ['beginner', 'intermediate']
            ]
            
            for resource in matching_resources[:3]:  # Top 3 per weakness
                recommendations.append({
                    'resource_id': resource.get('id'),
                    'title': resource.get('title'),
                    'type': resource.get('type'),
                    'priority': 'high',
                    'reason': f'Addresses weakness in {subject}',
                    'estimated_time': resource.get('duration', 60)
                })
        
        # Add enrichment resources for strengths
        for strength in strengths[:2]:  # Top 2 strengths
            subject = strength['subject']
            matching_resources = [
                r for r in resources
                if r.get('subject') == subject and
                r.get('difficulty_level') in ['intermediate', 'advanced']
            ]
            
            for resource in matching_resources[:2]:
                recommendations.append({
                    'resource_id': resource.get('id'),
                    'title': resource.get('title'),
                    'type': resource.get('type'),
                    'priority': 'medium',
                    'reason': f'Enrichment for strong subject: {subject}',
                    'estimated_time': resource.get('duration', 60)
                })
        
        return recommendations
    
    def _generate_path(self, recommendations, profile):
        """Generate structured learning path"""
        # Sort by priority
        recommendations.sort(key=lambda x: {'high': 0, 'medium': 1, 'low': 2}.get(x['priority'], 3))
        
        # Group into modules
        path = []
        current_module = {
            'module_number': 1,
            'title': 'Foundation Building',
            'resources': [],
            'objectives': []
        }
        
        for rec in recommendations:
            if len(current_module['resources']) >= 5:
                path.append(current_module)
                current_module = {
                    'module_number': len(path) + 1,
                    'title': f'Module {len(path) + 1}',
                    'resources': [],
                    'objectives': []
                }
            
            current_module['resources'].append(rec)
            current_module['objectives'].append(rec['reason'])
        
        if current_module['resources']:
            path.append(current_module)
        
        return path
    
    def _estimate_completion_time(self, learning_path):
        """Estimate total completion time"""
        total_time = 0
        for module in learning_path:
            for resource in module['resources']:
                total_time += resource.get('estimated_time', 60)
        
        return {
            'total_minutes': total_time,
            'total_hours': round(total_time / 60, 1),
            'estimated_weeks': round(total_time / (60 * 5), 1)  # Assuming 5 hours/week
        }
    
    def _calculate_difficulty_progression(self, learning_path):
        """Calculate difficulty progression"""
        progression = []
        for i, module in enumerate(learning_path):
            avg_difficulty = sum(
                {'beginner': 1, 'intermediate': 2, 'advanced': 3}.get(
                    r.get('difficulty_level', 'intermediate'), 2
                ) for r in module['resources']
            ) / len(module['resources']) if module['resources'] else 2
            
            progression.append({
                'module': i + 1,
                'average_difficulty': round(avg_difficulty, 2),
                'difficulty_label': ['beginner', 'intermediate', 'advanced'][int(avg_difficulty) - 1]
            })
        
        return progression
