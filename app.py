#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
KOULIO Backend API
Profesionální autentifikační systém s databází
"""

import os
import hashlib
import secrets
from datetime import datetime, timedelta
from functools import wraps
import json

from flask import Flask, request, jsonify, g
from flask_cors import CORS
import bcrypt
import jwt

# Konfigurace aplikace
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', secrets.token_urlsafe(32))
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', secrets.token_urlsafe(32))
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)

# Povolení CORS pro frontend
CORS(app, origins=['http://localhost:3000', 'https://unrollit.aici.cz'])

# Import MCP PostgreSQL client
import mcp_postgres

# Inicializace databázového připojení
db = mcp_postgres

def get_db_connection():
    """Získání databázového připojení"""
    return db

def hash_password(password):
    """Hashování hesla pomocí bcrypt"""
    salt = bcrypt.gensalt()
    password_hash = bcrypt.hashpw(password.encode('utf-8'), salt)
    return password_hash.decode('utf-8')

def verify_password(password, password_hash):
    """Ověření hesla proti hash"""
    return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))

def generate_tokens(user_id, email):
    """Generování JWT tokenů"""
    access_token = jwt.encode({
        'user_id': str(user_id),
        'email': email,
        'exp': datetime.utcnow() + app.config['JWT_ACCESS_TOKEN_EXPIRES']
    }, app.config['JWT_SECRET_KEY'], algorithm='HS256')
    
    refresh_token = jwt.encode({
        'user_id': str(user_id),
        'exp': datetime.utcnow() + app.config['JWT_REFRESH_TOKEN_EXPIRES']
    }, app.config['JWT_SECRET_KEY'], algorithm='HS256')
    
    return access_token, refresh_token

def token_required(f):
    """Dekorátor pro ochranu endpointů vyžadujících autentifikaci"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Kontrola Authorization headeru
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(' ')[1]  # Bearer <token>
            except IndexError:
                return jsonify({'error': 'Invalid token format'}), 401
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            data = jwt.decode(token, app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
            g.current_user_id = data['user_id']
            g.current_user_email = data['email']
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        
        return f(*args, **kwargs)
    
    return decorated

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'version': '1.0.0'
    })

