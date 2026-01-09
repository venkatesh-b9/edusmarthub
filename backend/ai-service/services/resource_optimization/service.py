import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class ResourceOptimizationService:
    def __init__(self):
        self.models = {}
    
    def optimize_class_sizes(self, historical_data, constraints):
        """Optimize class sizes based on historical data"""
        try:
            df = pd.DataFrame(historical_data)
            
            # Analyze optimal class sizes
            optimal_sizes = {}
            
            for subject in df['subject'].unique():
                subject_data = df[df['subject'] == subject]
                
                # Find class size with best performance
                performance_by_size = subject_data.groupby('class_size').agg({
                    'average_grade': 'mean',
                    'student_satisfaction': 'mean',
                    'teacher_workload': 'mean'
                }).reset_index()
                
                # Calculate efficiency score
                performance_by_size['efficiency'] = (
                    performance_by_size['average_grade'] * 0.5 +
                    performance_by_size['student_satisfaction'] * 0.3 -
                    performance_by_size['teacher_workload'] * 0.2
                )
                
                optimal_size = performance_by_size.loc[
                    performance_by_size['efficiency'].idxmax()
                ]['class_size']
                
                optimal_sizes[subject] = {
                    'optimal_size': int(optimal_size),
                    'expected_performance': float(performance_by_size.loc[
                        performance_by_size['efficiency'].idxmax()
                    ]['average_grade']),
                    'efficiency_score': float(performance_by_size['efficiency'].max())
                }
            
            return {
                'optimal_class_sizes': optimal_sizes,
                'recommendations': self._generate_class_size_recommendations(optimal_sizes, constraints)
            }
            
        except Exception as e:
            logger.error(f"Error optimizing class sizes: {str(e)}")
            raise
    
    def predict_resource_needs(self, school_data, forecast_period_days=90):
        """Predict future resource needs"""
        try:
            predictions = {}
            
            # Predict student enrollment
            enrollment_prediction = self._predict_enrollment(
                school_data.get('enrollment_history', []),
                forecast_period_days
            )
            
            # Predict teacher needs
            teacher_prediction = self._predict_teacher_needs(
                enrollment_prediction,
                school_data.get('current_teacher_count', 0),
                school_data.get('student_teacher_ratio', 20)
            )
            
            # Predict facility needs
            facility_prediction = self._predict_facility_needs(
                enrollment_prediction,
                school_data.get('current_capacity', 0)
            )
            
            return {
                'enrollment_prediction': enrollment_prediction,
                'teacher_prediction': teacher_prediction,
                'facility_prediction': facility_prediction,
                'forecast_period_days': forecast_period_days,
                'recommendations': self._generate_resource_recommendations(
                    enrollment_prediction,
                    teacher_prediction,
                    facility_prediction
                )
            }
            
        except Exception as e:
            logger.error(f"Error predicting resource needs: {str(e)}")
            raise
    
    def _predict_enrollment(self, history, forecast_days):
        """Predict future enrollment"""
        if not history:
            return {'predicted_enrollment': 0, 'confidence': 0}
        
        df = pd.DataFrame(history)
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')
        
        # Simple linear regression
        X = np.array(range(len(df))).reshape(-1, 1)
        y = df['enrollment'].values
        
        model = LinearRegression()
        model.fit(X, y)
        
        # Predict future
        future_days = forecast_days // 30  # Monthly predictions
        future_X = np.array(range(len(df), len(df) + future_days)).reshape(-1, 1)
        future_enrollment = model.predict(future_X)
        
        return {
            'current_enrollment': int(df['enrollment'].iloc[-1]),
            'predicted_enrollment': int(future_enrollment[-1]),
            'growth_rate': float((future_enrollment[-1] - df['enrollment'].iloc[-1]) / df['enrollment'].iloc[-1] * 100),
            'confidence': 0.8  # Simplified
        }
    
    def _predict_teacher_needs(self, enrollment_pred, current_teachers, ratio):
        """Predict teacher needs"""
        predicted_students = enrollment_pred['predicted_enrollment']
        required_teachers = int(np.ceil(predicted_students / ratio))
        current_need = required_teachers - current_teachers
        
        return {
            'current_teachers': current_teachers,
            'required_teachers': required_teachers,
            'teachers_needed': max(0, current_need),
            'surplus_teachers': max(0, -current_need)
        }
    
    def _predict_facility_needs(self, enrollment_pred, current_capacity):
        """Predict facility needs"""
        predicted_students = enrollment_pred['predicted_enrollment']
        utilization_rate = predicted_students / current_capacity if current_capacity > 0 else 0
        
        return {
            'current_capacity': current_capacity,
            'predicted_utilization': utilization_rate * 100,
            'capacity_status': 'adequate' if utilization_rate < 0.9 else 'near_capacity' if utilization_rate < 1.0 else 'over_capacity',
            'additional_capacity_needed': max(0, predicted_students - current_capacity)
        }
    
    def _generate_class_size_recommendations(self, optimal_sizes, constraints):
        """Generate recommendations for class sizes"""
        recommendations = []
        
        for subject, data in optimal_sizes.items():
            if data['optimal_size'] > constraints.get('max_class_size', 35):
                recommendations.append({
                    'subject': subject,
                    'issue': 'Optimal size exceeds maximum constraint',
                    'recommendation': f"Consider splitting {subject} classes or increasing max size limit"
                })
            elif data['optimal_size'] < constraints.get('min_class_size', 15):
                recommendations.append({
                    'subject': subject,
                    'issue': 'Optimal size below minimum constraint',
                    'recommendation': f"Consider combining {subject} classes or reducing min size limit"
                })
        
        return recommendations
    
    def _generate_resource_recommendations(self, enrollment, teachers, facilities):
        """Generate resource recommendations"""
        recommendations = []
        
        if teachers['teachers_needed'] > 0:
            recommendations.append({
                'type': 'teacher_hiring',
                'priority': 'high',
                'message': f"Hire {teachers['teachers_needed']} additional teachers",
                'timeline': '3-6 months'
            })
        
        if facilities['capacity_status'] == 'over_capacity':
            recommendations.append({
                'type': 'facility_expansion',
                'priority': 'urgent',
                'message': f"Expand facilities to accommodate {facilities['additional_capacity_needed']} more students",
                'timeline': '6-12 months'
            })
        elif facilities['capacity_status'] == 'near_capacity':
            recommendations.append({
                'type': 'facility_planning',
                'priority': 'medium',
                'message': 'Plan for facility expansion in near future',
                'timeline': '12-18 months'
            })
        
        return recommendations
