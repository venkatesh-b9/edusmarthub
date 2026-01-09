FROM python:3.10-slim

WORKDIR /app

# Install ALL system dependencies for dlib and other packages
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    libopenblas-dev \
    liblapack-dev \
    libx11-dev \
    libgtk-3-dev \
    libjpeg-dev \
    libpng-dev \
    libtiff-dev \
    libavcodec-dev \
    libavformat-dev \
    libswscale-dev \
    libgstreamer-plugins-base1.0-dev \
    libgstreamer1.0-dev \
    libpq-dev \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Upgrade pip first
RUN pip install --upgrade pip

# Install cmake Python package (helps with dlib)
RUN pip install --no-cache-dir cmake || echo "cmake install failed, continuing..."

# Try to install dlib first, if fails, continue (dlib is optional for face-recognition)
RUN pip install --no-cache-dir dlib==19.24.2 || echo "dlib installation failed, will skip face-recognition..."

# Install remaining requirements, ignoring dlib/face-recognition if they fail
RUN pip install --no-cache-dir -r requirements.txt || \
    (pip install --no-cache-dir -r requirements.txt --ignore-installed dlib face-recognition || true)

# Download NLTK data
RUN python -m nltk.downloader punkt stopwords

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p models uploads logs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:5000/health')"

# Run application
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "--timeout", "120", "app:app"]
