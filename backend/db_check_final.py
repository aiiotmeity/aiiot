import os
import django
import sys

# Add the current directory to the path so it can find 'myproject'
sys.path.append(os.getcwd())

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.settings')
django.setup()

from django.db import connection
with connection.cursor() as cursor:
    cursor.execute("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'")
    tables = cursor.fetchall()
    print("Tables:")
    for table in [t[0] for t in tables]:
        print(f" - {table}")
