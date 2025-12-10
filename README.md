# Student Violation Audit System - PCLU

A full-stack web application for auditing and managing student violations with comprehensive audit logging and secure data management.

## Features

- 🔐 **Secure Authentication** - JWT-based authentication with role-based access control
- 📝 **Violation Management** - Create, view, update, and track student violations
- 👥 **Student Management** - Comprehensive student database with search functionality
- 📊 **Dashboard** - Real-time statistics and recent violations overview
- 🔍 **Audit Trail** - Complete audit logging for all data changes
- 🎨 **Modern UI** - Built with Next.js, Tailwind CSS, and Bootstrap
- 💾 **MySQL Database** - Secure and well-structured database schema

## Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Bootstrap 5** - Additional UI components and icons
- **Bootstrap Icons** - Icon library

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **MySQL** - Relational database (via XAMPP)
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing

## Prerequisites

- Node.js 18+ installed
- XAMPP (or MySQL server) installed and running
- npm or yarn package manager

## Installation

### 1. Clone or Download the Project

```bash
cd "C:\Users\Johua\Desktop\Auditing of student's violation in PCLU"
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Database

1. Start XAMPP and ensure MySQL is running
2. Open phpMyAdmin (http://localhost/phpmyadmin)
3. Import the database schema:
   - Click on "Import" tab
   - Choose file: `database/schema.sql`
   - Click "Go" to execute

Alternatively, you can run the SQL file directly in MySQL:

```bash
mysql -u root -p < database/schema.sql
```

### 4. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Database Configuration (XAMPP MySQL)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=student_violation_db

# JWT Secret for Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**Important:** Change the `JWT_SECRET` to a secure random string in production!

### 5. Set Up Default Admin Password

After importing the database, you need to set the admin password. Run this script:

```bash
node scripts/setup-admin.js
```

Or manually update the password in the database using phpMyAdmin.

### 6. Start the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Default Login Credentials

- **Username:** `admin`
- **Password:** `admin123` (or set via `ADMIN_DEFAULT_PASSWORD` in `.env`)

**⚠️ IMPORTANT:** Change the default password immediately after first login!

To change the admin password, run:
```bash
node scripts/change-admin-password.js
```

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── students/     # Student CRUD operations
│   │   ├── violations/   # Violation CRUD operations
│   │   └── audit-logs/   # Audit log endpoints
│   ├── dashboard/        # Dashboard page
│   ├── login/            # Login page
│   ├── students/         # Students management page
│   ├── violations/       # Violations management page
│   └── audit-logs/       # Audit logs page
├── components/            # React components
│   ├── Layout.tsx        # Main layout component
│   ├── StudentForm.tsx   # Student form component
│   └── ViolationForm.tsx # Violation form component
├── lib/                  # Utility libraries
│   ├── db.ts            # Database connection
│   ├── auth.ts          # Authentication utilities
│   └── audit.ts         # Audit logging utilities
├── database/             # Database files
│   └── schema.sql       # Database schema
└── scripts/             # Setup scripts
    └── setup-admin.js   # Admin password setup
```

## Database Schema

The system uses the following main tables:

- **users** - System users (admin, staff, viewer)
- **students** - Student information
- **violation_types** - Predefined violation types
- **violations** - Violation records
- **audit_logs** - Complete audit trail
- **violation_attachments** - File attachments (future feature)

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Students
- `GET /api/students` - List students (with search and pagination)
- `POST /api/students` - Create new student
- `GET /api/students/[id]` - Get student details
- `PUT /api/students/[id]` - Update student
- `DELETE /api/students/[id]` - Delete student

### Violations
- `GET /api/violations` - List violations (with filters)
- `POST /api/violations` - Create new violation
- `GET /api/violations/[id]` - Get violation details
- `PUT /api/violations/[id]` - Update violation

### Violation Types
- `GET /api/violation-types` - List all violation types

### Audit Logs
- `GET /api/audit-logs` - List audit logs (with filters)
- `GET /api/audit-logs/[table]/[id]` - Get audit logs for specific record

## Security Features

1. **Password Hashing** - All passwords are hashed using bcrypt
2. **JWT Authentication** - Secure token-based authentication
3. **Role-Based Access Control** - Different permissions for admin, staff, and viewer
4. **Audit Logging** - All data changes are logged with user, timestamp, and IP address
5. **Input Validation** - Server-side validation for all inputs
6. **SQL Injection Protection** - Parameterized queries

## Usage Guide

### Adding a Student

1. Navigate to "Students" in the menu
2. Click "Add Student"
3. Fill in the required information (Student ID, First Name, Last Name)
4. Click "Create"

### Reporting a Violation

1. Navigate to "Violations" in the menu
2. Click "Report Violation"
3. Search and select a student
4. Select violation type
5. Fill in incident details
6. Submit the violation

### Viewing Audit Logs

1. Navigate to "Audit Logs" (admin/staff only)
2. Use filters to search for specific logs
3. View complete history of all data changes

## Troubleshooting

### Database Connection Issues

- Ensure XAMPP MySQL is running
- Check database credentials in `.env` file
- Verify database name matches in `.env` and schema.sql

### Authentication Issues

- Clear browser cookies
- Check JWT_SECRET in `.env` file
- Verify user exists in database

### Build Errors

- Delete `node_modules` and `.next` folder
- Run `npm install` again
- Check Node.js version (requires 18+)

## Production Deployment

Before deploying to production:

1. Change `JWT_SECRET` to a strong random string
2. Update database credentials
3. Set `NODE_ENV=production` in environment variables
4. Run `npm run build` to create production build
5. Use a secure database server (not XAMPP)
6. Enable HTTPS
7. Set up proper backup procedures

## License

This project is developed for PCLU (Pamantasan ng Cabuyao - Laguna University).

## Support

For issues or questions, please contact the development team.

