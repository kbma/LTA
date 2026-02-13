const express = require('express');
const router = express.Router();
const db = require('../services/database');
const hotelService = require('../services/hotelService');

// Page d'entrée du code de réduction
router.get('/enter-code', (req, res) => {
  res.render('enter-code', { error: null });
});

// Validation du code de réduction
router.post('/validate-code', async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.render('enter-code', { error: 'Veuillez entrer un code de réduction' });
  }

  // Logic: Join manually
  const codes = await db.getAll('discount_codes');
  const conventions = await db.getAll('conventions');

  const discountCode = codes.find(d => d.code === code.toUpperCase() && d.is_active == 1);
  
  if (!discountCode) {
    return res.render('enter-code', { error: 'Code invalide ou expiré' });
  }

  const convention = conventions.find(c => c.id == discountCode.convention_id && c.is_active == 1);

  if (!convention) {
    // Code exists but convention is inactive or deleted
    return res.render('enter-code', { error: 'Code invalide (Convention inactive)' });
  }

  // Merge data for valid check
  const codeData = {
    ...discountCode,
    convention_name: convention.name,
    discount_percentage: convention.discount_percentage
  };

  // Vérifier la date de validité
  const now = new Date();
  if (codeData.valid_from && new Date(codeData.valid_from) > now) {
    return res.render('enter-code', { error: 'Ce code n\'est pas encore valide' });
  }
  if (codeData.valid_until && new Date(codeData.valid_until) < now) {
    return res.render('enter-code', { error: 'Ce code a expiré' });
  }

  // Stocker les informations dans la session
  req.session.discountCode = code.toUpperCase();
  req.session.conventionId = codeData.convention_id;
  req.session.conventionName = codeData.convention_name;
  req.session.discountPercentage = codeData.discount_percentage;

  // Rediriger vers la page des offres
  res.redirect('/offers');
});

