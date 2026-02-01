from mangum import Mangum
import sys
import os

# Add the parent directory to the path to import backend module
backend_path = os.path.join(os.path.dirname(__file__), '..', '..')
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from backend.main import app

# Create the Mangum handler for Vercel
handler = Mangum(app, lifespan="off")
