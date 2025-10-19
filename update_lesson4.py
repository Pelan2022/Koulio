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

def find_lesson4_content(text):
    """Najde obsah lekce 4 v textu."""
    # Hledáme začátek lekce 4
    lesson4_pattern = re.compile(r'4\.\s*SKUTEČNÉ\s*BOHATSTVÍ|LEKCE\s*4.*?SKUTEČNÉ\s*BOHATSTVÍ', re.IGNORECASE)
    match = lesson4_pattern.search(text)
    
    if match:
        start_pos = match.start()
        # Najdeme konec lekce 4 (začátek lekce 5 nebo konec dokumentu)
        lesson5_pattern = re.compile(r'5\.\s*RODINNÉ\s*VZTAHY|LEKCE\s*5', re.IGNORECASE)
        lesson5_match = lesson5_pattern.search(text[start_pos:])
        
        if lesson5_match:
            end_pos = start_pos + lesson5_match.start()
            return text[start_pos:end_pos]
        else:
            return text[start_pos:]
    
    return None

def extract_kulicky_from_lesson4(text):
    """Extrahuje kuličky z lekce 4."""
    kulicky = []
    
    # Hledáme sekce s kuličkami
    # Různé vzory pro kuličky
    patterns = [
        r'•\s*([^\n]+)',
        r'-\s*([^\n]+)',
        r'\d+\.\s*([^\n]+)',
        r'^\s*([^\n]+(?:\n\s+[^\n]+)*)'
    ]
    
    # Rozdělíme text na řádky
    lines = text.split('\n')
    
    for line in lines:
        line = line.strip()
        if line and len(line) > 10:  # Filtrujeme krátké řádky
            # Odfiltrujeme nadpisy a nepodstatné řádky
            if not any(keyword in line.lower() for keyword in [
                'lekce', 'kapitola', 'téma', 'úvod', 'závěr', 
                'stránka', 'page', '©', 'copyright'
            ]):
                # Přidáme kuličku
                kulicky.append(line)
    
    return kulicky

def main():
    # Načteme obsah z nového PDF
    pdf_path = "4. SKUTEČNÉ BOHATSTVÍ pracovní sešit.pdf"
    print(f"Nacitam obsah z {pdf_path}...")
    
    try:
        text = extract_text_from_pdf(pdf_path)
        print(f"Nacteno {len(text)} znaku textu")
        
        # Najdeme obsah lekce 4
        lesson4_content = find_lesson4_content(text)
        
        if lesson4_content:
            print(f"Nalezen obsah lekce 4 ({len(lesson4_content)} znaku)")
            
            # Extrahujeme kuličky
            kulicky = extract_kulicky_from_lesson4(lesson4_content)
            
            print(f"Extrahovano {len(kulicky)} kulicek:")
            for i, kulicka in enumerate(kulicky[:20], 1):  # Zobrazíme prvních 20
                print(f"  {i}. {kulicka}")
            
            if len(kulicky) > 20:
                print(f"  ... a dalsich {len(kulicky) - 20} kulicek")
                
        else:
            print("Obsah lekce 4 nebyl nalezen")
            # Zkusíme extrahovat všechny kuličky z dokumentu
            print("Zkousim extrahovat vsechny kulicky z dokumentu...")
            all_kulicky = extract_kulicky_from_lesson4(text)
            print(f"Celkem nalezeno {len(all_kulicky)} moznych kulicek")
            
            for i, kulicka in enumerate(all_kulicky[:30], 1):
                print(f"  {i}. {kulicka}")
                
    except Exception as e:
        print(f"Chyba pri zpracovani PDF: {e}")

if __name__ == "__main__":
    main()
