import os
from flask import Flask, render_template, send_from_directory, jsonify
from flask_cors import CORS
from app.config import PORT, HOST
from app.database import init_db
from app.routers import (
    auth_bp, employees_bp, leave_bp, tasks_bp, notifications_bp, analytics_bp, reports_bp
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(os.path.dirname(BASE_DIR), 'frontend')
FRONTEND_PUBLIC = os.path.join(FRONTEND_DIR, 'public')
FRONTEND_SRC = os.path.join(FRONTEND_DIR, 'src')

app = Flask(
    __name__,
    static_folder=FRONTEND_SRC if os.path.exists(FRONTEND_SRC) else os.path.join(BASE_DIR, '..', 'static'),
    template_folder=FRONTEND_PUBLIC if os.path.exists(FRONTEND_PUBLIC) else os.path.join(BASE_DIR, '..', 'templates')
)

CORS(app)

# Initialize database
init_db()

# Register Blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(employees_bp)
app.register_blueprint(leave_bp)
app.register_blueprint(tasks_bp)
app.register_blueprint(notifications_bp)
app.register_blueprint(analytics_bp)
app.register_blueprint(reports_bp)

@app.route('/')
def index():
    if os.path.exists(os.path.join(FRONTEND_PUBLIC, 'index.html')):
        return send_from_directory(FRONTEND_PUBLIC, 'index.html')
    elif os.path.exists(os.path.join(FRONTEND_SRC, 'index.html')):
        return send_from_directory(FRONTEND_SRC, 'index.html')
    return send_from_directory(app.template_folder, 'index.html')

@app.route('/src/<path:filename>')
def serve_src(filename):
    return send_from_directory(FRONTEND_SRC, filename)

@app.route('/public/<path:filename>')
def serve_public(filename):
    return send_from_directory(FRONTEND_PUBLIC, filename)

if __name__ == '__main__':
    print(f"Starting Backend Server on http://{HOST}:{PORT}")
    app.run(host=HOST, port=PORT, debug=True)
