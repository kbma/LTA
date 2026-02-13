const bcrypt = require('bcrypt');
require('dotenv').config();
const db = require('./services/database');

async function initDB() {
  console.log('🔧 Initialisation Vercel KV (JSON Mode)...');

  // 1. Admins
  const admins = await db.getAll('admins');
  if (admins.length === 0) {
    const password = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10);
    await db.insert('admins', {
      username: process.env.ADMIN_USERNAME || 'admin',
      password: password
    });
    console.log('✅ Admin créé');
  } else {
    console.log('ℹ️  Admins déjà existants');
  }

  // 2. Conventions
  const conventions = await db.getAll('conventions');
  if (conventions.length === 0) {
    const list = [
      { name: 'Ministère de la Santé', discount_percentage: 20, is_active: 1 },
      { name: 'Entreprise partenaire A', discount_percentage: 15, is_active: 1 },
      { name: 'Organisme public B', discount_percentage: 25, is_active: 1 }
    ];
    for (const c of list) {
      await db.insert('conventions', c);
    }
    console.log('✅ Conventions créées');
  } else {
     console.log('ℹ️  Conventions déjà existantes');
  }

  // Reload conventions to get IDs
  const savedConventions = await db.getAll('conventions');

  // 3. Codes
  const codes = await db.getAll('discount_codes');
  if (codes.length === 0 && savedConventions.length > 0) {
    // Map existing conventions to codes
    const codeList = [
      { code: 'SANTE2024', convention_name: 'Ministère de la Santé' },
      { code: 'PARTNER15', convention_name: 'Entreprise partenaire A' },
      { code: 'PUBLIC25', convention_name: 'Organisme public B' }
    ];

    for (const c of codeList) {
       const conv = savedConventions.find(x => x.name === c.convention_name);
       if (conv) {
         await db.insert('discount_codes', {
           code: c.code,
           convention_id: conv.id,
           is_active: 1
         });
       }
    }
    console.log('✅ Codes créés');
  } else {
    console.log('ℹ️  Codes déjà existants ou conventions manquantes');
  }

  // 4. Global Margin
  const margins = await db.getAll('margins');
  const globalMargin = margins.find(m => m.margin_type === 'global');
  if (!globalMargin) {
    await db.insert('margins', {
      margin_type: 'global',
      margin_value: 10,
      margin_unit: 'percentage',
      is_active: 1
    });
    console.log('✅ Marge globale 10% créée');
  } else {
    console.log('ℹ️  Marge globale déjà existante');
  }

  console.log('🎉 Initialisation terminée !');
}

initDB().catch(err => {
  console.error('Erreur:', err);
  process.exit(1);
});
