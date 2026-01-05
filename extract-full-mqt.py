#!/usr/bin/env python3
"""
Extract complete MQT (Mapa de Quantidades) from GA00466-PENTHOUSESI PDF
Processes all 26 pages and extracts ~200+ items with full structure
"""

import json
import re
from pdf2image import convert_from_path
import pytesseract
from PIL import Image

def extract_mqt_from_pdf(pdf_path, start_page=1, end_page=26):
    """Extract MQT items from all pages of the PDF"""
    
    print(f"Converting PDF pages {start_page}-{end_page} to images...")
    images = convert_from_path(
        pdf_path,
        first_page=start_page,
        last_page=end_page,
        dpi=300
    )
    
    all_items = []
    current_category = None
    current_category_code = None
    item_counter = 0
    
    for page_num, image in enumerate(images, start=start_page):
        print(f"Processing page {page_num}/{end_page}...")
        
        # Extract text from image using OCR
        text = pytesseract.image_to_string(image, lang='por+eng')
        lines = text.split('\n')
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Detect category headers (e.g., "1. DEMOLIÇÕES / DEMOLITIONS")
            category_match = re.match(r'^(\d+)\.\s+([A-ZÇÃÕÁÉÍÓÚ\s/]+)$', line)
            if category_match:
                current_category_code = category_match.group(1)
                category_name = category_match.group(2)
                
                # Split PT/EN if present
                if '/' in category_name:
                    parts = category_name.split('/')
                    current_category = {
                        'code': current_category_code,
                        'namePt': parts[0].strip(),
                        'nameEn': parts[1].strip() if len(parts) > 1 else ''
                    }
                else:
                    current_category = {
                        'code': current_category_code,
                        'namePt': category_name.strip(),
                        'nameEn': ''
                    }
                print(f"  Found category: {current_category['code']}. {current_category['namePt']}")
                continue
            
            # Detect item lines (e.g., "1.1 Demolição Tipo Zona Descrição un 10")
            # Pattern: code type [subtype] [zone] description unit quantity
            item_match = re.match(
                r'^(\d+\.\d+)\s+(.+?)\s+(m²|m³|m|un|vg|cj|pç)\s+(\d+(?:[.,]\d+)?)$',
                line
            )
            
            if item_match and current_category:
                item_counter += 1
                code = item_match.group(1)
                description_part = item_match.group(2).strip()
                unit = item_match.group(3)
                quantity = item_match.group(4).replace(',', '.')
                
                # Try to parse description into type, subtype, zone, desc PT, desc EN
                # This is heuristic-based since the PDF structure varies
                parts = description_part.split()
                
                item = {
                    'code': code,
                    'categoryCode': current_category['code'],
                    'typePt': parts[0] if len(parts) > 0 else '',
                    'typeEn': '',
                    'subtypePt': parts[1] if len(parts) > 1 else '',
                    'subtypeEn': '',
                    'zonePt': '',
                    'zoneEn': '',
                    'descriptionPt': description_part,
                    'descriptionEn': '',
                    'unit': unit,
                    'quantity': float(quantity),
                    'order': item_counter
                }
                
                all_items.append(item)
    
    print(f"\nExtraction complete!")
    print(f"Total categories found: {len(set(item['categoryCode'] for item in all_items))}")
    print(f"Total items extracted: {len(all_items)}")
    
    return all_items

def main():
    pdf_path = "/home/ubuntu/upload/GA00466-PENTHOUSESI-PROPOSTASCLIENTE-GoogleSheets.pdf"
    output_path = "/home/ubuntu/gavinho_project_manager/mqt-full-data.json"
    
    print("Starting MQT extraction from PDF...")
    print(f"PDF: {pdf_path}")
    print(f"Output: {output_path}\n")
    
    items = extract_mqt_from_pdf(pdf_path)
    
    # Save to JSON
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(items, f, ensure_ascii=False, indent=2)
    
    print(f"\nData saved to: {output_path}")
    print(f"Ready to import into database!")

if __name__ == "__main__":
    main()
