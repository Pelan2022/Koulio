#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import fitz  # PyMuPDF
import sys

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
    print("Loading content from lesson4_wealth.pdf...")
    
    try:
        text = extract_text_from_pdf(pdf_path)
        print(f"Loaded {len(text)} characters of text")
        
        # Zobrazíme text bez problémů s kódováním
        print("\nContent preview:")
        # Použijeme encode/decode pro zobrazení
        try:
            print(text[:1000])
        except:
            # Pokud stále problém, zobrazíme jako bytes
            print(text.encode('utf-8', errors='ignore').decode('utf-8')[:1000])
        
        print("\n" + "="*50)
        
        # Najdeme všechny řádky
        lines = text.split('\n')
        potential_items = []
        
        for line in lines:
            line = line.strip()
            if line and len(line) > 10:
                potential_items.append(line)
        
        print(f"\nFound {len(potential_items)} potential items:")
        for i, item in enumerate(potential_items[:30], 1):
            try:
                print(f"  {i}. {item}")
            except:
                # Pokud problém s kódováním, zobrazíme jako bytes
                safe_item = item.encode('utf-8', errors='ignore').decode('utf-8')
                print(f"  {i}. {safe_item}")
                
        if len(potential_items) > 30:
            print(f"  ... and {len(potential_items) - 30} more")
                
    except Exception as e:
        print(f"Error processing PDF: {e}")

if __name__ == "__main__":
    main()
