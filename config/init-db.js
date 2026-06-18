const { pool } = require('./database');

async function initializeDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        role VARCHAR(20) DEFAULT 'user',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS plans (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        name_ar VARCHAR(100),
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        duration_months INTEGER NOT NULL DEFAULT 1,
        features JSONB,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        plan_id INTEGER REFERENCES plans(id),
        status VARCHAR(20) DEFAULT 'active',
        start_date TIMESTAMP DEFAULT NOW(),
        end_date TIMESTAMP,
        payment_method VARCHAR(50),
        payment_id VARCHAR(255),
        amount_paid DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS trainers (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        specialty VARCHAR(255),
        bio TEXT,
        rating DECIMAL(3,2) DEFAULT 0,
        is_available BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        trainer_id INTEGER REFERENCES trainers(id),
        user_id INTEGER REFERENCES users(id),
        title VARCHAR(255),
        scheduled_at TIMESTAMP,
        duration_minutes INTEGER DEFAULT 60,
        status VARCHAR(20) DEFAULT 'scheduled',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    const plansCount = await client.query('SELECT COUNT(*) FROM plans');
    if (parseInt(plansCount.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO plans (name, name_ar, description, price, duration_months, features) VALUES
        ('Basic', 'الأساسي', 'Basic fitness plan', 99, 1, '{"workouts": 10, "support": "email"}'),
        ('Pro', 'الاحترافي', 'Professional fitness plan', 199, 1, '{"workouts": 30, "support": "24/7", "trainer": true}'),
        ('Elite', 'النخبة', 'Elite training with personal trainer', 399, 1, '{"workouts": "unlimited", "support": "24/7", "trainer": true, "nutrition": true}')
      `);
    }

    console.log('Database initialized successfully');
  } finally {
    client.release();
  }
}

module.exports = { initializeDatabase };
