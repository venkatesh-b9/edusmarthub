import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import DBSCAN
import joblib
import os
from datetime import datetime, timedelta
from config import Config
import logging

logger = logging.getLogger(__name__)

class AnomalyDetectionService:
    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.model_path = os.path.join(Config.MODEL_STORAGE_PATH, 'anomaly_detection')
        os.makedirs(self.model_path, exist_ok=True)
    
    def detect_attendance_anomalies(self, attendance_data, school_id):
        """Detect anomalies in attendance patterns"""
        try:
            df = pd.DataFrame(attendance_data)
            
            # Prepare features
            features = self._prepare_attendance_features(df)
            
            # Load or train model
            model_key = f'attendance_{school_id}'
            if model_key not in self.models:
                self._train_attendance_model(features, model_key)
            
            # Detect anomalies
            model = self.models[model_key]
            scaler = self.scalers[model_key]
            
            features_scaled = scaler.transform(features)
            predictions = model.predict(features_scaled)
            scores = model.decision_function(features_scaled)
            
            # Identify anomalies
            anomalies = []
            for idx, (pred, score) in enumerate(zip(predictions, scores)):
                if pred == -1:  # Anomaly
                    anomalies.append({
                        'student_id': df.iloc[idx]['student_id'],
                        'date': df.iloc[idx]['date'],
                        'anomaly_score': float(score),
                        'anomaly_type': self._classify_attendance_anomaly(df.iloc[idx]),
                        'details': {
                            'attendance_rate': df.iloc[idx].get('attendance_rate', 0),
                            'consecutive_absences': df.iloc[idx].get('consecutive_absences', 0)
                        }
                    })
            
            return {
                'total_records': len(df),
                'anomalies_detected': len(anomalies),
                'anomaly_rate': len(anomalies) / len(df) if len(df) > 0 else 0,
                'anomalies': anomalies
            }
            
        except Exception as e:
            logger.error(f"Error detecting attendance anomalies: {str(e)}")
            raise
    
    def _prepare_attendance_features(self, df):
        """Prepare features for attendance anomaly detection"""
        features = []
        
        for _, row in df.iterrows():
            feature_vector = [
                row.get('attendance_rate', 0),
                row.get('consecutive_absences', 0),
                row.get('late_arrivals', 0),
                row.get('early_departures', 0),
                row.get('pattern_variance', 0)
            ]
            features.append(feature_vector)
        
        return np.array(features)
    
    def _train_attendance_model(self, features, model_key):
        """Train attendance anomaly detection model"""
        scaler = StandardScaler()
        features_scaled = scaler.fit_transform(features)
        
        model = IsolationForest(
            contamination=0.1,  # Expect 10% anomalies
            random_state=42,
            n_estimators=100
        )
        model.fit(features_scaled)
        
        self.models[model_key] = model
        self.scalers[model_key] = scaler
        
        # Save model
        model_filename = f"attendance_anomaly_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pkl"
        joblib.dump(model, os.path.join(self.model_path, model_filename))
        joblib.dump(scaler, os.path.join(self.model_path, f'scaler_{model_key}.pkl'))
    
    def _classify_attendance_anomaly(self, record):
        """Classify type of attendance anomaly"""
        if record.get('consecutive_absences', 0) > 5:
            return 'extended_absence'
        elif record.get('attendance_rate', 100) < 50:
            return 'low_attendance'
        elif record.get('late_arrivals', 0) > 10:
            return 'frequent_lateness'
        else:
            return 'pattern_deviation'
    
    def detect_grade_anomalies(self, grade_data):
        """Detect anomalies in grade patterns"""
        try:
            df = pd.DataFrame(grade_data)
            
            # Calculate grade statistics
            grade_stats = df.groupby('student_id')['grade'].agg(['mean', 'std', 'count']).reset_index()
            
            # Detect outliers using IQR method
            Q1 = grade_stats['mean'].quantile(0.25)
            Q3 = grade_stats['mean'].quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            
            anomalies = []
            for _, stat in grade_stats.iterrows():
                if stat['mean'] < lower_bound or stat['mean'] > upper_bound:
                    anomalies.append({
                        'student_id': stat['student_id'],
                        'anomaly_type': 'grade_outlier',
                        'details': {
                            'average_grade': stat['mean'],
                            'grade_std': stat['std'],
                            'assessment_count': stat['count']
                        }
                    })
            
            return {
                'total_students': len(grade_stats),
                'anomalies_detected': len(anomalies),
                'anomalies': anomalies
            }
            
        except Exception as e:
            logger.error(f"Error detecting grade anomalies: {str(e)}")
            raise
