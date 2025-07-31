#!/usr/bin/env bash
set -o errexit

echo "🔄 Building React frontend..."
npm --prefix frontend install

# ✅ FIX: Make react-scripts executable
chmod +x frontend/node_modules/.bin/react-scripts

npm --prefix frontend run build

echo "📁 Copying React build to Django static..."
mkdir -p backend/static
cp -r frontend/build/* backend/static/ 2>/dev/null || echo "Frontend build not found, continuing..."

echo "📦 Installing Python dependencies..."
pip install -r backend/requirements.txt

echo "🗄️ Running Django migrations..."
python backend/manage.py migrate

echo "📄 Collecting static files..."
python backend/manage.py collectstatic --no-input

echo "✅ Build completed successfully!"
