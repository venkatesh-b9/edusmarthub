import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib
import os
from datetime import datetime, timedelta
from utils.database import get_db, get_redis
from config import Config
import logging

logger = logging.getLogger(__name__)

class EarlyWarningService:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.model_path = os.path.join(Config.MODEL_STORAGE_PATH, 'early_warning')
        os.makedirs(self.model_path, exist_ok=True)
        self.risk_thresholds = {
            'high': 0.7,
            'medium': 0.4,
            'low': 0.0
        }
    
    def calculate_risk_score(self, student_data):
        """Calculate at-risk score for a student"""
        risk_factors = []
        
        # Academic risk factors
        if student_data.get('average_grade', 100) < 60:
            risk_factors.append(('low_grade', 0.3))
        if student_data.get('attendance_rate', 100) < 70:
            risk_factors.append(('low_attendance', 0.25))
        if student_data.get('assignment_completion_rate', 100) < 60:
            risk_factors.append(('low_completion', 0.2))
        
        # Behavioral risk factors
        if student_data.get('absences', 0) > 10:
            risk_factors.append(('high_absences', 0.15))
        if student_data.get('late_submissions', 0) > 5:
            risk_factors.append(('late_submissions', 0.1))
        
        # Calculate total risk score
        total_risk = sum(weight for _, weight in risk_factors)
        total_risk = min(total_risk, 1.0)  # Cap at 1.0
        
        return {
            'risk_score': total_risk,
            'risk_level': self._get_risk_level(total_risk),
            'risk_factors': [factor for factor, _ in risk_factors],
            'recommendations': self._get_recommendations(risk_factors)
        }
    
    def train_anomaly_detector(self, training_data):
        """Train anomaly detection model for early warning"""
        try:
            df = pd.DataFrame(training_data)
            
            # Prepare features
            feature_columns = [
                'average_grade', 'attendance_rate', 'assignment_completion_rate',
                'absences', 'late_submissions', 'participation_score'
            ]
            
            X = df[feature_columns].values
            
            # Scale features
            X_scaled = self.scaler.fit_transform(X)
            
            # Train Isolation Forest
            self.model = IsolationForest(
                contamination=0.1,  # Expect 10% anomalies
                random_state=42,
                n_estimators=100
            )
            self.model.fit(X_scaled)
            
            # Save model
            model_filename = f"early_warning_model_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pkl"
            joblib.dump(self.model, os.path.join(self.model_path, model_filename))
            joblib.dump(self.scaler, os.path.join(self.model_path, 'scaler.pkl'))
            
            logger.info("Early warning model trained successfully")
            
            return {
                'model_version': model_filename,
                'status': 'trained'
            }
            
        except Exception as e:
            logger.error(f"Error training early warning model: {str(e)}")
            raise
    
    def detect_at_risk_students(self, students_data):
        """Detect at-risk students from batch data"""
        if self.model is None:
            self.load_latest_model()
        
        results = []
        
        for student in students_data:
            risk_assessment = self.calculate_risk_score(student)
            
            # Use anomaly detector if available
            if self.model:
                features = np.array([
                    student.get('average_grade', 0),
                    student.get('attendance_rate', 0),
                    student.get('assignment_completion_rate', 0),
                    student.get('absences', 0),
                    student.get('late_submissions', 0),
                    student.get('participation_score', 0)
                ]).reshape(1, -1)
                
                features_scaled = self.scaler.transform(features)
                anomaly_score = self.model.decision_function(features_scaled)[0]
                is_anomaly = self.model.predict(features_scaled)[0] == -1
                
                risk_assessment['anomaly_score'] = float(anomaly_score)
                risk_assessment['is_anomaly'] = bool(is_anomaly)
            
            results.append({
                'student_id': student.get('student_id'),
                **risk_assessment
            })
        
        # Sort by risk score
        results.sort(key=lambda x: x['risk_score'], reverse=True)
        
        return results
    
    def load_latest_model(self):
        """Load the latest trained model"""
        try:
            model_files = [f for f in os.listdir(self.model_path) if f.startswith('early_warning_model_')]
            if model_files:
                latest_model = sorted(model_files)[-1]
                self.model = joblib.load(os.path.join(self.model_path, latest_model))
                self.scaler = joblib.load(os.path.join(self.model_path, 'scaler.pkl'))
                logger.info(f"Loaded early warning model: {latest_model}")
        except Exception as e:
            logger.warning(f"Could not load early warning model: {str(e)}")
    
    def _get_risk_level(self, risk_score):
        """Get risk level from score"""
        if risk_score >= self.risk_thresholds['high']:
            return 'high'
        elif risk_score >= self.risk_thresholds['medium']:
            return 'medium'
        else:
            return 'low'
    
    def _get_recommendations(self, risk_factors):
        """Get recommendations based on risk factors"""
        recommendations = []
        
        factor_map = {
            'low_grade': 'Schedule tutoring sessions and provide additional academic support',
            'low_attendance': 'Contact parents and investigate reasons for absences',
            'low_completion': 'Provide assignment reminders and check for learning difficulties',
            'high_absences': 'Schedule meeting with parents and school counselor',
            'late_submissions': 'Review workload and provide time management support'
        }
        
        for factor, _ in risk_factors:
            if factor in factor_map:
                recommendations.append(factor_map[factor])
        
        return recommendations
