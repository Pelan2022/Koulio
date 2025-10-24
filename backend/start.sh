#!/bin/bash

# KOULIO Backend Startup Script
echo "🚀 Starting KOULIO Backend..."

# Set default environment variables if not set
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-3000}
export HOST=${HOST:-0.0.0.0}

# Log environment info
echo "📋 Environment Configuration:"
echo "   NODE_ENV: $NODE_ENV"
echo "   PORT: $PORT"
echo "   HOST: $HOST"
echo "   DB_HOST: ${DB_HOST:-'not set'}"
echo "   DB_PORT: ${DB_PORT:-'not set'}"
echo "   DB_NAME: ${DB_NAME:-'not set'}"
echo "   DB_USER: ${DB_USER:-'not set'}"

# Test database connection first
echo "🔍 Testing database connection..."
node test_connection.js

if [ $? -eq 0 ]; then
    echo "✅ Database connection successful, starting server..."
    # Start the application
    exec node src/server.js
else
    echo "❌ Database connection failed, but starting server anyway..."
    echo "⚠️  Server will start without database connection"
    exec node src/server.js
fi