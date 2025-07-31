#!/usr/bin/env bash
# exit on error
set -o errexit

# Build the React frontend
npm --prefix frontend install
npm --prefix frontend run build

# Install Python dependencies
pip install -r backend/requirements.txt

# Collect static files for Django
python backend/manage.py collectstatic --no-input