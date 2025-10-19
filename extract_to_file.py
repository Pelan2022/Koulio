#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import fitz  # PyMuPDF

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
    
    try:
        text = extract_text_from_pdf(pdf_path)
        
        # Zapisujeme do souboru místo tisku
        with open("lesson4_content.txt", "w", encoding="utf-8") as f:
            f.write(f"Extracted content from {pdf_path}\n")
            f.write(f"Total characters: {len(text)}\n")
            f.write("="*50 + "\n\n")
            f.write(text)
        
        print("Content extracted and saved to lesson4_content.txt")
        
        # Zobrazíme základní informace
        lines = text.split('\n')
        non_empty_lines = [line.strip() for line in lines if line.strip()]
        
        print(f"Total lines: {len(lines)}")
        print(f"Non-empty lines: {len(non_empty_lines)}")
        
        # Najdeme potenciální kuličky
        potential_items = []
        for line in non_empty_lines:
            if len(line) > 10:
                potential_items.append(line)
        
        print(f"Potential kulicky: {len(potential_items)}")
        
        # Uložíme kuličky do separátního souboru
        with open("lesson4_kulicky.txt", "w", encoding="utf-8") as f:
            f.write("Potential kulicky from lesson 4:\n")
            f.write("="*40 + "\n\n")
            for i, item in enumerate(potential_items, 1):
                f.write(f"{i}. {item}\n")
        
        print("Potential kulicky saved to lesson4_kulicky.txt")
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
