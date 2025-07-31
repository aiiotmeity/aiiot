#!/usr/bin/env bash
set -o errexit

echo "🔄 Building React frontend..."
npm --prefix frontend install

# Fix permission issue with react-scripts on Linux (Render)
chmod +x frontend/node_modules/.bin/react-scripts

# Build React app
CI='' npm --prefix frontend run build

echo "📁 Creating Django templates folder..."
# CREATE TEMPLATES FOLDER - This will make your HomePage.js work!
mkdir -p backend/templates

echo "📋 Copying React build to Django..."
# Copy React's built index.html (with your HomePage.js inside) to Django templates
if [ -f "frontend/build/index.html" ]; then
    cp frontend/build/index.html backend/templates/
    echo "✅ React index.html (with HomePage.js) copied to Django templates"
else
    echo "❌ React build failed!"
    exit 1
fi

# Copy React static files (CSS, JS for your HomePage)
mkdir -p backend/static
if [ -d "frontend/build/static" ]; then
    cp -r frontend/build/static/* backend/static/
    echo "✅ React static files copied"
fi

echo "📦 Installing Python dependencies..."
pip install -r backend/requirements.txt

echo "🗄️ Running Django migrations..."
python backend/manage.py migrate

echo "📄 Collecting static files..."
python backend/manage.py collectstatic --no-input

echo "✅ Build completed - HomePage.js ready to load!"