# Quick Start Guide

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Start XAMPP

1. Open XAMPP Control Panel
2. Start **Apache** and **MySQL** services
3. Ensure both are running (green status)

### 3. Create Database

**Option A: Using phpMyAdmin (Recommended)**
1. Open http://localhost/phpmyadmin
2. Click on "SQL" tab
3. Copy and paste the contents of `database/schema.sql`
4. Click "Go" to execute

**Option B: Using Command Line**
```bash
mysql -u root -p < database/schema.sql
```

### 4. Configure Environment

Create a `.env` file in the project root:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=student_violation_db
JWT_SECRET=change-this-to-a-random-secret-key
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 5. Set Up Admin Password

```bash
node scripts/setup-admin.js
```

This will create/update the admin user with default password: `Admin@2024`

To change the password later, run:
```bash
node scripts/change-admin-password.js
```

### 6. Start Development Server

```bash
npm run dev
```

### 7. Access the Application

Open your browser and go to: **http://localhost:3000**

Login with:
- **Username:** `admin`
- **Password:** `Admin@2024` (default, or check your `.env` file for `ADMIN_DEFAULT_PASSWORD`)

## First Steps After Login

1. **Change Admin Password** - Go to your profile (if available) or update directly in database
2. **Add Students** - Navigate to Students page and add student records
3. **Configure Violation Types** - Check if default violation types are sufficient
4. **Report a Test Violation** - Create a sample violation to test the system

## Common Issues

### "Cannot connect to database"
- Check if XAMPP MySQL is running
- Verify database credentials in `.env`
- Ensure database `student_violation_db` exists

### "Module not found" errors
- Run `npm install` again
- Delete `node_modules` and reinstall

### "Authentication failed"
- Run `node scripts/setup-admin.js` to reset admin password
- Check JWT_SECRET in `.env` file

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Explore the API endpoints
- Customize violation types for your institution
- Set up regular database backups

