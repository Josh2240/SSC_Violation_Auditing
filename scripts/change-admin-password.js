const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const readline = require('readline');
require('dotenv').config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function changeAdminPassword() {
  try {
    // Get new password from user
    const newPassword = await question('Enter new password for admin user: ');
    
    if (!newPassword || newPassword.length < 6) {
      console.error('❌ Password must be at least 6 characters long');
      rl.close();
      process.exit(1);
    }

    const confirmPassword = await question('Confirm new password: ');
    
    if (newPassword !== confirmPassword) {
      console.error('❌ Passwords do not match');
      rl.close();
      process.exit(1);
    }

    // Create connection
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'student_violation_db',
    });

    console.log('Connected to database');

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    console.log('Generated password hash');

    // Update admin user
    const [result] = await connection.execute(
      `UPDATE users SET password_hash = ? WHERE username = 'SupremeStudentCouncil'`,
      [passwordHash]
    );

    if (result.affectedRows > 0) {
      console.log('✅ Admin password updated successfully!');
      console.log('New credentials:');
      console.log('  Username: SupremeStudentCouncil');
      console.log('  Password: [the password you just set]');
    } else {
      console.error('❌ Admin user not found. Run setup-admin.js first.');
    }

    await connection.end();
    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error changing password:', error.message);
    console.error('\nMake sure:');
    console.error('1. XAMPP MySQL is running');
    console.error('2. Database schema has been imported');
    console.error('3. .env file is configured correctly');
    rl.close();
    process.exit(1);
  }
}

changeAdminPassword();

