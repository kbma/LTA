const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
require('dotenv').config();
const db = require('../services/database');

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
  try {
    const { username, password } = req.body;
    
    // Find admin by username
    const admin = await db.findOne('admins', u => u.username === username);

    if (!admin || !bcrypt.compareSync(password, admin.password)) {
      return res.render('admin/login', { error: 'Identifiants incorrects' });
    }

    req.session.adminId = admin.id;
    req.session.adminUsername = admin.username;
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Login error:', error);
    res.render('admin/login', { error: 'Erreur: ' + error.message });
  }
});

// Déconnexion admin
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

// Dashboard
router.get('/dashboard', requireAuth, async (req, res) => {
  const conventions = await db.getAll('conventions');
  const codes = await db.getAll('discount_codes');
  const activeCodes = codes.filter(c => c.is_active == 1);

  res.render('admin/dashboard', {
    adminUsername: req.session.adminUsername,
    stats: {
      conventions: conventions.length,
      codes: codes.length,
      activeCodes: activeCodes.length
    }
  });
});

// === GESTION DES CONVENTIONS ===

// Liste des conventions
router.get('/conventions', requireAuth, async (req, res) => {
  let conventions = await db.getAll('conventions');
  // Sort by created_at DESC
  conventions.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

  res.render('admin/conventions', { 
    conventions,
    adminUsername: req.session.adminUsername
  });
});

// Ajouter une convention
router.post('/conventions/add', requireAuth, async (req, res) => {
  const { name, discount_percentage, valid_from, valid_until } = req.body;

  try {
    await db.insert('conventions', {
      name,
      discount_percentage,
      is_active: 1,
      valid_from: valid_from || null,
      valid_until: valid_until || null
    });
    res.redirect('/admin/conventions');
  } catch (error) {
    console.error('Erreur lors de l\'ajout:', error);
    res.redirect('/admin/conventions');
  }
});

// Modifier une convention
router.post('/conventions/edit/:id', requireAuth, async (req, res) => {
  const { name, discount_percentage, is_active, valid_from, valid_until } = req.body;
  
  await db.update('conventions', req.params.id, {
    name,
    discount_percentage,
    is_active: is_active ? 1 : 0,
    valid_from: valid_from || null,
    valid_until: valid_until || null
  });

  res.redirect('/admin/conventions');
});

// Supprimer une convention
router.post('/conventions/delete/:id', requireAuth, async (req, res) => {
  await db.delete('conventions', req.params.id);
  res.redirect('/admin/conventions');
});

// === GESTION DES CODES DE RÉDUCTION ===

// Liste des codes
router.get('/codes', requireAuth, async (req, res) => {
  let codes = await db.getAll('discount_codes');
  const conventions = await db.getAll('conventions');

  // Join manually to get convention names
  codes = codes.map(code => {
    const conv = conventions.find(c => c.id == code.convention_id);
    return {
      ...code,
      convention_name: conv ? conv.name : 'Inconnu'
    };
  });

  // Sort
  codes.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

  res.render('admin/codes', { 
    codes,
    conventions: conventions.filter(c => c.is_active == 1),
    adminUsername: req.session.adminUsername
  });
});

// Ajouter un code
router.post('/codes/add', requireAuth, async (req, res) => {
  const { code, convention_id, valid_from, valid_until } = req.body;

  try {
    await db.insert('discount_codes', {
      code: code.toUpperCase(),
      convention_id,
      is_active: 1,
      valid_from: valid_from || null,
      valid_until: valid_until || null
    });
    res.redirect('/admin/codes');
  } catch (error) {
    console.error('Erreur lors de l\'ajout:', error);
    res.redirect('/admin/codes');
  }
});

// Modifier un code
router.post('/codes/edit/:id', requireAuth, async (req, res) => {
  const { code, convention_id, is_active, valid_from, valid_until } = req.body;

  await db.update('discount_codes', req.params.id, {
    code: code.toUpperCase(),
    convention_id,
    is_active: is_active ? 1 : 0,
    valid_from: valid_from || null,
    valid_until: valid_until || null
  });

  res.redirect('/admin/codes');
});

// Supprimer un code
router.post('/codes/delete/:id', requireAuth, async (req, res) => {
  await db.delete('discount_codes', req.params.id);
  res.redirect('/admin/codes');
});

// === GESTION DES MARGES ===

// Liste des marges
router.get('/margins', requireAuth, async (req, res) => {
  let margins = await db.getAll('margins');
  // Sort by margin_type then created_at
  margins.sort((a,b) => (a.margin_type > b.margin_type) ? 1 : -1);

  res.render('admin/margins', { 
    margins,
    adminUsername: req.session.adminUsername
  });
});

// Ajouter/Modifier une marge
router.post('/margins/save', requireAuth, async (req, res) => {
  const { margin_type, entity_id, margin_value, margin_unit, valid_from, valid_until, is_active } = req.body;

  // Check if existing margin (global or specific)
  const existing = await db.findOne('margins', m => 
    m.margin_type === margin_type && 
    (m.entity_id == entity_id || (!m.entity_id && !entity_id))
  );

  if (existing) {
    // Update
    await db.update('margins', existing.id, {
      margin_value,
      margin_unit,
      valid_from: valid_from || null,
      valid_until: valid_until || null,
      is_active: is_active ? 1 : 0
    });
  } else {
    // Create
    await db.insert('margins', {
      margin_type,
      entity_id: entity_id || null,
      margin_value,
      margin_unit,
      valid_from: valid_from || null,
      valid_until: valid_until || null,
      is_active: is_active ? 1 : 0
    });
  }

  res.redirect('/admin/margins');
});

// Supprimer une marge
router.post('/margins/delete/:id', requireAuth, async (req, res) => {
  await db.delete('margins', req.params.id);
  res.redirect('/admin/margins');
});

module.exports = router;
