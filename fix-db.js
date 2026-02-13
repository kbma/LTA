const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'database.db'));

console.log('🔧 Vérification de la structure de la base de données...');

// Check if columns exist
const tableInfo = db.prepare("PRAGMA table_info(margins)").all();
const columns = tableInfo.map(col => col.name);

console.log('Colonnes actuelles de margins:', columns);

const neededColumns = ['valid_from', 'valid_until', 'is_active'];
let addedColumns = [];

neededColumns.forEach(col => {
  if (!columns.includes(col)) {
    try {
      db.prepare(`ALTER TABLE margins ADD COLUMN ${col} ${col === 'is_active' ? 'INTEGER DEFAULT 1' : 'DATE'}`).run();
      console.log(`✅ Colonne ${col} ajoutée`);
      addedColumns.push(col);
    } catch (err) {
      console.log(`❌ Erreur pour ${col}:`, err.message);
    }
  } else {
    console.log(`ℹ️ Colonne ${col} existe déjà`);
  }
});

if (addedColumns.length === 0) {
  console.log('ℹ️ Aucune nouvelle colonne ajoutée');
}

console.log('✅ Base de données mise à jour!');
db.close();
