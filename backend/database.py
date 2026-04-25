"""
database.py — SQLAlchemy engine, session factory, and Base

Supports SQLite by default (zero-config, file-based).
Switch to PostgreSQL or MySQL by setting DATABASE_URL in your .env:

  # SQLite (default — no server needed)
  DATABASE_URL=sqlite:///./buildcost.db

  # PostgreSQL
  DATABASE_URL=postgresql://user:password@localhost:5432/buildcost

  # MySQL
  DATABASE_URL=mysql+pymysql://user:password@localhost:3306/buildcost
"""

import os
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from dotenv import load_dotenv

load_dotenv(override=True)

# ── Connection URL ────────────────────────────────────────────
DATABASE_URL: str = os.getenv(
    "DATABASE_URL",
    # Default: SQLite file next to this script
    f"sqlite:///{os.path.join(os.path.dirname(__file__), 'buildcost.db')}"
)

_is_sqlite = DATABASE_URL.startswith("sqlite")

# ── Engine ────────────────────────────────────────────────────
engine = create_engine(
    DATABASE_URL,
    # SQLite needs check_same_thread=False when used with FastAPI (multi-threaded)
    connect_args={"check_same_thread": False} if _is_sqlite else {},
    # Connection pool tuning (ignored by SQLite)
    pool_pre_ping=True,       # verify connection before use
    echo=False,               # set True to log all SQL statements
)

# Enable SQLite WAL mode for better concurrent read performance
if _is_sqlite:
    @event.listens_for(engine, "connect")
    def _set_sqlite_pragmas(dbapi_conn, _connection_record):
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

# ── Session factory ───────────────────────────────────────────
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
)

# ── Declarative base ──────────────────────────────────────────
class Base(DeclarativeBase):
    """All ORM models inherit from this."""
    pass

# ── FastAPI dependency ────────────────────────────────────────
def get_db():
    """
    Yield a database session and guarantee it is closed afterwards.
    Use as a FastAPI Depends:

        @router.get("/items")
        def read_items(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
