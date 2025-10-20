# 💾 Dokumentace úložiště KOULIO aplikace

## 🔍 Shrnutí

**KOULIO aplikace NEPOUŽÍVÁ databázi!** Všechna data se ukládají lokálně v prohlížeči uživatele pomocí **localStorage**.

## 📊 Jak funguje úložiště

### 🗄️ Typ úložiště
- **localStorage** - Web Storage API prohlížeče
- **Lokální úložiště** - Data zůstávají pouze v prohlížeči uživatele
- **Žádná databáze** - Aplikace nekomunikuje s žádným serverem pro ukládání dat

### 🔑 Klíče v localStorage

#### Registrovaní uživatelé:
```javascript
'koulio_users' = JSON array uživatelů
```

#### Session data:
```javascript
'koulio_logged_in' = 'true' | 'false'
'koulio_user_email' = 'user@example.com'
'koulio_user_name' = 'Jméno Uživatele'
'koulio_user_demo' = 'true' | 'false'
```

### 📝 Struktura dat uživatele

```javascript
{
  "id": "timestamp_string",
  "fullName": "Celé jméno",
  "email": "email@example.com",
  "password": "heslo_v_plain_text", // ⚠️ Pro demo účely
  "createdAt": "2024-01-01T00:00:00.000Z",
  "isActive": true
}
```

## 🧪 Testování úložiště

### Otevření testovací stránky:
1. Otevřete `test_storage.html` v prohlížeči
2. Zkontrolujte všechna localStorage data
3. Vytvořte testovacího uživatele
4. Ověřte, že se data ukládají správně

### Manuální kontrola v prohlížeči:
1. Otevřete Developer Tools (F12)
2. Přejděte na záložku "Application" nebo "Storage"
3. V levém menu najděte "Local Storage"
4. Klikněte na doménu vašeho webu
5. Zkontrolujte klíče začínající na `koulio_`

## ⚠️ Důležité upozornění

### 🔒 Bezpečnost:
- **Hesla jsou uložena v plain text** (pro demo účely)
- **V produkční verzi by se měla hashovat** (bcrypt, argon2, atd.)
- **Data jsou dostupná pouze v prohlížeči uživatele**

### 📱 Kompatibilita:
- **localStorage funguje ve všech moderních prohlížečích**
- **Data přežijí restart prohlížeče**
- **Data se smažou při vymazání prohlížečových dat**

### 🚫 Omezení:
- **Data nejsou synchronizována mezi zařízeními**
- **Data se ztratí při vymazání prohlížeče**
- **Nelze sdílet data mezi uživateli**

## 🔄 Migrace na databázi

Pokud chcete přejít na databázové úložiště, bude potřeba:

### 1. Backend API:
```javascript
// Příklad API endpointů
POST /api/register - registrace uživatele
POST /api/login - přihlášení
GET /api/profile - získání profilu
PUT /api/profile - aktualizace profilu
DELETE /api/profile - smazání účtu
```

### 2. Databázové schéma:
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
```

### 3. Aktualizace frontendu:
- Nahradit localStorage volání za fetch() requesty
- Přidat error handling pro síťové chyby
- Implementovat token-based autentifikaci

## 📋 Současný stav

✅ **Funguje:**
- Registrace uživatelů (lokálně)
- Přihlášení (lokálně)
- Správa účtů (lokálně)
- Demo účet
- Session management

❌ **Nefunguje:**
- Synchronizace mezi zařízeními
- Sdílení dat mezi uživateli
- Zálohování dat
- Reset hesla

## 🎯 Doporučení

### Pro demo/testovací účely:
- **Současné řešení je vhodné**
- Rychlé nasazení
- Žádné serverové náklady
- Jednoduchá správa

### Pro produkční použití:
- **Implementovat backend API**
- **Použít databázi** (PostgreSQL, MySQL, MongoDB)
- **Hashovat hesla** (bcrypt, argon2)
- **Implementovat token-based auth** (JWT)
- **Přidat HTTPS**
- **Implementovat zálohování**

## 🧪 Testovací příkazy

```javascript
// Zobrazení všech uživatelů
console.log(JSON.parse(localStorage.getItem('koulio_users') || '[]'));

// Kontrola přihlášení
console.log(localStorage.getItem('koulio_logged_in'));

// Vymazání všech dat
localStorage.clear();

// Vytvoření testovacího uživatele
const testUser = {
    id: Date.now().toString(),
    fullName: 'Test User',
    email: 'test@koulio.cz',
    password: 'test123',
    createdAt: new Date().toISOString(),
    isActive: true
};
const users = JSON.parse(localStorage.getItem('koulio_users') || '[]');
users.push(testUser);
localStorage.setItem('koulio_users', JSON.stringify(users));
```

---

**Závěr:** KOULIO aplikace používá localStorage pro úložiště dat, nikoliv databázi. Toto řešení je vhodné pro demo účely, ale pro produkční použití doporučujeme migraci na databázové úložiště.
