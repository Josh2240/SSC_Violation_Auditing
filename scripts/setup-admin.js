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
    const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'ssc2526';
    const adminUsername = process.env.ADMIN_USERNAME || 'SupremeStudentCouncil';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@pclu.edu';

    console.log(`Using default password: ${defaultPassword}`);
    
    // Hash the default password
    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    console.log('Generated password hash');

    // Try updating by username first
    const [result] = await connection.execute(
      `UPDATE users SET password_hash = ? WHERE username = ?`,
      [passwordHash, adminUsername]
    );

    if (result.affectedRows > 0) {
      console.log('✅ Admin password updated successfully!');
      console.log('Default credentials:');
      console.log(`  Username: ${adminUsername}`);
      console.log(`  Password: ${defaultPassword}`);
      console.log('\n⚠️  Please change the password after first login!');
      console.log('   Run: node scripts/change-admin-password.js');
    } else {
      // If no row matched by username, try updating by email (handles legacy 'admin' account)
      const [byEmail] = await connection.execute(
        `UPDATE users SET password_hash = ?, username = ? WHERE email = ?`,
        [passwordHash, adminUsername, adminEmail]
      );

      if (byEmail.affectedRows > 0) {
        console.log('✅ Existing admin account updated (matched by email)!');
        console.log('Default credentials:');
        console.log(`  Username: ${adminUsername}`);
        console.log(`  Password: ${defaultPassword}`);
        console.log('\n⚠️  Please change the password after first login!');
        console.log('   Run: node scripts/change-admin-password.js');
      } else {
        // No existing account found; create a new one
        try {
          await connection.execute(
            `INSERT INTO users (username, email, password_hash, full_name, role) 
             VALUES (?, ?, ?, ?, ?)`,
            [adminUsername, adminEmail, passwordHash, 'System Administrator', 'admin']
          );

          console.log('✅ Admin user created successfully!');
          console.log('Default credentials:');
          console.log(`  Username: ${adminUsername}`);
          console.log(`  Password: ${defaultPassword}`);
          console.log('\n⚠️  Please change the password after first login!');
          console.log('   Run: node scripts/change-admin-password.js');
        } catch (err) {
          // Handle race condition / duplicate key - try updating the record by email as a fallback
          if (err && err.code === 'ER_DUP_ENTRY') {
            const [fallback] = await connection.execute(
              `UPDATE users SET password_hash = ?, username = ? WHERE email = ?`,
              [passwordHash, adminUsername, adminEmail]
            );

            if (fallback.affectedRows > 0) {
              console.log('✅ Admin account updated via fallback (duplicate detected)!');
              console.log('Default credentials:');
              console.log(`  Username: ${adminUsername}`);
              console.log(`  Password: ${defaultPassword}`);
              console.log('\n⚠️  Please change the password after first login!');
              console.log('   Run: node scripts/change-admin-password.js');
            } else {
              throw err;
            }
          } else {
            throw err;
          }
        }
      }
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

