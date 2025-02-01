# Use an official Python runtime as a base image
FROM python:3.9-slim

# Install system dependencies for GPG
RUN apt-get update && apt-get install -y gnupg && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the current directory contents into the container
COPY . .

# Expose port 5001
EXPOSE 5001

# Run the application
CMD ["python", "flask_verify_sig.py"]