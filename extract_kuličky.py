#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script pro extrakci všech kuliček z KOULIO dokumentu pro lekce 4-14.
"""

import os
import sys
import re
from pathlib import Path

# Nastavení UTF-8 pro Windows
if sys.platform.startswith('win'):
    import locale
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.detach())

try:
    import pdfplumber
except ImportError:
    print("Installing pdfplumber...")
    os.system("pip install pdfplumber")
    import pdfplumber

def extract_all_kuličky():
    """Extrahuje všechny kuličky z KOULIO dokumentu."""
    pdf_path = "KOULIO_KOMPLETNI_SLOUCENY_DOKUMENT.pdf"
    
    if not os.path.exists(pdf_path):
        print(f"Soubor {pdf_path} nebyl nalezen!")
        return
    
    print("Extrahuji všechny kuličky z KOULIO dokumentu...")
    
    lessons_kuličky = {
        4: [],  # Situace bohatství
        5: [],  # Rodinné vztahy
        6: [],  # Prenatální období
        7: [],  # Škola a dospívání
        8: [],  # Vztah muž a žena
        9: [],  # Přijetí těla
        10: [], # Sexualita
        11: [], # Profesní život
        12: [], # Společný život
        13: [], # Těhotenství
        14: []  # Obecné pravdy
    }
    
    current_lesson = None
    in_kuličky_section = False
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            total_pages = len(pdf.pages)
            print(f"Celkem stránek: {total_pages}")
            
            for page_num in range(total_pages):
                try:
                    page = pdf.pages[page_num]
                    text = page.extract_text()
                    
                    if text:
                        lines = [line.strip() for line in text.split('\n') if line.strip()]
                        
                        for line in lines:
                            # Hledáme začátky lekcí
                            if any(keyword in line for keyword in ['SITUACE BOHATSTVÍ', 'RODINNÉ VZTAHY', 'PRENATÁLNÍ OBDOBÍ', 
                                                                 'ŠKOLA A DOSPÍVÁNÍ', 'MUŽ A ŽENA', 'PŘIJETÍ SVÉHO TĚLA',
                                                                 'SEXUALITA', 'PROFESNÍ ŽIVOT', 'SPOLEČNÝ ŽIVOT', 
                                                                 'TĚHOTENSTVÍ', 'OBECNĚ ZNÁMÉ']):
                                # Identifikujeme lekci
                                if 'SITUACE BOHATSTVÍ' in line or 'BOHATSTVÍ' in line:
                                    current_lesson = 4
                                elif 'RODINNÉ VZTAHY' in line:
                                    current_lesson = 5
                                elif 'PRENATÁLNÍ OBDOBÍ' in line:
                                    current_lesson = 6
                                elif 'ŠKOLA A DOSPÍVÁNÍ' in line:
                                    current_lesson = 7
                                elif 'MUŽ A ŽENA' in line:
                                    current_lesson = 8
                                elif 'PŘIJETÍ SVÉHO TĚLA' in line:
                                    current_lesson = 9
                                elif 'SEXUALITA' in line:
                                    current_lesson = 10
                                elif 'PROFESNÍ ŽIVOT' in line:
                                    current_lesson = 11
                                elif 'SPOLEČNÝ ŽIVOT' in line:
                                    current_lesson = 12
                                elif 'TĚHOTENSTVÍ' in line:
                                    current_lesson = 13
                                elif 'OBECNĚ ZNÁMÉ' in line:
                                    current_lesson = 14
                                
                                in_kuličky_section = False
                                continue
                            
                            # Kontrola, zda jsme v sekci kuliček
                            if 'KULIČKY' in line:
                                in_kuličky_section = True
                                continue
                            
                            # Pokud jsme v sekci kuliček, sbíráme je
                            if in_kuličky_section and current_lesson and current_lesson in lessons_kuličky:
                                # Kuličky jsou obvykle krátké řádky s traumatickými elementy
                                if (line and 
                                    len(line) > 5 and 
                                    len(line) < 200 and
                                    not line.startswith('A C A D E M Y') and
                                    not line.startswith('www.') and
                                    '©' not in line and
                                    'info@koulio.com' not in line and
                                    not line.isdigit() and
                                    'T-' not in line and
                                    'verze' not in line.lower()):
                                    
                                    # Vyčistíme řádek od číslování a speciálních znaků
                                    clean_line = re.sub(r'^\d+\.\s*', '', line)
                                    clean_line = re.sub(r'^•\s*', '', clean_line)
                                    clean_line = re.sub(r'^-\s*', '', clean_line)
                                    clean_line = clean_line.strip()
                                    
                                    if clean_line and clean_line not in lessons_kuličky[current_lesson]:
                                        lessons_kuličky[current_lesson].append(clean_line)
                            
                            # Také hledáme kuličky, které začínají tečkami nebo čárkami
                            elif current_lesson and current_lesson in lessons_kuličky:
                                if (line.startswith('•') or line.startswith('-') or 
                                    (line and len(line) > 10 and len(line) < 150 and 
                                     not any(skip in line for skip in ['A C A D E M Y', 'www.', '©', 'info@', 'T-', 'verze']))):
                                    
                                    clean_line = re.sub(r'^•\s*', '', line)
                                    clean_line = re.sub(r'^-\s*', '', clean_line)
                                    clean_line = clean_line.strip()
                                    
                                    if clean_line and clean_line not in lessons_kuličky[current_lesson]:
                                        lessons_kuličky[current_lesson].append(clean_line)
                            
                except Exception as e:
                    print(f"Chyba při zpracování stránky {page_num + 1}: {e}")
                    continue
        
        # Vypíšeme výsledky
        print_results(lessons_kuličky)
        
    except Exception as e:
        print(f"Chyba při otevírání PDF: {e}")

def print_results(lessons_kuličky):
    """Vypíše výsledky extrakce kuliček."""
    print("\n" + "=" * 80)
    print("EXTRAKCE KULIČEK PRO LEKCE 4-14")
    print("=" * 80)
    
    lesson_names = {
        4: "Situace bohatství",
        5: "Rodinné vztahy", 
        6: "Prenatální období",
        7: "Škola a dospívání",
        8: "Vztah muž a žena",
        9: "Přijetí těla",
        10: "Sexualita",
        11: "Profesní život",
        12: "Společný život",
        13: "Těhotenství",
        14: "Obecné pravdy"
    }
    
    for lesson_num, kuličky in lessons_kuličky.items():
        print(f"\n📚 LEKCE {lesson_num}: {lesson_names[lesson_num]}")
        print(f"Počet kuliček: {len(kuličky)}")
        print("-" * 60)
        
        for i, kulička in enumerate(kuličky[:20], 1):  # Zobrazíme prvních 20
            print(f"{i:2d}. {kulička}")
        
        if len(kuličky) > 20:
            print(f"... a dalších {len(kuličky) - 20} kuliček")
        
        print("\n" + "=" * 80)

if __name__ == "__main__":
    extract_all_kuličky()
