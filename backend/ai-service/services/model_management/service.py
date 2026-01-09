import mlflow
import mlflow.sklearn
import mlflow.pyfunc
import os
import json
from datetime import datetime
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import pandas as pd
import numpy as np
import shap
import lime
import lime.lime_tabular
from fairlearn.metrics import demographic_parity_difference, equalized_odds_difference
from aif360.datasets import BinaryLabelDataset
from aif360.algorithms.preprocessing import Reweighing
from config import Config
import logging

logger = logging.getLogger(__name__)

class ModelManagementService:
    def __init__(self):
        mlflow.set_tracking_uri(Config.MLFLOW_TRACKING_URI)
        self.experiments = {}
    
    def train_model(self, model_type, training_data, parameters, experiment_name=None):
        """Train model with versioning"""
        try:
            # Create or get experiment
            if experiment_name:
                experiment = mlflow.get_experiment_by_name(experiment_name)
                if not experiment:
                    experiment_id = mlflow.create_experiment(experiment_name)
                else:
                    experiment_id = experiment.experiment_id
            else:
                experiment_id = mlflow.get_experiment_by_name("Default").experiment_id
            
            with mlflow.start_run(experiment_id=experiment_id):
                # Prepare data
                df = pd.DataFrame(training_data)
                X = df.drop('target', axis=1)
                y = df['target']
                X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
                
                # Train model based on type
                model = self._train_model_by_type(model_type, X_train, y_train, parameters)
                
                # Evaluate
                y_pred = model.predict(X_test)
                metrics = {
                    'accuracy': accuracy_score(y_test, y_pred),
                    'precision': precision_score(y_test, y_pred, average='weighted'),
                    'recall': recall_score(y_test, y_pred, average='weighted'),
                    'f1_score': f1_score(y_test, y_pred, average='weighted')
                }
                
                # Log parameters and metrics
                mlflow.log_params(parameters)
                mlflow.log_metrics(metrics)
                
                # Log model
                mlflow.sklearn.log_model(model, "model")
                
                # Bias detection
                if Config.BIAS_DETECTION_ENABLED:
                    bias_metrics = self._detect_bias(model, X_test, y_test, df)
                    mlflow.log_metrics(bias_metrics)
                
                # Model versioning
                model_version = {
                    'run_id': mlflow.active_run().info.run_id,
                    'model_type': model_type,
                    'metrics': metrics,
                    'timestamp': datetime.now().isoformat()
                }
                
                return model_version
                
        except Exception as e:
            logger.error(f"Error training model: {str(e)}")
            raise
    
    def _train_model_by_type(self, model_type, X_train, y_train, parameters):
        """Train model based on type"""
        from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
        from sklearn.linear_model import LogisticRegression
        
        if model_type == 'random_forest':
            return RandomForestClassifier(**parameters).fit(X_train, y_train)
        elif model_type == 'gradient_boosting':
            return GradientBoostingClassifier(**parameters).fit(X_train, y_train)
        elif model_type == 'logistic_regression':
            return LogisticRegression(**parameters).fit(X_train, y_train)
        else:
            raise ValueError(f"Unknown model type: {model_type}")
    
    def detect_bias(self, model, test_data, protected_attributes):
        """Detect bias in model predictions"""
        try:
            df = pd.DataFrame(test_data)
            X = df.drop('target', axis=1)
            y = df['target']
            y_pred = model.predict(X)
            
            bias_metrics = {}
            
            for attr in protected_attributes:
                if attr in df.columns:
                    # Calculate demographic parity
                    dp_diff = demographic_parity_difference(
                        y_true=y,
                        y_pred=y_pred,
                        sensitive_features=df[attr]
                    )
                    
                    # Calculate equalized odds
                    eo_diff = equalized_odds_difference(
                        y_true=y,
                        y_pred=y_pred,
                        sensitive_features=df[attr]
                    )
                    
                    bias_metrics[f'{attr}_demographic_parity'] = dp_diff
                    bias_metrics[f'{attr}_equalized_odds'] = eo_diff
                    
                    # Flag if bias exceeds threshold
                    if abs(dp_diff) > Config.BIAS_THRESHOLD:
                        bias_metrics[f'{attr}_bias_detected'] = True
                    else:
                        bias_metrics[f'{attr}_bias_detected'] = False
            
            return bias_metrics
            
        except Exception as e:
            logger.error(f"Error detecting bias: {str(e)}")
            raise
    
    def _detect_bias(self, model, X_test, y_test, df):
        """Internal bias detection"""
        # Simplified bias detection
        y_pred = model.predict(X_test)
        
        # Check for protected attributes
        protected_attrs = ['gender', 'race', 'ethnicity']
        bias_metrics = {}
        
        for attr in protected_attrs:
            if attr in df.columns:
                # Simple statistical parity check
                groups = df[attr].unique()
                if len(groups) > 1:
                    group_predictions = {}
                    for group in groups:
                        group_mask = df[attr] == group
                        group_predictions[group] = y_pred[group_mask].mean()
                    
                    max_diff = max(group_predictions.values()) - min(group_predictions.values())
                    bias_metrics[f'{attr}_bias_score'] = max_diff
        
        return bias_metrics
    
    def explain_prediction(self, model, instance, feature_names):
        """Explain model prediction using SHAP and LIME"""
        try:
            explanations = {}
            
            if Config.EXPLAINABLE_AI_ENABLED:
                # SHAP explanation
                explainer = shap.TreeExplainer(model)
                shap_values = explainer.shap_values(instance)
                explanations['shap'] = {
                    'values': shap_values.tolist() if isinstance(shap_values, np.ndarray) else shap_values,
                    'feature_names': feature_names
                }
                
                # LIME explanation
                lime_explainer = lime.lime_tabular.LimeTabularExplainer(
                    instance.values.reshape(1, -1),
                    feature_names=feature_names,
                    mode='classification'
                )
                lime_exp = lime_explainer.explain_instance(
                    instance.values[0],
                    model.predict_proba,
                    num_features=len(feature_names)
                )
                explanations['lime'] = {
                    'explanation': str(lime_exp.as_list()),
                    'score': lime_exp.score
                }
            
            return explanations
            
        except Exception as e:
            logger.error(f"Error explaining prediction: {str(e)}")
            raise
    
    def ab_test_models(self, model_a, model_b, test_data, metric='accuracy'):
        """A/B test two model versions"""
        try:
            df = pd.DataFrame(test_data)
            X = df.drop('target', axis=1)
            y = df['target']
            
            # Get predictions
            pred_a = model_a.predict(X)
            pred_b = model_b.predict(X)
            
            # Calculate metrics
            from scipy import stats
            
            if metric == 'accuracy':
                score_a = accuracy_score(y, pred_a)
                score_b = accuracy_score(y, pred_b)
            elif metric == 'f1':
                score_a = f1_score(y, pred_a, average='weighted')
                score_b = f1_score(y, pred_b, average='weighted')
            else:
                raise ValueError(f"Unknown metric: {metric}")
            
            # Statistical test
            # Simplified: compare scores
            improvement = score_b - score_a
            improvement_pct = (improvement / score_a * 100) if score_a > 0 else 0
            
            result = {
                'model_a_score': score_a,
                'model_b_score': score_b,
                'improvement': improvement,
                'improvement_percentage': improvement_pct,
                'winner': 'model_b' if score_b > score_a else 'model_a',
                'statistically_significant': abs(improvement) > 0.05  # Simplified threshold
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Error in A/B test: {str(e)}")
            raise
    
    def get_model_versions(self, experiment_name):
        """Get all model versions for an experiment"""
        try:
            experiment = mlflow.get_experiment_by_name(experiment_name)
            if not experiment:
                return []
            
            runs = mlflow.search_runs(experiment.experiment_id, order_by=["metrics.accuracy DESC"])
            
            versions = []
            for _, run in runs.iterrows():
                versions.append({
                    'run_id': run['run_id'],
                    'version': run.get('tags.mlflow.runName', ''),
                    'metrics': {
                        'accuracy': run.get('metrics.accuracy', 0),
                        'f1_score': run.get('metrics.f1_score', 0)
                    },
                    'timestamp': run.get('start_time', '')
                })
            
            return versions
            
        except Exception as e:
            logger.error(f"Error getting model versions: {str(e)}")
            raise
