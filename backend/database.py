from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./receipts.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class Receipt(Base):
    __tablename__ = "receipts"
    
    id = Column(Integer, primary_key=True, index=True)
    file_name = Column(String(255), nullable=False)
    vendor = Column(String(255), index=True)
    date = Column(String(20), index=True)  # YYYY-MM-DD format
    amount = Column(Float, index=True)
    category = Column(String(100), index=True)
    description = Column(Text)
    upload_date = Column(DateTime, index=True)
    file_type = Column(String(50))
    file_size = Column(Integer)
    status = Column(String(20), default="processing", index=True)
    extracted_text = Column(Text)
    confidence_score = Column(Float, default=0.0)
    
    # Create composite indexes for common queries
    __table_args__ = (
        Index('ix_date_amount', 'date', 'amount'),
        Index('ix_vendor_category', 'vendor', 'category'),
        Index('ix_status_date', 'status', 'date'),
    )

def create_tables():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# SQL commands for manual table creation
CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS receipts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_name VARCHAR(255) NOT NULL,
    vendor VARCHAR(255),
    date VARCHAR(20),
    amount REAL,
    category VARCHAR(100),
    description TEXT,
    upload_date DATETIME,
    file_type VARCHAR(50),
    file_size INTEGER,
    status VARCHAR(20) DEFAULT 'processing',
    extracted_text TEXT,
    confidence_score REAL DEFAULT 0.0
);

-- Indexes for optimized search performance
CREATE INDEX IF NOT EXISTS ix_receipts_vendor ON receipts(vendor);
CREATE INDEX IF NOT EXISTS ix_receipts_date ON receipts(date);
CREATE INDEX IF NOT EXISTS ix_receipts_amount ON receipts(amount);
CREATE INDEX IF NOT EXISTS ix_receipts_category ON receipts(category);
CREATE INDEX IF NOT EXISTS ix_receipts_status ON receipts(status);
CREATE INDEX IF NOT EXISTS ix_receipts_upload_date ON receipts(upload_date);
CREATE INDEX IF NOT EXISTS ix_date_amount ON receipts(date, amount);
CREATE INDEX IF NOT EXISTS ix_vendor_category ON receipts(vendor, category);
CREATE INDEX IF NOT EXISTS ix_status_date ON receipts(status, date);
"""