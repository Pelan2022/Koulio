#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Startovací skript pro KOULIO Backend API
"""

import os
import sys
import subprocess
from pathlib import Path

def check_python_version():
    """Kontrola verze Pythonu"""
    if sys.version_info < (3, 8):
        print("❌ Vyžaduje se Python 3.8 nebo novější")
        sys.exit(1)
    print(f"✅ Python {sys.version.split()[0]}")

def install_requirements():
    """Instalace závislostí"""
    print("📦 Instalace závislostí...")
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], 
                      check=True, capture_output=True)
        print("✅ Závislosti nainstalovány")
    except subprocess.CalledProcessError as e:
        print(f"❌ Chyba při instalaci závislostí: {e}")
        sys.exit(1)

def create_env_file():
    """Vytvoření .env souboru pokud neexistuje"""
    env_file = Path(".env")
    if not env_file.exists():
        print("🔧 Vytváření .env souboru...")
        with open(env_file, "w", encoding="utf-8") as f:
            f.write("""# KOULIO Backend API Configuration
FLASK_ENV=development
SECRET_KEY=dev-secret-key-change-in-production
JWT_SECRET_KEY=dev-jwt-secret-key-change-in-production
PORT=5000
HOST=0.0.0.0
""")
        print("✅ .env soubor vytvořen")
    else:
        print("✅ .env soubor již existuje")

def check_mcp_connection():
    """Kontrola připojení k MCP serveru"""
    print("🔌 Kontrola připojení k MCP serveru...")
    try:
        import mcp_postgres
        # Zkusíme jednoduchý dotaz
        db = mcp_postgres
        result = db.execute_query("SELECT 1 as test")
        if result:
            print("✅ MCP PostgreSQL připojení funguje")
        else:
            print("❌ MCP PostgreSQL připojení selhalo")
            sys.exit(1)
    except ImportError:
        print("❌ MCP PostgreSQL modul není nainstalován")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Chyba při testování MCP připojení: {e}")
        sys.exit(1)

def start_server():
    """Spuštění Flask serveru"""
    print("🚀 Spouštění KOULIO Backend API...")
    print("📊 Database: PostgreSQL via MCP")
    print("🔐 Authentication: JWT tokens")
    print("🔒 Password hashing: bcrypt")
    print("🌐 CORS enabled for frontend")
    print("📍 URL: http://localhost:5000")
    print("📖 API Docs: http://localhost:5000/api/health")
    print("\n" + "="*50)
    
    try:
        # Spuštění Flask aplikace
        os.environ['FLASK_APP'] = 'app.py'
        subprocess.run([sys.executable, "app.py"], check=True)
    except KeyboardInterrupt:
        print("\n👋 Server zastaven uživatelem")
    except Exception as e:
        print(f"❌ Chyba při spouštění serveru: {e}")
        sys.exit(1)

def main():
    """Hlavní funkce"""
    print("🎯 KOULIO Backend API - Startovací skript")
    print("="*50)
    
    # Kontrola Python verze
    check_python_version()
    
    # Instalace závislostí
    install_requirements()
    
    # Vytvoření .env souboru
    create_env_file()
    
    # Kontrola MCP připojení
    check_mcp_connection()
    
    # Spuštění serveru
    start_server()

if __name__ == "__main__":
    main()
