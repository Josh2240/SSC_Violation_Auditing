const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupAdmin() {
  try {
    // Create connection
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'student_violation_db',
    });

    console.log('Connected to database');

    // Get password from environment or use default
    const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@2024';
    console.log(`Using default password: ${defaultPassword}`);
    
    // Hash the default password
    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    console.log('Generated password hash');

    // Update admin user
    const [result] = await connection.execute(
      `UPDATE users SET password_hash = ? WHERE username = 'admin'`,
      [passwordHash]
    );

    if (result.affectedRows > 0) {
      console.log('✅ Admin password updated successfully!');
      console.log('Default credentials:');
      console.log('  Username: admin');
      console.log(`  Password: ${defaultPassword}`);
      console.log('\n⚠️  Please change the password after first login!');
      console.log('   Run: node scripts/change-admin-password.js');
    } else {
      // Create admin user if it doesn't exist
      await connection.execute(
        `INSERT INTO users (username, email, password_hash, full_name, role) 
         VALUES (?, ?, ?, ?, ?)`,
        ['admin', 'admin@pclu.edu', passwordHash, 'System Administrator', 'admin']
      );
      console.log('✅ Admin user created successfully!');
      console.log('Default credentials:');
      console.log('  Username: admin');
      console.log(`  Password: ${defaultPassword}`);
      console.log('\n⚠️  Please change the password after first login!');
      console.log('   Run: node scripts/change-admin-password.js');
    }

    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up admin:', error.message);
    console.error('\nMake sure:');
    console.error('1. XAMPP MySQL is running');
    console.error('2. Database schema has been imported');
    console.error('3. .env file is configured correctly');
    process.exit(1);
  }
}

setupAdmin();

