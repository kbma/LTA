const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration du moteur de templates
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Trust Proxy pour Vercel (Requis pour les cookies secure)
app.set('trust proxy', 1);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configuration de session
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret-key-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // Mettre à true si HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 heures
  }
}));

// Initialize database (Optional check)
// const db = require('./services/database'); 

// Routes
const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');

app.use('/', publicRoutes);
app.use('/admin', adminRoutes);

// Page d'accueil - redirection vers la page de code
app.get('/', (req, res) => {
  res.redirect('/enter-code');
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).send('Page non trouvée');
});

// For Vercel: Export the app
module.exports = app;

// For local development: Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
    console.log(`📊 Admin: http://localhost:${PORT}/admin/login`);
    console.log(`🔑 Code d'accès: http://localhost:${PORT}/enter-code`);
  });
}
