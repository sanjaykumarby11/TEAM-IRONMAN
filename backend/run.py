import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app, PORT, HOST

if __name__ == '__main__':
    print(f"🚀 Running Employee Leave & Task Management Backend on http://{HOST}:{PORT}")
    app.run(host=HOST, port=PORT, debug=True)