@app.route('/api/register', methods=['POST'])
def register():
    """Registrace nového uživatele"""
    try:
        data = request.get_json()
        
        # Validace vstupních dat
        if not data or not all(k in data for k in ('email', 'password', 'full_name')):
            return jsonify({'error': 'Missing required fields'}), 400
        
        email = data['email'].lower().strip()
        password = data['password']
        full_name = data['full_name'].strip()
        
        # Validace emailu
        if '@' not in email or '.' not in email:
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Validace hesla
        if len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters long'}), 400
        
        # Kontrola existence uživatele
        conn = get_db_connection()
        existing_user = conn.execute_query(
            "SELECT id FROM users WHERE email = %s",
            (email,)
        )
        
        if existing_user:
            return jsonify({'error': 'User with this email already exists'}), 409
        
        # Hashování hesla
        password_hash = hash_password(password)
        
        # Vytvoření nového uživatele
        user_id = conn.execute_query(
            """INSERT INTO users (email, password_hash, full_name, created_at, updated_at, is_active)
               VALUES (%s, %s, %s, %s, %s, %s) RETURNING id""",
            (email, password_hash, full_name, datetime.utcnow(), datetime.utcnow(), True)
        )
        
        # Generování tokenů
        access_token, refresh_token = generate_tokens(user_id[0]['id'], email)
        
        return jsonify({
            'message': 'User registered successfully',
            'user': {
                'id': str(user_id[0]['id']),
                'email': email,
                'full_name': full_name
            },
            'access_token': access_token,
            'refresh_token': refresh_token
        }), 201
        
    except Exception as e:
        app.logger.error(f"Registration error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    """Přihlášení uživatele"""
    try:
        data = request.get_json()
        
        if not data or not all(k in data for k in ('email', 'password')):
            return jsonify({'error': 'Email and password are required'}), 400
        
        email = data['email'].lower().strip()
        password = data['password']
        
        # Vyhledání uživatele v databázi
        conn = get_db_connection()
        user = conn.execute_query(
            "SELECT id, email, password_hash, full_name, is_active FROM users WHERE email = %s",
            (email,)
        )
        
        if not user:
            return jsonify({'error': 'Invalid credentials'}), 401
        
        user = user[0]
        
        # Kontrola aktivního stavu
        if not user['is_active']:
            return jsonify({'error': 'Account is deactivated'}), 401
        
        # Ověření hesla
        if not verify_password(password, user['password_hash']):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Aktualizace posledního přihlášení
        conn.execute_query(
            "UPDATE users SET last_login = %s WHERE id = %s",
            (datetime.utcnow(), user['id'])
        )
        
        # Generování tokenů
        access_token, refresh_token = generate_tokens(user['id'], user['email'])
        
        return jsonify({
            'message': 'Login successful',
            'user': {
                'id': str(user['id']),
                'email': user['email'],
                'full_name': user['full_name']
            },
            'access_token': access_token,
            'refresh_token': refresh_token
        }), 200
        
    except Exception as e:
        app.logger.error(f"Login error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/refresh', methods=['POST'])
def refresh_token():
    """Obnovení access tokenu pomocí refresh tokenu"""
    try:
        data = request.get_json()
        
        if not data or 'refresh_token' not in data:
            return jsonify({'error': 'Refresh token is required'}), 400
        
        refresh_token = data['refresh_token']
        
        try:
            payload = jwt.decode(refresh_token, app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
            user_id = payload['user_id']
            
            # Získání uživatele z databáze
            conn = get_db_connection()
            user = conn.execute_query(
                "SELECT id, email, full_name, is_active FROM users WHERE id = %s",
                (user_id,)
            )
            
            if not user:
                return jsonify({'error': 'User not found'}), 401
            
            user = user[0]
            
            if not user['is_active']:
                return jsonify({'error': 'Account is deactivated'}), 401
            
            # Generování nového access tokenu
            access_token, new_refresh_token = generate_tokens(user['id'], user['email'])
            
            return jsonify({
                'access_token': access_token,
                'refresh_token': new_refresh_token
            }), 200
            
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Refresh token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid refresh token'}), 401
            
    except Exception as e:
        app.logger.error(f"Token refresh error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/profile', methods=['GET'])
@token_required
def get_profile():
    """Získání profilu uživatele"""
    try:
        conn = get_db_connection()
        user = conn.execute_query(
            """SELECT id, email, full_name, created_at, updated_at, last_login, is_active 
               FROM users WHERE id = %s""",
            (g.current_user_id,)
        )
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user = user[0]
        
        return jsonify({
            'user': {
                'id': str(user['id']),
                'email': user['email'],
                'full_name': user['full_name'],
                'created_at': user['created_at'].isoformat() if user['created_at'] else None,
                'updated_at': user['updated_at'].isoformat() if user['updated_at'] else None,
                'last_login': user['last_login'].isoformat() if user['last_login'] else None,
                'is_active': user['is_active']
            }
        }), 200
        
    except Exception as e:
        app.logger.error(f"Get profile error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/profile', methods=['PUT'])
@token_required
def update_profile():
    """Aktualizace profilu uživatele"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        conn = get_db_connection()
        
        # Kontrola, zda uživatel existuje
        user = conn.execute_query(
            "SELECT id FROM users WHERE id = %s",
            (g.current_user_id,)
        )
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Příprava dat pro aktualizaci
        update_fields = []
        update_values = []
        
        if 'full_name' in data and data['full_name']:
            update_fields.append('full_name = %s')
            update_values.append(data['full_name'].strip())
        
        if 'email' in data and data['email']:
            email = data['email'].lower().strip()
            if '@' not in email or '.' not in email:
                return jsonify({'error': 'Invalid email format'}), 400
            
            # Kontrola, zda email není už použit jiným uživatelem
            existing = conn.execute_query(
                "SELECT id FROM users WHERE email = %s AND id != %s",
                (email, g.current_user_id)
            )
            
            if existing:
                return jsonify({'error': 'Email is already in use'}), 409
            
            update_fields.append('email = %s')
            update_values.append(email)
        
        if not update_fields:
            return jsonify({'error': 'No valid fields to update'}), 400
        
        # Přidání updated_at
        update_fields.append('updated_at = %s')
        update_values.append(datetime.utcnow())
        
        # Přidání user_id pro WHERE klauzuli
        update_values.append(g.current_user_id)
        
        # Aktualizace v databázi
        conn.execute_query(
            f"UPDATE users SET {', '.join(update_fields)} WHERE id = %s",
            tuple(update_values)
        )
        
        return jsonify({'message': 'Profile updated successfully'}), 200
        
    except Exception as e:
        app.logger.error(f"Update profile error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/change-password', methods=['POST'])
@token_required
def change_password():
    """Změna hesla uživatele"""
    try:
        data = request.get_json()
        
        if not data or not all(k in data for k in ('current_password', 'new_password')):
            return jsonify({'error': 'Current password and new password are required'}), 400
        
        current_password = data['current_password']
        new_password = data['new_password']
        
        # Validace nového hesla
        if len(new_password) < 6:
            return jsonify({'error': 'New password must be at least 6 characters long'}), 400
        
        conn = get_db_connection()
        
        # Získání aktuálního hesla
        user = conn.execute_query(
            "SELECT password_hash FROM users WHERE id = %s",
            (g.current_user_id,)
        )
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Ověření aktuálního hesla
        if not verify_password(current_password, user[0]['password_hash']):
            return jsonify({'error': 'Current password is incorrect'}), 401
        
        # Hashování nového hesla
        new_password_hash = hash_password(new_password)
        
        # Aktualizace hesla
        conn.execute_query(
            "UPDATE users SET password_hash = %s, updated_at = %s WHERE id = %s",
            (new_password_hash, datetime.utcnow(), g.current_user_id)
        )
        
        return jsonify({'message': 'Password changed successfully'}), 200
        
    except Exception as e:
        app.logger.error(f"Change password error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/logout', methods=['POST'])
@token_required
def logout():
    """Odhlášení uživatele (na serveru pouze log)"""
    try:
        # V JWT implementaci není potřeba nic mazat na serveru
        # Tokeny se stávají neplatnými po expiraci
        app.logger.info(f"User {g.current_user_email} logged out")
        
        return jsonify({'message': 'Logged out successfully'}), 200
        
    except Exception as e:
        app.logger.error(f"Logout error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/delete-account', methods=['DELETE'])
@token_required
def delete_account():
    """Smazání účtu uživatele"""
    try:
        data = request.get_json()
        
        if not data or 'password' not in data:
            return jsonify({'error': 'Password confirmation is required'}), 400
        
        password = data['password']
        
        conn = get_db_connection()
        
        # Získání uživatele a ověření hesla
        user = conn.execute_query(
            "SELECT password_hash FROM users WHERE id = %s",
            (g.current_user_id,)
        )
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Ověření hesla
        if not verify_password(password, user[0]['password_hash']):
            return jsonify({'error': 'Password is incorrect'}), 401
        
        # Deaktivace účtu (soft delete)
        conn.execute_query(
            "UPDATE users SET is_active = %s, updated_at = %s WHERE id = %s",
            (False, datetime.utcnow(), g.current_user_id)
        )
        
        app.logger.info(f"Account {g.current_user_email} has been deactivated")
        
        return jsonify({'message': 'Account deleted successfully'}), 200
        
    except Exception as e:
        app.logger.error(f"Delete account error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({'error': 'Method not allowed'}), 405

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    # Konfigurace pro development
    debug_mode = os.environ.get('FLASK_ENV') == 'development'
    port = int(os.environ.get('PORT', 5000))
    
    print(f"🚀 Starting KOULIO API server...")
    print(f"📊 Database: PostgreSQL via MCP")
    print(f"🔐 Authentication: JWT tokens")
    print(f"🔒 Password hashing: bcrypt")
    print(f"🌐 CORS enabled for frontend")
    print(f"🔧 Debug mode: {debug_mode}")
    print(f"📍 Port: {port}")
    
    app.run(host='0.0.0.0', port=port, debug=debug_mode)
