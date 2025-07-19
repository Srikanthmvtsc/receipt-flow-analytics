# Receipt Analytics Backend

A Python FastAPI backend for processing receipts and bills with OCR capabilities, implementing efficient search, sorting, and aggregation algorithms.

## Features

- **File Processing**: Supports .jpg, .png, .pdf, .txt files
- **OCR Processing**: Extracts text and structured data from receipts
- **Search Algorithms**: Keyword, range, and pattern-based search
- **Sorting Algorithms**: Efficient multi-field sorting (Timsort)
- **Aggregation Functions**: Statistical analysis with sum, mean, median, mode
- **RESTful API**: Full CRUD operations with FastAPI
- **Database**: SQLite with optimized indexing

## Setup

1. **Install Dependencies**:
```bash
pip install -r requirements.txt
```

2. **Install Tesseract OCR**:
- **Ubuntu/Debian**: `sudo apt-get install tesseract-ocr`
- **macOS**: `brew install tesseract`
- **Windows**: Download from [GitHub](https://github.com/UB-Mannheim/tesseract/wiki)

3. **Install System Dependencies**:
```bash
# For file type detection
sudo apt-get install libmagic1

# For image processing
sudo apt-get install python3-opencv
```

4. **Configure Environment**:
Copy `.env` file and update with your credentials:
```bash
cp .env.example .env
```

5. **Initialize Database**:
```bash
python -c "from database import create_tables; create_tables()"
```

6. **Run Server**:
```bash
python main.py
# or
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Database Schema

```sql
CREATE TABLE receipts (
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

-- Optimized indexes for search performance
CREATE INDEX ix_receipts_vendor ON receipts(vendor);
CREATE INDEX ix_receipts_date ON receipts(date);
CREATE INDEX ix_receipts_amount ON receipts(amount);
CREATE INDEX ix_receipts_category ON receipts(category);
CREATE INDEX ix_date_amount ON receipts(date, amount);
CREATE INDEX ix_vendor_category ON receipts(vendor, category);
```

## API Endpoints

### Upload Receipt
```http
POST /upload
Content-Type: multipart/form-data

file: [receipt file]
```

### Get Receipts (with filtering and sorting)
```http
GET /receipts?keyword=walmart&sort_field=date&sort_direction=desc
```

### Get Statistics
```http
GET /stats
```

### Update Receipt
```http
PUT /receipts/{id}
Content-Type: application/json

{
  "vendor": "Updated Vendor",
  "amount": 123.45
}
```

### Delete Receipt
```http
DELETE /receipts/{id}
```

### Export Data
```http
GET /export/csv
GET /export/json
```

## Algorithm Implementations

### Search Algorithms (O(n) to O(log n))
- **Linear Search**: Basic field matching
- **Keyword Search**: Multi-field text search
- **Range Search**: Numerical and date ranges
- **Pattern Search**: Regex-based matching

### Sorting Algorithms (O(n log n))
- **Timsort**: Python's native sorting (hybrid merge-insertion sort)
- **Multi-field Sort**: Custom priority-based sorting
- **Quicksort**: Custom implementation for comparison

### Aggregation Functions
- **Basic Statistics**: Sum, mean, median, mode calculation
- **Frequency Distribution**: Vendor and category histograms
- **Time-series Analysis**: Monthly spending trends
- **Moving Averages**: Trend analysis with sliding windows

## OCR Processing

The system uses Tesseract OCR with image preprocessing:

1. **Image Enhancement**: Gaussian blur, thresholding, morphological operations
2. **Text Extraction**: Multi-format support (images, PDFs, text files)
3. **Data Parsing**: Regex-based extraction of vendor, date, amount, category
4. **Confidence Scoring**: Quality assessment of extraction results

## File Structure

```
backend/
├── main.py              # FastAPI application
├── database.py          # SQLAlchemy models and database setup
├── models.py            # Pydantic models for validation
├── ocr_processor.py     # OCR and text processing logic
├── algorithms.py        # Search, sort, and aggregation algorithms
├── requirements.txt     # Python dependencies
├── .env                 # Environment configuration
└── uploads/            # Temporary file storage
```

## Performance Optimizations

1. **Database Indexing**: Composite indexes for common query patterns
2. **Caching**: In-memory caching of frequent queries
3. **Batch Processing**: Bulk operations for large datasets
4. **Async Operations**: FastAPI async support for I/O operations
5. **Memory Management**: Efficient data structures and algorithms

## Error Handling

- **File Validation**: Type, size, and format checking
- **OCR Failures**: Graceful degradation with manual input options
- **Database Errors**: Transaction rollback and error reporting
- **API Errors**: Structured error responses with details

## Testing

Run the test suite:
```bash
pytest tests/
```

## Production Deployment

1. **Use Production WSGI Server**:
```bash
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
```

2. **Database Migration**: Use Alembic for schema changes
3. **Security**: Enable HTTPS, rate limiting, authentication
4. **Monitoring**: Add logging, metrics, and health checks

## License

MIT License - see LICENSE file for details.