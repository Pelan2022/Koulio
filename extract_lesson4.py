#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import fitz  # PyMuPDF
import re

def extract_text_from_pdf(pdf_path):
    """Extrahuje text z PDF souboru."""
    doc = fitz.open(pdf_path)
    text = ""
    
    for page_num in range(doc.page_count):
        page = doc.load_page(page_num)
        text += page.get_text("text") + "\n"
    
    doc.close()
    return text

def main():
    pdf_path = "lesson4_wealth.pdf"
    print(f"Loading content from {pdf_path}...")
    
    try:
        text = extract_text_from_pdf(pdf_path)
        print(f"Loaded {len(text)} characters of text")
        
        # Zobrazíme prvních 1000 znaků pro orientaci
        print("\nFirst 1000 characters:")
        print(text[:1000])
        print("\n" + "="*50)
        
        # Najdeme všechny řádky s potenciálními kuličkami
        lines = text.split('\n')
        potential_kulicky = []
        
        for line in lines:
            line = line.strip()
            if line and len(line) > 10:
                # Filtrujeme nadpisy
                if not any(keyword in line.lower() for keyword in [
                    'lekce', 'kapitola', 'tema', 'uvod', 'zaver', 
                    'stranka', 'page', '©', 'copyright', 'pdf'
                ]):
                    potential_kulicky.append(line)
        
        print(f"\nFound {len(potential_kulicky)} potential kulicky:")
        for i, kulicka in enumerate(potential_kulicky[:30], 1):
            print(f"  {i}. {kulicka}")
            
        if len(potential_kulicky) > 30:
            print(f"  ... and {len(potential_kulicky) - 30} more")
                
    except Exception as e:
        print(f"Error processing PDF: {e}")

if __name__ == "__main__":
    main()
