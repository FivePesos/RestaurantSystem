from flask_sqlalchemy import SQLAlchemy
from flask import Flask
from dotenv import load_dotenv
import os

dotenv_path = os.path.join(os.path.dirname(__file__), "env", ".env")
load_dotenv(dotenv_path)

db_uri = os.getenv("DB_URI", "sqlite:///restaurant.db").strip()
app = Flask(__name__)

app.config["SQLALCHEMY_DATABASE_URI"] = db_uri
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)