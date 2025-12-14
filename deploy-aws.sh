#!/bin/bash

# AWS EC2 Deployment Script for NewsAPP
# This script should be run on your EC2 instance

set -e

echo "🚀 Starting NewsAPP deployment..."

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "❌ Error: .env.production file not found!"
    echo "Please create .env.production based on .env.production.example"
    exit 1
fi

# Load environment variables
export $(cat .env.production | grep -v '^#' | xargs)

echo "📦 Pulling latest code..."
git pull origin main

echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.production.yml down

echo "🔨 Building containers..."
docker-compose -f docker-compose.production.yml build --no-cache

echo "🗄️ Setting up database..."
docker-compose -f docker-compose.production.yml run --rm backend rails db:create db:migrate

echo "🌱 Seeding database (if needed)..."
docker-compose -f docker-compose.production.yml run --rm backend rails db:seed || true

echo "🚀 Starting containers..."
docker-compose -f docker-compose.production.yml up -d

echo "🧹 Cleaning up unused Docker resources..."
docker system prune -f

echo "✅ Deployment complete!"
echo ""
echo "📊 Container status:"
docker-compose -f docker-compose.production.yml ps

echo ""
echo "📝 View logs with:"
echo "  docker-compose -f docker-compose.production.yml logs -f"
echo ""
echo "🌐 Your app should be accessible at: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
