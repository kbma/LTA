const bcrypt = require('bcrypt');
require('dotenv').config();
const { initDatabase, createWrapper, close, isPostgres } = require('./services/database');

async function initDB() {
  await initDatabase();
  const dbWrapper = createWrapper();

  console.log('🔧 Initialisation de la base de données...');
  console.log(`📡 Mode: ${isPostgres ? 'Postgres (Vercel)' : 'SQLite (Local)'}`);

  // SQL Dialect differences
  const AUTO_INCREMENT = isPostgres ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
  const DATETIME_TYPE = isPostgres ? 'TIMESTAMP' : 'DATETIME';
  const INSERT_IGNORE = isPostgres ? 'INSERT INTO' : 'INSERT OR IGNORE INTO';
  const ON_CONFLICT_DO_NOTHING = isPostgres ? 'ON CONFLICT DO NOTHING' : '';

  // Table des administrateurs
  await dbWrapper.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id ${AUTO_INCREMENT},
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at ${DATETIME_TYPE} DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Table des conventions
  await dbWrapper.exec(`
    CREATE TABLE IF NOT EXISTS conventions (
      id ${AUTO_INCREMENT},
      name TEXT UNIQUE NOT NULL,
      discount_percentage REAL NOT NULL,
      is_active INTEGER DEFAULT 1,
      valid_from DATE,
      valid_until DATE,
      created_at ${DATETIME_TYPE} DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Table des codes de réduction
  await dbWrapper.exec(`
    CREATE TABLE IF NOT EXISTS discount_codes (
      id ${AUTO_INCREMENT},
      code TEXT UNIQUE NOT NULL,
      convention_id INTEGER NOT NULL,
      is_active INTEGER DEFAULT 1,
      valid_from DATE,
      valid_until DATE,
      created_at ${DATETIME_TYPE} DEFAULT CURRENT_TIMESTAMP
      ${!isPostgres ? ', FOREIGN KEY (convention_id) REFERENCES conventions(id)' : ''}
    )
  `);
  // Note: For Postgres, adding FK constraints in CREATE TABLE can be tricky if table exists or order matters. 
  // keeping it simple.

  // Table des marges
  await dbWrapper.exec(`
    CREATE TABLE IF NOT EXISTS margins (
      id ${AUTO_INCREMENT},
      margin_type TEXT NOT NULL, -- 'global', 'hotel', 'room_type'
      entity_id TEXT, -- ID de l'hôtel ou type de chambre (NULL pour global)
      margin_value REAL NOT NULL,
      margin_unit TEXT DEFAULT 'percentage', -- 'percentage' ou 'fixed'
      valid_from DATE,
      valid_until DATE,
      is_active INTEGER DEFAULT 1,
      created_at ${DATETIME_TYPE} DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('✅ Tables créées avec succès');

  // Migration: Ajouter les colonnes de dates si elles n'existent pas
  // This part is mostly for existing SQLite DBs. Postgres will handle schemas via migrations usually, 
  // but for this simple setup we can try to add if missing.
  // In Postgres, adding column if not exists requires a specific block or checking information_schema. 
  // We'll skip this implicit migration for Postgres for now to avoid complexity errors, assuming fresh start or manual migration.
  if (!isPostgres) {
    try {
        await dbWrapper.exec(`ALTER TABLE margins ADD COLUMN valid_from DATE`);
        console.log('✅ Colonne valid_from ajoutée à margins');
    } catch (e) {}
    try {
        await dbWrapper.exec(`ALTER TABLE margins ADD COLUMN valid_until DATE`);
        console.log('✅ Colonne valid_until ajoutée à margins');
    } catch (e) {}
    try {
        await dbWrapper.exec(`ALTER TABLE margins ADD COLUMN is_active INTEGER DEFAULT 1`);
        console.log('✅ Colonne is_active ajoutée à margins');
    } catch (e) {}
  } else {
     // Check if columns exist (Optional, but good for idempotency)
     // Skipping for brevity in this conversion script.
  }


  // Créer un admin par défaut
  const adminPassword = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10);
  // Prepare insert statement adapting for Postgres vs SQLite
  let insertAdminSql = '';
  if (isPostgres) {
    insertAdminSql = `INSERT INTO admins (username, password) VALUES (?, ?) ON CONFLICT (username) DO NOTHING`;
  } else {
    insertAdminSql = `INSERT OR IGNORE INTO admins (username, password) VALUES (?, ?)`;
  }

  const insertAdmin = dbWrapper.prepare(insertAdminSql);

  try {
    await insertAdmin.run(process.env.ADMIN_USERNAME || 'admin', adminPassword);
    console.log('✅ Administrateur par défaut vérifié/créé');
  } catch (err) {
    console.log('ℹ️  Erreur création admin:', err.message);
  }

  // Créer des conventions d'exemple
  let insertConventionSql = '';
  if (isPostgres) {
      insertConventionSql = `INSERT INTO conventions (name, discount_percentage, is_active) VALUES (?, ?, 1) ON CONFLICT (name) DO NOTHING`;
  } else {
      insertConventionSql = `INSERT OR IGNORE INTO conventions (name, discount_percentage, is_active) VALUES (?, ?, 1)`;
  }
  const insertConvention = dbWrapper.prepare(insertConventionSql);

  const conventions = [
    ['Ministère de la Santé', 20],
    ['Entreprise partenaire A', 15],
    ['Organisme public B', 25]
  ];

  for (const [name, discount] of conventions) {
    try {
      await insertConvention.run(name, discount);
      console.log(`✅ Convention "${name}" traitée`);
    } catch (err) {
      console.log(`ℹ️  Erreur Convention "${name}":`, err.message);
    }
  }

  // Créer des codes de réduction d'exemple
  // Note: convention_id implies we know the IDs. In fresh DB, likely 1, 2, 3.
  // In existing DB, IDs might respect auto-increment.
  // For safety, we should probably lookup IDs, but sticking to hardcoded for "sample" data initialization.
  let insertCodeSql = '';
  if (isPostgres) {
      insertCodeSql = `INSERT INTO discount_codes (code, convention_id, is_active) VALUES (?, ?, 1) ON CONFLICT (code) DO NOTHING`;
  } else {
      insertCodeSql = `INSERT OR IGNORE INTO discount_codes (code, convention_id, is_active) VALUES (?, ?, 1)`;
  }
  const insertCode = dbWrapper.prepare(insertCodeSql);

  const codes = [
    ['SANTE2024', 1],
    ['PARTNER15', 2],
    ['PUBLIC25', 3]
  ];

  for (const [code, conventionId] of codes) {
    try {
      await insertCode.run(code, conventionId);
      console.log(`✅ Code "${code}" traité`);
    } catch (err) {
       // If FK fails (likely if conventions not 1,2,3), that's expected in a partial state
       console.log(`ℹ️  Code "${code}" non créé (FK ou duplicata)`);
    }
  }

  // Créer une marge globale d'exemple
  let insertMarginSql = '';
  // Margins table doesn't have unique constraint on margin_type in CREATE TABLE above unless I missed it?
  // It does NOT. So we might insert duplicate global margins if we run this often.
  // Let's check if it exists first.
  const checkMargin = dbWrapper.prepare(`SELECT id FROM margins WHERE margin_type = 'global'`);
  const existingMargin = await checkMargin.get();
  
  if (!existingMargin) {
      const insertMargin = dbWrapper.prepare(`
        INSERT INTO margins (margin_type, margin_value, margin_unit) 
        VALUES ('global', 10, 'percentage')
      `);
      try {
        await insertMargin.run();
        console.log('✅ Marge globale de 10% créée');
      } catch (err) {
        console.log('ℹ️  Erreur création marge:', err);
      }
  } else {
      console.log('ℹ️  Marge globale existe déjà');
  }

  close(); // Using exported close
  console.log('🎉 Base de données initialisée avec succès !');
}

initDB().catch(err => {
  console.error('Erreur:', err);
  process.exit(1);
});