// Page des offres hôtelières
router.get('/offers', async (req, res) => {
  // Vérifier si l'utilisateur a un code valide
  if (!req.session.discountCode) {
    return res.redirect('/enter-code');
  }

  try {
    // Récupérer les paramètres de filtrage
    const { destination, checkIn, checkOut, adults, rooms, stars, priceMin, priceMax } = req.query;
    
    // Récupérer les hôtels depuis l'API
    const hotels = await hotelService.getHotels('TUN', checkIn, checkOut, adults);

    // Appliquer les filtres
    let filteredHotels = hotels;
    
    // Filtre par destination
    if (destination) {
      filteredHotels = filteredHotels.filter(h => 
        h.address.toLowerCase().includes(destination.toLowerCase()) ||
        h.name.toLowerCase().includes(destination.toLowerCase())
      );
    }
    
    // Filtre par étoiles
    if (stars) {
      const starValues = stars.split(',').map(Number);
      filteredHotels = filteredHotels.filter(h => starValues.includes(h.stars));
    }
    
    // Filtre par prix
    if (priceMin || priceMax) {
      filteredHotels = filteredHotels.filter(h => {
        const minPrice = Math.min(...h.rooms.map(r => r.finalPrice || r.price));
        if (priceMin && minPrice < Number(priceMin)) return false;
        if (priceMax && minPrice > Number(priceMax)) return false;
        return true;
      });
    }

    // Récupérer la marge globale
    const globalMargin = await db.findOne('margins', m => m.margin_type === 'global' && m.is_active == 1) 
                         || { margin_value: 0, margin_unit: 'percentage' };

    // Récupérer la convention pour valider les dates
    const convention = await db.findOne('conventions', c => c.id == req.session.conventionId);

    // Vérifier si la réduction est valide (dates)
    const now = new Date();
    const isDiscountValid = !convention || (
        (!convention.valid_from || new Date(convention.valid_from) <= now) &&
        (!convention.valid_until || new Date(convention.valid_until) >= now) &&
        convention.is_active == 1
    );

    // Vérifier si la marge globale est valide (dates)
    const isGlobalMarginValid = !globalMargin.margin_value || (
        (!globalMargin.valid_from || new Date(globalMargin.valid_from) <= now) &&
        (!globalMargin.valid_until || new Date(globalMargin.valid_until) >= now)
    );

    // Appliquer les marges et réductions
    const processedHotels = filteredHotels.map(hotel => {
        return {
          ...hotel,
          rooms: hotel.rooms.map(room => {
            let finalPrice = room.price;

            // Appliquer la marge globale si valide
            if (isGlobalMarginValid && globalMargin.margin_value > 0) {
              if (globalMargin.margin_unit === 'percentage') {
                finalPrice = finalPrice * (1 + globalMargin.margin_value / 100);
              } else {
                finalPrice = finalPrice + globalMargin.margin_value;
              }
            }

            // Appliquer la réduction de la convention si valide
            const discountPercentage = isDiscountValid ? req.session.discountPercentage : 0;
            const discountAmount = finalPrice * (discountPercentage / 100);
            finalPrice = finalPrice - discountAmount;

            return {
              ...room,
              originalPrice: room.price,
              priceWithMargin: finalPrice + discountAmount,
              finalPrice: Math.round(finalPrice * 100) / 100,
              discountAmount: Math.round(discountAmount * 100) / 100,
              discountPercentage: discountPercentage
            };
          })
        };
    });

    res.render('offers', {
      hotels: processedHotels,
      conventionName: req.session.conventionName,
      discountPercentage: req.session.discountPercentage,
      discountCode: req.session.discountCode,
      filters: {
        destination: destination || '',
        checkIn: checkIn || '',
        checkOut: checkOut || '',
        adults: adults || 2,
        rooms: rooms || 1,
        stars: stars || '',
        priceMin: priceMin || '',
        priceMax: priceMax || ''
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des offres:', error);
    const { destination, checkIn, checkOut, adults, rooms } = req.query;
    res.render('offers', {
      hotels: [],
      conventionName: req.session.conventionName,
      discountPercentage: req.session.discountPercentage,
      discountCode: req.session.discountCode,
      error: 'Erreur lors de la récupération des offres',
      filters: {
        destination: destination || '',
        checkIn: checkIn || '',
        checkOut: checkOut || '',
        adults: adults || 2,
        rooms: rooms || 1
      }
    });
  }
});

// Page détail d'un hôtel
router.get('/hotel/:id', async (req, res) => {
  // Vérifier si l'utilisateur a un code valide
  if (!req.session.discountCode) {
    return res.redirect('/enter-code');
  }

  try {
    const hotelId = req.params.id;
    
    // Récupérer l'hôtel
    let hotel = await hotelService.getHotelById(hotelId);
    
    if (!hotel) {
      // Chercher dans les hôtels tunisiens
      const tunisiaHotels = hotelService.getTunisianHotels();
      hotel = tunisiaHotels.find(h => h.id === parseInt(hotelId));
    }

    if (!hotel) {
      return res.redirect('/offers');
    }

    // Récupérer la marge globale
    const globalMargin = await db.findOne('margins', m => m.margin_type === 'global' && m.is_active == 1) 
                         || { margin_value: 0, margin_unit: 'percentage' };

    // Vérifier si la marge globale est valide (dates)
    const now = new Date();
    const isGlobalMarginValid = !globalMargin.margin_value || (
      (!globalMargin.valid_from || new Date(globalMargin.valid_from) <= now) &&
      (!globalMargin.valid_until || new Date(globalMargin.valid_until) >= now)
    );

    // Récupérer la convention
    const convention = await db.findOne('conventions', c => c.id == req.session.conventionId);

    // Vérifier si la réduction est valide (dates)
    const isDiscountValid = !convention || (
      (!convention.valid_from || new Date(convention.valid_from) <= now) &&
      (!convention.valid_until || new Date(convention.valid_until) >= now) &&
      convention.is_active == 1
    );

    // Appliquer les marges et réductions aux chambres
    if (hotel.rooms) {
      hotel.rooms = hotel.rooms.map(room => {
        let finalPrice = room.price;

        // Appliquer la marge globale si valide
        if (isGlobalMarginValid && globalMargin.margin_value > 0) {
          if (globalMargin.margin_unit === 'percentage') {
            finalPrice = finalPrice * (1 + globalMargin.margin_value / 100);
          } else {
            finalPrice = finalPrice + globalMargin.margin_value;
          }
        }

        // Appliquer la réduction de la convention si valide
        const discountPercentage = isDiscountValid ? req.session.discountPercentage : 0;
        const discountAmount = finalPrice * (discountPercentage / 100);
        finalPrice = finalPrice - discountAmount;

        return {
          ...room,
          originalPrice: room.price,
          finalPrice: Math.round(finalPrice * 100) / 100,
          discountAmount: Math.round(discountAmount * 100) / 100,
          discountPercentage: discountPercentage
        };
      });
    }

    res.render('hotel', {
      hotel: hotel,
      conventionName: req.session.conventionName,
      discountPercentage: req.session.discountPercentage,
      discountCode: req.session.discountCode,
      checkIn: req.query.checkIn || '2024-12-01',
      checkOut: req.query.checkOut || '2024-12-05',
      adults: req.query.adults || 2,
      rooms: req.query.rooms || 1
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'hôtel:', error);
    res.redirect('/offers');
  }
});

// Déconnexion
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/enter-code');
});

module.exports = router;
