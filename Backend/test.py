# run with: python -c "from configuration import app, db; ...run snippet..."
from configuration import app, db
from sqlalchemy import text

with app.app_context():
    try:
        db.session.execute(text("SELECT 1"))
        print("DB connection OK")
    except Exception as e:
        print("DB connection failed:", e)