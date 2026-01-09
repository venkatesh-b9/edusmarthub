import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import joblib
import os
from datetime import datetime
import mlflow
import mlflow.sklearn
from utils.database import get_db, get_redis
from config import Config
import logging

logger = logging.getLogger(__name__)

class PerformancePredictionService:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.model_path = os.path.join(Config.MODEL_STORAGE_PATH, 'performance_prediction')
        os.makedirs(self.model_path, exist_ok=True)
        mlflow.set_tracking_uri(Config.MLFLOW_TRACKING_URI)
        
    def prepare_features(self, student_data):
        """Prepare features from student data"""
        features = []
        
        # Academic features
        features.append(student_data.get('average_grade', 0))
        features.append(student_data.get('attendance_rate', 0))
        features.append(student_data.get('assignment_completion_rate', 0))
        features.append(student_data.get('homework_submission_rate', 0))
        
        # Behavioral features
        features.append(student_data.get('participation_score', 0))
        features.append(student_data.get('late_submissions', 0))
        features.append(student_data.get('absences', 0))
        
        # Historical features
        features.append(student_data.get('previous_term_average', 0))
        features.append(student_data.get('improvement_trend', 0))
        
        # Demographic features (normalized)
        features.append(student_data.get('age', 0))
        features.append(1 if student_data.get('has_support', False) else 0)
        
        return np.array(features).reshape(1, -1)
    
    def train_model(self, training_data):
        """Train performance prediction model"""
        try:
            df = pd.DataFrame(training_data)
            
            # Prepare features and target
            feature_columns = [
                'average_grade', 'attendance_rate', 'assignment_completion_rate',
                'homework_submission_rate', 'participation_score', 'late_submissions',
                'absences', 'previous_term_average', 'improvement_trend',
                'age', 'has_support'
            ]
            
            X = df[feature_columns].values
            y = df['final_grade'].values
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )
            
            # Scale features
            X_train_scaled = self.scaler.fit_transform(X_train)
            X_test_scaled = self.scaler.transform(X_test)
            
            # Train models with MLflow tracking
            with mlflow.start_run():
                # Random Forest
                rf_model = RandomForestRegressor(
                    n_estimators=100,
                    max_depth=10,
                    random_state=42
                )
                rf_model.fit(X_train_scaled, y_train)
                rf_score = rf_model.score(X_test_scaled, y_test)
                
                # Gradient Boosting
                gb_model = GradientBoostingRegressor(
                    n_estimators=100,
                    max_depth=5,
                    random_state=42
                )
                gb_model.fit(X_train_scaled, y_train)
                gb_score = gb_model.score(X_test_scaled, y_test)
                
                # Choose best model
                if gb_score > rf_score:
                    self.model = gb_model
                    mlflow.log_metric("r2_score", gb_score)
                    mlflow.sklearn.log_model(gb_model, "model")
                else:
                    self.model = rf_model
                    mlflow.log_metric("r2_score", rf_score)
                    mlflow.sklearn.log_model(rf_model, "model")
                
                # Save model
                model_filename = f"performance_model_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pkl"
                joblib.dump(self.model, os.path.join(self.model_path, model_filename))
                joblib.dump(self.scaler, os.path.join(self.model_path, 'scaler.pkl'))
                
                logger.info(f"Model trained with R2 score: {max(rf_score, gb_score)}")
                
                return {
                    'r2_score': max(rf_score, gb_score),
                    'model_version': model_filename
                }
                
        except Exception as e:
            logger.error(f"Error training model: {str(e)}")
            raise
    
    def predict(self, student_data):
        """Predict student performance"""
        if self.model is None:
            self.load_latest_model()
        
        features = self.prepare_features(student_data)
        features_scaled = self.scaler.transform(features)
        
        prediction = self.model.predict(features_scaled)[0]
        confidence = self._calculate_confidence(features_scaled)
        
        return {
            'predicted_grade': float(prediction),
            'confidence': float(confidence),
            'risk_level': self._assess_risk_level(prediction)
        }
    
    def load_latest_model(self):
        """Load the latest trained model"""
        try:
            model_files = [f for f in os.listdir(self.model_path) if f.startswith('performance_model_')]
            if not model_files:
                raise FileNotFoundError("No trained model found")
            
            latest_model = sorted(model_files)[-1]
            self.model = joblib.load(os.path.join(self.model_path, latest_model))
            self.scaler = joblib.load(os.path.join(self.model_path, 'scaler.pkl'))
            logger.info(f"Loaded model: {latest_model}")
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            raise
    
    def _calculate_confidence(self, features):
        """Calculate prediction confidence"""
        # Simple confidence based on feature completeness
        non_zero_features = np.count_nonzero(features)
        total_features = len(features[0])
        return non_zero_features / total_features
    
    def _assess_risk_level(self, predicted_grade):
        """Assess risk level based on predicted grade"""
        if predicted_grade >= 80:
            return 'low'
        elif predicted_grade >= 60:
            return 'medium'
        else:
            return 'high'
    
    def get_feature_importance(self):
        """Get feature importance for explainability"""
        if self.model is None:
            self.load_latest_model()
        
        if hasattr(self.model, 'feature_importances_'):
            feature_names = [
                'average_grade', 'attendance_rate', 'assignment_completion_rate',
                'homework_submission_rate', 'participation_score', 'late_submissions',
                'absences', 'previous_term_average', 'improvement_trend',
                'age', 'has_support'
            ]
            importances = self.model.feature_importances_
            
            return dict(zip(feature_names, importances.tolist()))
        return {}
