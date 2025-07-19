from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import shutil
from datetime import datetime
import magic
import json

from database import get_db, create_tables, Receipt
from models import (
    ReceiptCreate, ReceiptUpdate, ReceiptResponse, 
    SearchFilters, SortOptions, StatsResponse, FileUploadResponse
)
from ocr_processor import OCRProcessor
from algorithms import ComplexQueryEngine

app = FastAPI(title="Receipt Analytics API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # Add your frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize processors
ocr_processor = OCRProcessor()
query_engine = ComplexQueryEngine()

# Create upload directory
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Create database tables
create_tables()

@app.get("/")
async def root():
    return {"message": "Receipt Analytics API", "version": "1.0.0"}

@app.post("/upload", response_model=FileUploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload and process receipt file"""
    
    # Validate file type
    allowed_types = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
        'application/pdf', 'text/plain'
    ]
    
    # Read file content to determine type
    file_content = await file.read()
    file_type = magic.from_buffer(file_content, mime=True)
    
    if file_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {file_type}")
    
    # Check file size (10MB limit)
    file_size = len(file_content)
    if file_size > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")
    
    # Save file
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    try:
        with open(file_path, "wb") as buffer:
            buffer.write(file_content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    # Process file with OCR
    try:
        extracted_text, parsed_data, confidence = ocr_processor.process_file(file_path, file_type)
        
        # Create receipt record
        receipt_data = ReceiptCreate(
            file_name=file.filename,
            vendor=parsed_data.get('vendor'),
            date=parsed_data.get('date'),
            amount=float(parsed_data.get('amount', 0)) if parsed_data.get('amount') else None,
            category=parsed_data.get('category'),
            file_type=file_type,
            file_size=file_size,
            extracted_text=extracted_text,
            confidence_score=confidence
        )
        
        # Save to database
        db_receipt = Receipt(
            file_name=receipt_data.file_name,
            vendor=receipt_data.vendor,
            date=receipt_data.date,
            amount=receipt_data.amount,
            category=receipt_data.category,
            description=receipt_data.description,
            upload_date=datetime.now(),
            file_type=receipt_data.file_type,
            file_size=receipt_data.file_size,
            status="processed",
            extracted_text=receipt_data.extracted_text,
            confidence_score=receipt_data.confidence_score
        )
        
        db.add(db_receipt)
        db.commit()
        db.refresh(db_receipt)
        
        # Clean up uploaded file
        os.remove(file_path)
        
        return FileUploadResponse(
            message="File uploaded and processed successfully",
            receipt_id=db_receipt.id,
            filename=file.filename,
            processing_status="completed"
        )
        
    except Exception as e:
        # Clean up file on error
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

@app.get("/receipts", response_model=List[ReceiptResponse])
async def get_receipts(
    keyword: Optional[str] = Query(None),
    vendor: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    amount_min: Optional[float] = Query(None),
    amount_max: Optional[float] = Query(None),
    sort_field: str = Query("date"),
    sort_direction: str = Query("desc"),
    db: Session = Depends(get_db)
):
    """Get receipts with filtering and sorting"""
    
    # Get all receipts from database
    receipts_query = db.query(Receipt)
    receipts = receipts_query.all()
    
    # Convert to dict format for algorithm processing
    receipts_data = []
    for receipt in receipts:
        receipts_data.append({
            'id': receipt.id,
            'file_name': receipt.file_name,
            'vendor': receipt.vendor,
            'date': receipt.date,
            'amount': receipt.amount,
            'category': receipt.category,
            'description': receipt.description,
            'upload_date': receipt.upload_date,
            'file_type': receipt.file_type,
            'file_size': receipt.file_size,
            'status': receipt.status,
            'extracted_text': receipt.extracted_text,
            'confidence_score': receipt.confidence_score
        })
    
    # Apply filters and sorting using algorithms
    filters = {
        'keyword': keyword,
        'vendor': vendor,
        'category': category,
        'date_from': date_from,
        'date_to': date_to,
        'amount_min': amount_min,
        'amount_max': amount_max
    }
    
    sort_options = {
        'field': sort_field,
        'direction': sort_direction
    }
    
    result = query_engine.execute_query(receipts_data, filters, sort_options)
    
    return result['data']

@app.get("/receipts/{receipt_id}", response_model=ReceiptResponse)
async def get_receipt(receipt_id: int, db: Session = Depends(get_db)):
    """Get specific receipt by ID"""
    receipt = db.query(Receipt).filter(Receipt.id == receipt_id).first()
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    return receipt

@app.put("/receipts/{receipt_id}", response_model=ReceiptResponse)
async def update_receipt(
    receipt_id: int,
    receipt_update: ReceiptUpdate,
    db: Session = Depends(get_db)
):
    """Update receipt data"""
    receipt = db.query(Receipt).filter(Receipt.id == receipt_id).first()
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    
    # Update fields
    for field, value in receipt_update.dict(exclude_unset=True).items():
        setattr(receipt, field, value)
    
    db.commit()
    db.refresh(receipt)
    return receipt

@app.delete("/receipts/{receipt_id}")
async def delete_receipt(receipt_id: int, db: Session = Depends(get_db)):
    """Delete receipt"""
    receipt = db.query(Receipt).filter(Receipt.id == receipt_id).first()
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    
    db.delete(receipt)
    db.commit()
    return {"message": "Receipt deleted successfully"}

@app.get("/stats", response_model=StatsResponse)
async def get_statistics(db: Session = Depends(get_db)):
    """Get comprehensive statistics"""
    receipts = db.query(Receipt).all()
    
    # Convert to dict format
    receipts_data = []
    for receipt in receipts:
        receipts_data.append({
            'id': receipt.id,
            'vendor': receipt.vendor,
            'date': receipt.date,
            'amount': receipt.amount or 0,
            'category': receipt.category,
            'upload_date': receipt.upload_date
        })
    
    # Generate statistics using algorithms
    amounts = [float(r['amount']) for r in receipts_data if r['amount']]
    basic_stats = query_engine.aggregate.calculate_basic_stats(amounts)
    
    vendor_stats = query_engine.aggregate.vendor_aggregation(receipts_data)
    category_stats = query_engine.aggregate.category_aggregation(receipts_data)
    monthly_stats = query_engine.aggregate.time_series_aggregation(receipts_data)
    
    return StatsResponse(
        total_spend=basic_stats['sum'],
        total_receipts=len(receipts_data),
        average_amount=basic_stats['mean'],
        median_amount=basic_stats['median'],
        mode_amount=basic_stats['mode'],
        top_vendors=vendor_stats[:5],
        category_spending=category_stats,
        monthly_spending=monthly_stats
    )

@app.get("/export/csv")
async def export_csv(db: Session = Depends(get_db)):
    """Export receipts as CSV"""
    import csv
    import io
    from fastapi.responses import StreamingResponse
    
    receipts = db.query(Receipt).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        'ID', 'File Name', 'Vendor', 'Date', 'Amount', 'Category',
        'Description', 'Upload Date', 'Status', 'Confidence Score'
    ])
    
    # Write data
    for receipt in receipts:
        writer.writerow([
            receipt.id,
            receipt.file_name,
            receipt.vendor or '',
            receipt.date or '',
            receipt.amount or 0,
            receipt.category or '',
            receipt.description or '',
            receipt.upload_date,
            receipt.status,
            receipt.confidence_score
        ])
    
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=receipts.csv"}
    )

@app.get("/export/json")
async def export_json(db: Session = Depends(get_db)):
    """Export receipts as JSON"""
    from fastapi.responses import JSONResponse
    
    receipts = db.query(Receipt).all()
    
    data = []
    for receipt in receipts:
        data.append({
            'id': receipt.id,
            'file_name': receipt.file_name,
            'vendor': receipt.vendor,
            'date': receipt.date,
            'amount': receipt.amount,
            'category': receipt.category,
            'description': receipt.description,
            'upload_date': receipt.upload_date.isoformat() if receipt.upload_date else None,
            'file_type': receipt.file_type,
            'file_size': receipt.file_size,
            'status': receipt.status,
            'confidence_score': receipt.confidence_score
        })
    
    return JSONResponse(content=data)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)