# Use Python 3.11 slim image for smaller size
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies for psycopg2 and other packages
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port (Cloud Run uses PORT env variable)
EXPOSE 8080

# Set environment variables
ENV PORT=8080
ENV PYTHONUNBUFFERED=1

# Create a non-root user and group
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Set ownership of the working directory
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Run the application
CMD exec uvicorn main:app --host 0.0.0.0 --port ${PORT}
