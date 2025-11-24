from flask_sqlalchemy import SQLAlchemy
from flask import Flask
from dotenv import load_dotenv
import os
from flask_cors import CORS  # added

dotenv_path = os.path.join(os.path.dirname(__file__), "env", ".env")
load_dotenv(dotenv_path)

db_uri = os.getenv("DB_URI", "sqlite:///restaurant.db").strip()
app = Flask(__name__)

CORS(app, resources={r"/*": {"origins": "*"}})  # allow cross-origin calls from dev frontend

app.config["SQLALCHEMY_DATABASE_URI"] = db_uri
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)