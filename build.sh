#!/usr/bin/env bash
set -o errexit
npm --prefix frontend install && npm --prefix frontend run build
pip install -r backend/requirements.txt
python backend/manage.py collectstatic --no-input