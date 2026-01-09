# AI Service - EduSmartHub

Python/Flask microservice providing AI and ML capabilities for the EduSmartHub platform.

## Features

### 1. Student Performance Prediction
- Predicts student final grades based on historical data
- Uses Random Forest and Gradient Boosting models
- Provides confidence scores and risk assessments

### 2. Early Warning System
- Identifies at-risk students using anomaly detection
- Calculates risk scores based on multiple factors
- Provides actionable recommendations

### 3. Automated Essay Grading
- Grades essays using NLP and ML techniques
- Plagiarism detection with similarity scoring
- Provides detailed feedback and rubric-based scoring

### 4. Sentiment Analysis
- Analyzes student/parent feedback sentiment
- Uses ensemble of VADER, TextBlob, and Transformer models
- Batch processing for large volumes

### 5. Learning Path Recommendation
- Recommends personalized learning paths
- Matches resources to student needs
- Considers strengths and weaknesses

### 6. Attendance Anomaly Detection
- Detects unusual attendance patterns
- Uses Isolation Forest for anomaly detection
- Identifies at-risk attendance behaviors

### 7. Resource Optimization
- Optimizes class sizes based on performance data
- Predicts future resource needs
- Provides recommendations for facility and staffing

### 8. NLP Chatbot
- Natural language processing for conversational AI
- Knowledge base integration
- Context-aware responses

### 9. Image Recognition
- Facial recognition for attendance
- Object detection for security
- Face registration and matching

### 10. Voice-to-Text
- Transcribes audio to text using Whisper
- Meeting transcription with speaker identification
- Action item extraction

## Model Management

- **Training Pipeline**: Automated model training with MLflow
- **A/B Testing**: Compare model versions
- **Model Versioning**: Track all model versions
- **Bias Detection**: Fairlearn integration for bias detection
- **Explainable AI**: SHAP and LIME for model explanations

## Installation

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Download NLTK data
python -m nltk.downloader punkt stopwords

# Configure environment
cp .env.example .env
# Edit .env with your configuration
```

## Running

```bash
# Development
python app.py

# Production
gunicorn --bind 0.0.0.0:5000 --workers 4 app:app
```

## Docker

```bash
# Build
docker build -t ai-service .

# Run
docker run -p 5000:5000 ai-service
```

## API Endpoints

All endpoints are prefixed with `/api/v1/ai/`:

- `/performance/predict` - Predict student performance
- `/early-warning/assess` - Assess student risk
- `/essay-grading/grade` - Grade essay
- `/sentiment/analyze` - Analyze sentiment
- `/learning-path/recommend` - Recommend learning path
- `/anomaly/attendance` - Detect attendance anomalies
- `/resource-optimization/class-sizes` - Optimize class sizes
- `/chatbot/chat` - Chat with AI assistant
- `/image/recognize` - Recognize faces
- `/voice/transcribe` - Transcribe audio
- `/models/train` - Train model

## Integration with Main Backend

The AI service integrates with the main Node.js backend via:
- REST API calls for data retrieval
- Message queue for async processing
- Shared database access

## Model Training

Models are trained using MLflow for tracking:
- Parameters and hyperparameters
- Metrics and performance
- Model artifacts
- Experiment tracking

## Testing

```bash
# Run tests
pytest

# With coverage
pytest --cov=services --cov-report=html
```

## License

MIT
