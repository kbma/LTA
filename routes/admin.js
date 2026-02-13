const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
require('dotenv').config();
const { createWrapper } = require('../services/database');

let db = null;

async function getDb() {
  if (!db) {
    const { initDatabase, createWrapper: createDbWrapper } = require('../services/database');
    await initDatabase();
    db = createDbWrapper();
  }
  return db;
}

// Middleware pour vérifier l'authentification
function requireAuth(req, res, next) {
  if (!req.session.adminId) {
    return res.redirect('/admin/login');
  }
  next();
}

// Page de connexion admin
router.get('/login', (req, res) => {
  if (req.session.adminId) {
    return res.redirect('/admin/dashboard');
  }
  res.render('admin/login', { error: null });
});

// Traitement de la connexion
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const dbWrapper = await getDb();

  const stmt = dbWrapper.prepare('SELECT * FROM admins WHERE username = ?');
  const admin = await stmt.get(username);

  if (!admin || !bcrypt.compareSync(password, admin.password)) {
    return res.render('admin/login', { error: 'Identifiants incorrects' });
  }

  req.session.adminId = admin.id;
  req.session.adminUsername = admin.username;
  res.redirect('/admin/dashboard');
});

// Déconnexion admin
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

// Dashboard
router.get('/dashboard', requireAuth, async (req, res) => {
  const dbWrapper = await getDb();
  const statsConventions = await dbWrapper.prepare('SELECT COUNT(*) as count FROM conventions').get();
  const statsCodes = await dbWrapper.prepare('SELECT COUNT(*) as count FROM discount_codes').get();
  const statsActiveCodes = await dbWrapper.prepare('SELECT COUNT(*) as count FROM discount_codes WHERE is_active = 1').get();

  res.render('admin/dashboard', {
    adminUsername: req.session.adminUsername,
    stats: {
      conventions: statsConventions.count,
      codes: statsCodes.count,
      activeCodes: statsActiveCodes.count
    }
  });
});

// === GESTION DES CONVENTIONS ===

// Liste des conventions
router.get('/conventions', requireAuth, async (req, res) => {
  const dbWrapper = await getDb();
  const stmt = dbWrapper.prepare('SELECT * FROM conventions ORDER BY created_at DESC');
  const conventions = await stmt.all();
  res.render('admin/conventions', { 
    conventions,
    adminUsername: req.session.adminUsername
  });
});

// Ajouter une convention
router.post('/conventions/add', requireAuth, async (req, res) => {
  const { name, discount_percentage, valid_from, valid_until } = req.body;
  const dbWrapper = await getDb();

  const stmt = dbWrapper.prepare(`
    INSERT INTO conventions (name, discount_percentage, valid_from, valid_until) 
    VALUES (?, ?, ?, ?)
  `);

  try {
    await stmt.run(name, discount_percentage, valid_from || null, valid_until || null);
    res.redirect('/admin/conventions');
  } catch (error) {
    console.error('Erreur lors de l\'ajout:', error);
    res.redirect('/admin/conventions');
  }
});

// Modifier une convention
router.post('/conventions/edit/:id', requireAuth, async (req, res) => {
  const { name, discount_percentage, is_active, valid_from, valid_until } = req.body;
  const dbWrapper = await getDb();

  const stmt = dbWrapper.prepare(`
    UPDATE conventions 
    SET name = ?, discount_percentage = ?, is_active = ?, valid_from = ?, valid_until = ?
    WHERE id = ?
  `);

  await stmt.run(name, discount_percentage, is_active ? 1 : 0, valid_from || null, valid_until || null, req.params.id);
  res.redirect('/admin/conventions');
});

// Supprimer une convention
router.post('/conventions/delete/:id', requireAuth, async (req, res) => {
  const dbWrapper = await getDb();
  const stmt = dbWrapper.prepare('DELETE FROM conventions WHERE id = ?');
  await stmt.run(req.params.id);
  res.redirect('/admin/conventions');
});

// === GESTION DES CODES DE RÉDUCTION ===

