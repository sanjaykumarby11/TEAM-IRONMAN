import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.environ.get('DB_PATH', os.path.join(BASE_DIR, 'system.db'))
SECRET_KEY = os.environ.get('SECRET_KEY', 'employee-leave-task-mgmt-system-super-secret-key-2026')
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
CORS_ORIGINS = "*"
PORT = int(os.environ.get('PORT', 5050))
HOST = os.environ.get('HOST', '0.0.0.0')

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
