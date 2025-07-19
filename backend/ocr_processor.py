import pytesseract
import cv2
import numpy as np
from PIL import Image
import PyPDF2
import re
from datetime import datetime
from typing import Dict, Optional, Tuple
import os

class OCRProcessor:
    def __init__(self):
        # Vendor category mapping for automatic categorization
        self.vendor_categories = {
            'walmart': 'Groceries',
            'target': 'Groceries',
            'costco': 'Groceries',
            'safeway': 'Groceries',
            'kroger': 'Groceries',
            'starbucks': 'Food & Beverage',
            'mcdonalds': 'Food & Beverage',
            'subway': 'Food & Beverage',
            'shell': 'Transportation',
            'chevron': 'Transportation',
            'exxon': 'Transportation',
            'bp': 'Transportation',
            'cvs': 'Healthcare',
            'walgreens': 'Healthcare',
            'rite aid': 'Healthcare',
            'powercorp': 'Utilities',
            'pg&e': 'Utilities',
            'edison': 'Utilities',
            'technet': 'Internet',
            'comcast': 'Internet',
            'verizon': 'Internet',
            'att': 'Internet',
        }
    
    def preprocess_image(self, image_path: str) -> np.ndarray:
        """Preprocess image for better OCR results"""
        img = cv2.imread(image_path)
        
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Apply Gaussian blur to reduce noise
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Apply threshold to get a binary image
        _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # Morphological operations to clean up the image
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        processed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
        
        return processed
    
    def extract_text_from_image(self, image_path: str) -> str:
        """Extract text from image using OCR"""
        try:
            # Preprocess the image
            processed_img = self.preprocess_image(image_path)
            
            # Configure Tesseract
            custom_config = r'--oem 3 --psm 6'
            text = pytesseract.image_to_string(processed_img, config=custom_config)
            
            return text.strip()
        except Exception as e:
            print(f"Error extracting text from image: {e}")
            return ""
    
    def extract_text_from_pdf(self, pdf_path: str) -> str:
        """Extract text from PDF file"""
        try:
            text = ""
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
            return text.strip()
        except Exception as e:
            print(f"Error extracting text from PDF: {e}")
            return ""
    
    def extract_text_from_txt(self, txt_path: str) -> str:
        """Extract text from text file"""
        try:
            with open(txt_path, 'r', encoding='utf-8') as file:
                return file.read().strip()
        except Exception as e:
            print(f"Error reading text file: {e}")
            return ""
    
    def parse_receipt_data(self, text: str) -> Dict[str, Optional[str]]:
        """Parse structured data from extracted text using regex patterns"""
        data = {
            'vendor': None,
            'date': None,
            'amount': None,
            'category': None
        }
        
        # Clean text for processing
        text_clean = re.sub(r'\s+', ' ', text.upper())
        
        # Extract vendor (look for common patterns)
        vendor_patterns = [
            r'(?:STORE|SHOP|MARKET|PHARMACY|STATION|CORP|INC|LLC|CO\.)?\s*([A-Z\s&]+)(?:\s*#\d+|\s*STORE|\s*SHOP)?',
            r'^([A-Z\s&]+?)(?:\s+\d+|\s+RECEIPT|\s+BILL)',
        ]
        
        for pattern in vendor_patterns:
            match = re.search(pattern, text_clean[:100])  # Check first 100 chars
            if match:
                vendor = match.group(1).strip()
                if len(vendor) > 2 and vendor not in ['RECEIPT', 'BILL', 'STORE', 'TOTAL']:
                    data['vendor'] = vendor.title()
                    break
        
        # Extract date patterns
        date_patterns = [
            r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
            r'(\d{4}[/-]\d{1,2}[/-]\d{1,2})',
            r'(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s*\d{1,2}[,\s]+\d{4}',
            r'\b(\d{1,2}\s+(?:JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)\s+\d{4})\b'
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, text_clean)
            if match:
                date_str = match.group(1)
                parsed_date = self.normalize_date(date_str)
                if parsed_date:
                    data['date'] = parsed_date
                    break
        
        # Extract amount (look for currency symbols and totals)
        amount_patterns = [
            r'TOTAL[:\s]*\$?(\d+[.,]\d{2})',
            r'AMOUNT[:\s]*\$?(\d+[.,]\d{2})',
            r'BALANCE[:\s]*\$?(\d+[.,]\d{2})',
            r'\$(\d+[.,]\d{2})\s*(?:TOTAL|DUE|AMOUNT)',
            r'(?:^|\s)\$(\d+\.\d{2})(?:\s|$)',
        ]
        
        for pattern in amount_patterns:
            match = re.search(pattern, text_clean)
            if match:
                amount_str = match.group(1).replace(',', '.')
                try:
                    data['amount'] = str(float(amount_str))
                    break
                except ValueError:
                    continue
        
        # Determine category based on vendor
        if data['vendor']:
            vendor_lower = data['vendor'].lower()
            for vendor_key, category in self.vendor_categories.items():
                if vendor_key in vendor_lower:
                    data['category'] = category
                    break
        
        return data
    
    def normalize_date(self, date_str: str) -> Optional[str]:
        """Normalize various date formats to YYYY-MM-DD"""
        date_str = date_str.strip()
        
        # Common date formats to try
        formats = [
            '%m/%d/%Y', '%m-%d-%Y', '%m/%d/%y', '%m-%d-%y',
            '%Y/%m/%d', '%Y-%m-%d',
            '%d/%m/%Y', '%d-%m-%Y', '%d/%m/%y', '%d-%m-%y',
            '%B %d, %Y', '%b %d, %Y',
            '%d %B %Y', '%d %b %Y'
        ]
        
        for fmt in formats:
            try:
                dt = datetime.strptime(date_str, fmt)
                return dt.strftime('%Y-%m-%d')
            except ValueError:
                continue
        
        return None
    
    def calculate_confidence_score(self, text: str, parsed_data: Dict) -> float:
        """Calculate confidence score based on extracted data quality"""
        score = 0.0
        max_score = 4.0
        
        # Text length indicator
        if len(text) > 50:
            score += 1.0
        elif len(text) > 20:
            score += 0.5
        
        # Vendor extraction
        if parsed_data.get('vendor'):
            score += 1.0
        
        # Date extraction
        if parsed_data.get('date'):
            score += 1.0
        
        # Amount extraction
        if parsed_data.get('amount'):
            score += 1.0
        
        return min(score / max_score, 1.0)
    
    def process_file(self, file_path: str, file_type: str) -> Tuple[str, Dict, float]:
        """Main processing function for any file type"""
        text = ""
        
        # Extract text based on file type
        if file_type.startswith('image/'):
            text = self.extract_text_from_image(file_path)
        elif file_type == 'application/pdf':
            text = self.extract_text_from_pdf(file_path)
        elif file_type.startswith('text/'):
            text = self.extract_text_from_txt(file_path)
        
        # Parse structured data
        parsed_data = self.parse_receipt_data(text)
        
        # Calculate confidence score
        confidence = self.calculate_confidence_score(text, parsed_data)
        
        return text, parsed_data, confidence