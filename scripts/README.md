# Setup Scripts

## setup-admin.js

This script sets up the default admin user with a properly hashed password.

### Usage

```bash
node scripts/setup-admin.js
```

### What it does

1. Connects to the MySQL database
2. Generates a bcrypt hash for the password (default: `Admin@2024` or from `ADMIN_DEFAULT_PASSWORD` in `.env`)
3. Updates or creates the admin user in the database

### Requirements

- Database must be set up and running
- `.env` file must be configured
- Dependencies must be installed (`npm install`)

### Default Credentials

After running this script:
- **Username:** admin
- **Password:** `Admin@2024` (or the value set in `ADMIN_DEFAULT_PASSWORD` environment variable)

⚠️ **Important:** Change the password immediately after first login!

---

## change-admin-password.js

This script allows you to change the admin user's password interactively.

### Usage

```bash
node scripts/change-admin-password.js
```

### What it does

1. Prompts you to enter a new password (twice for confirmation)
2. Validates the password (minimum 6 characters)
3. Connects to the database
4. Hashes the new password using bcrypt
5. Updates the admin user's password in the database

### Requirements

- Database must be set up and running
- Admin user must already exist
- `.env` file must be configured
- Dependencies must be installed (`npm install`)

### Example

```bash
$ node scripts/change-admin-password.js
Enter new password for admin user: ********
Confirm new password: ********
Connected to database
Generated password hash
✅ Admin password updated successfully!
New credentials:
  Username: admin
  Password: [the password you just set]
```
