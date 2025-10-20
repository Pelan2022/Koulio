#!/bin/bash

# KOULIO Backend Startup Script
echo "🚀 Starting KOULIO Backend API..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found, copying from env.example..."
    cp env.example .env
    echo "📝 Please edit .env file with your configuration"
fi

# Create necessary directories
mkdir -p logs
mkdir -p certs

# Check if running in Docker
if [ -f /.dockerenv ]; then
    echo "🐳 Running in Docker container"
    
    # Wait for database to be ready
    echo "⏳ Waiting for database to be ready..."
    until nc -z postgres 5432; do
        echo "Waiting for PostgreSQL..."
        sleep 2
    done
    echo "✅ Database is ready"
    
    # Run database migration
    echo "🗄️  Running database migration..."
    npm run migrate
    
    # Seed database
    echo "🌱 Seeding database..."
    npm run seed
fi

# Test database connection
echo "🧪 Testing database connection..."
node test_database.js

if [ $? -eq 0 ]; then
    echo "✅ Database test passed"
else
    echo "❌ Database test failed"
    exit 1
fi

# Start the application
echo "🚀 Starting KOULIO Backend API server..."
npm start
