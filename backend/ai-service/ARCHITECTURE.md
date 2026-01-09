# AI Service Architecture

## Overview

The AI Service is a Python/Flask microservice that provides AI and ML capabilities for the EduSmartHub platform. It integrates with the main Node.js backend via REST APIs and message queues.

## Service Structure

```
ai-service/
├── app.py                          # Main Flask application
├── config.py                       # Configuration management
├── requirements.txt                # Python dependencies
├── Dockerfile                      # Docker configuration
├── docker-compose.yml              # Docker Compose setup
├── services/                        # AI Services
│   ├── performance_prediction/     # Student performance prediction
│   ├── early_warning/              # At-risk student detection
│   ├── essay_grading/              # Automated essay grading
│   ├── sentiment_analysis/         # Sentiment analysis
│   ├── learning_path/              # Learning path recommendations
│   ├── anomaly_detection/          # Anomaly detection
│   ├── resource_optimization/      # Resource optimization
│   ├── chatbot/                    # NLP chatbot
│   ├── image_recognition/          # Image/facial recognition
│   ├── voice_to_text/              # Voice transcription
│   └── model_management/           # Model training & management
├── utils/                          # Utilities
│   ├── database.py                 # Database connections
│   └── auth.py                     # Authentication
└── models/                         # Trained models storage
```

## Services

### 1. Performance Prediction
- **Models**: Random Forest, Gradient Boosting
- **Features**: Academic performance, attendance, behavioral data
- **Output**: Predicted grades, confidence scores, risk levels

### 2. Early Warning System
- **Method**: Isolation Forest for anomaly detection
- **Risk Factors**: Low grades, attendance, completion rates
- **Output**: Risk scores, recommendations, alerts

### 3. Essay Grading
- **Techniques**: NLP analysis, rubric-based scoring
- **Features**: Word count, grammar, readability, vocabulary
- **Plagiarism**: Similarity detection using Levenshtein distance

### 4. Sentiment Analysis
- **Models**: VADER, TextBlob, Transformer (RoBERTa)
- **Method**: Ensemble approach
- **Output**: Sentiment labels, confidence scores, batch statistics

### 5. Learning Path Recommendation
- **Method**: Content-based filtering
- **Factors**: Strengths, weaknesses, available resources
- **Output**: Personalized learning paths, resource recommendations

### 6. Anomaly Detection
- **Methods**: Isolation Forest, statistical methods
- **Applications**: Attendance patterns, grade anomalies
- **Output**: Anomaly scores, classifications, alerts

### 7. Resource Optimization
- **Predictions**: Enrollment, teacher needs, facility requirements
- **Optimization**: Class sizes, resource allocation
- **Output**: Recommendations, forecasts, efficiency metrics

### 8. NLP Chatbot
- **Models**: DistilBERT for QA, Sentence Transformers for retrieval
- **Features**: Knowledge base, conversation history
- **Output**: Contextual responses, confidence scores

### 9. Image Recognition
- **Library**: face_recognition, OpenCV
- **Applications**: Facial recognition for attendance, object detection
- **Output**: Face matches, confidence scores, locations

### 10. Voice-to-Text
- **Models**: Whisper (OpenAI), SpeechRecognition
- **Features**: Transcription, speaker identification, summarization
- **Output**: Text transcripts, meeting summaries, action items

## Model Management

### Training Pipeline
- **Framework**: MLflow for experiment tracking
- **Process**: Data preparation → Training → Evaluation → Versioning
- **Storage**: Model artifacts, metrics, parameters

### A/B Testing
- **Method**: Statistical comparison of model versions
- **Metrics**: Accuracy, F1-score, precision, recall
- **Output**: Winner selection, improvement metrics

### Model Versioning
- **Tracking**: MLflow experiment tracking
- **Storage**: Versioned model artifacts
- **Management**: Version comparison, rollback capability

### Bias Detection
- **Framework**: Fairlearn, AIF360
- **Metrics**: Demographic parity, equalized odds
- **Output**: Bias scores, flagged attributes

### Explainable AI
- **Tools**: SHAP, LIME
- **Methods**: Feature importance, prediction explanations
- **Output**: Interpretable explanations for predictions

## Integration

### With Main Backend
- **REST API**: HTTP requests for data retrieval
- **Authentication**: Token verification via main backend
- **Message Queue**: RabbitMQ for async processing
- **Database**: Shared PostgreSQL and MongoDB

### Data Flow
1. Main backend sends request to AI service
2. AI service processes request using ML models
3. Results returned via REST API
4. Async tasks processed via message queue

## Deployment

### Docker
- Containerized service with all dependencies
- MLflow server for model tracking
- Volume mounts for models and uploads

### Scaling
- Horizontal scaling with multiple workers
- Load balancing via API gateway
- Model caching for performance

## Monitoring

- **Logging**: Structured logging with rotation
- **Metrics**: Performance metrics via Prometheus
- **Health Checks**: Endpoint for service health
- **Error Tracking**: Exception logging and tracking

## Security

- **Authentication**: Token-based auth via main backend
- **Input Validation**: Request validation and sanitization
- **File Uploads**: Secure file handling and storage
- **Data Privacy**: Compliance with data protection regulations