// Liste des codes
router.get('/codes', requireAuth, async (req, res) => {
  const dbWrapper = await getDb();
  const stmt = dbWrapper.prepare(`
    SELECT dc.*, c.name as convention_name 
    FROM discount_codes dc
    JOIN conventions c ON dc.convention_id = c.id
    ORDER BY dc.created_at DESC
  `);
  const codes = await stmt.all();

  const conventionsStmt = dbWrapper.prepare('SELECT * FROM conventions WHERE is_active = 1');
  const conventions = await conventionsStmt.all();

  res.render('admin/codes', { 
    codes,
    conventions,
    adminUsername: req.session.adminUsername
  });
});

// Ajouter un code
router.post('/codes/add', requireAuth, async (req, res) => {
  const { code, convention_id, valid_from, valid_until } = req.body;
  const dbWrapper = await getDb();

  const stmt = dbWrapper.prepare(`
    INSERT INTO discount_codes (code, convention_id, valid_from, valid_until) 
    VALUES (?, ?, ?, ?)
  `);

  try {
    await stmt.run(code.toUpperCase(), convention_id, valid_from || null, valid_until || null);
    res.redirect('/admin/codes');
  } catch (error) {
    console.error('Erreur lors de l\'ajout:', error);
    res.redirect('/admin/codes');
  }
});

// Modifier un code
router.post('/codes/edit/:id', requireAuth, async (req, res) => {
  const { code, convention_id, is_active, valid_from, valid_until } = req.body;
  const dbWrapper = await getDb();

  const stmt = dbWrapper.prepare(`
    UPDATE discount_codes 
    SET code = ?, convention_id = ?, is_active = ?, valid_from = ?, valid_until = ?
    WHERE id = ?
  `);

  await stmt.run(code.toUpperCase(), convention_id, is_active ? 1 : 0, valid_from || null, valid_until || null, req.params.id);
  res.redirect('/admin/codes');
});

// Supprimer un code
router.post('/codes/delete/:id', requireAuth, async (req, res) => {
  const dbWrapper = await getDb();
  const stmt = dbWrapper.prepare('DELETE FROM discount_codes WHERE id = ?');
  await stmt.run(req.params.id);
  res.redirect('/admin/codes');
});

// === GESTION DES MARGES ===

// Liste des marges
router.get('/margins', requireAuth, async (req, res) => {
  const dbWrapper = await getDb();
  const stmt = dbWrapper.prepare('SELECT * FROM margins ORDER BY margin_type, created_at DESC');
  const margins = await stmt.all();

  res.render('admin/margins', { 
    margins,
    adminUsername: req.session.adminUsername
  });
});

// Ajouter/Modifier une marge
router.post('/margins/save', requireAuth, async (req, res) => {
  const { margin_type, entity_id, margin_value, margin_unit, valid_from, valid_until, is_active } = req.body;
  const dbWrapper = await getDb();

  // Vérifier si une marge existe déjà pour ce type et entité
  let stmt = dbWrapper.prepare(`
    SELECT * FROM margins WHERE margin_type = ? AND (entity_id = ? OR (entity_id IS NULL AND ? IS NULL))
  `);
  const existing = await stmt.get(margin_type, entity_id || null, entity_id || null);

  if (existing) {
    // Mettre à jour
    stmt = dbWrapper.prepare(`
      UPDATE margins 
      SET margin_value = ?, margin_unit = ?, valid_from = ?, valid_until = ?, is_active = ?
      WHERE id = ?
    `);
    await stmt.run(margin_value, margin_unit, valid_from || null, valid_until || null, is_active ? 1 : 0, existing.id);
  } else {
    // Créer
    stmt = dbWrapper.prepare(`
      INSERT INTO margins (margin_type, entity_id, margin_value, margin_unit, valid_from, valid_until, is_active) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    await stmt.run(margin_type, entity_id || null, margin_value, margin_unit, valid_from || null, valid_until || null, is_active ? 1 : 0);
  }

  res.redirect('/admin/margins');
});

// Supprimer une marge
router.post('/margins/delete/:id', requireAuth, async (req, res) => {
  const dbWrapper = await getDb();
  const stmt = dbWrapper.prepare('DELETE FROM margins WHERE id = ?');
  await stmt.run(req.params.id);
  res.redirect('/admin/margins');
});

module.exports = router;
