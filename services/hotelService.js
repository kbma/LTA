const Amadeus = require('amadeus');

/**
 * Service pour gérer les données hôtelières
 * Utilise l'API Amadeus pour la recherche d'hôtels
 */

class HotelService {
  constructor() {
    // Initialisation du client Amadeus
    this.amadeus = new Amadeus({
      clientId: process.env.AMADEUS_CLIENT_ID || 'test',
      clientSecret: process.env.AMADEUS_CLIENT_SECRET || 'test',
      hostname: process.env.AMADEUS_HOSTNAME || 'test' // 'test' pour l'environnement de test
    });
  }

  /**
   * Récupère la liste des hôtels via l'API Amadeus
   * @param {string} cityCode - Code ville IATA (ex: 'PAR' pour Paris)
   * @param {string} checkInDate - Date d'arrivée (format: YYYY-MM-DD)
   * @param {string} checkOutDate - Date de départ (format: YYYY-MM-DD)
   * @param {number} adults - Nombre d'adultes
   */
  async getHotels(cityCode = 'TUN', checkInDate = '2024-12-01', checkOutDate = '2024-12-05', adults = 1) {
    try {
      // Si les credentials ne sont pas configurés ou si on demande la Tunisie, retourner les hôtels tunisiens
      if (!process.env.AMADEUS_CLIENT_ID || !process.env.AMADEUS_CLIENT_SECRET || cityCode === 'TUN') {
        console.warn('Mode hôtels Tunisiens (données locales)');
        return this.getTunisianHotels();
      }

      // Sinon, utiliser l'API Amadeus
      const response = await this.amadeus.shopping.hotelList.get({
        cityCode: cityCode,
        checkInDate: checkInDate,
        checkOutDate: checkOutDate,
        adults: adults
      });

      // Transformation des données Amadeus au format de l'application
      const hotels = response.data.map(hotel => this.mapAmadeusHotel(hotel));

      // Pour chaque hôtel, récupérer les offres et détails
      for (const hotel of hotels) {
        try {
          const offers = await this.getHotelOffers(hotel.hotelId, checkInDate, checkOutDate, adults);
          hotel.rooms = offers.map(offer => ({
            ...offer,
            price: offer.price * 3.4 // Convertir EUR en TND
          }));
        } catch (offerError) {
          console.warn(`Impossible de récupérer les offres pour ${hotel.name}:`, offerError.message);
          hotel.rooms = [];
        }
      }

      return hotels;

    } catch (error) {
      console.error('Erreur API Amadeus:', error.response?.result || error.message);
      
      // En cas d'erreur, retourner les hôtels tunisiens
      console.warn('Fallback vers les hôtels tunisiens...');
      return this.getTunisianHotels();
    }
  }

  /**
   * Récupère les offres d'un hôtel spécifique
   */
  async getHotelOffers(hotelId, checkInDate, checkOutDate, adults) {
    try {
      const response = await this.amadeus.shopping.hotelOffersSearch.get({
        hotelId: hotelId,
        checkInDate: checkInDate,
        checkOutDate: checkOutDate,
        adults: adults,
        roomQuantity: 1
      });

      return response.data.map(offer => ({
        id: offer.id,
        type: offer.room?.typeEstimated || 'Chambre Standard',
        description: offer.room?.description?.text || 'Chambre confortable',
        price: parseFloat(offer.price?.total) || 100,
        available: offer.available || true,
        currency: offer.price?.currency || 'EUR',
        amenities: offer.room?.amenities?.map(a => a.amenity) || []
      }));
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des offres: ${error.message}`);
    }
  }

  /**
   * Mappe les données d'un hôtel Amadeus au format de l'application
   */
  mapAmadeusHotel(amadeusHotel) {
    return {
      id: amadeusHotel.hotelId,
      hotelId: amadeusHotel.hotelId,
      name: amadeusHotel.name || 'Hôtel sans nom',
      address: amadeusHotel.address?.lines?.join(', ') || 'Adresse non disponible',
      city: amadeusHotel.address?.cityName || '',
      countryCode: amadeusHotel.address?.countryCode || '',
      stars: amadeusHotel.rating || 3,
      description: amadeusHotel.description?.text || 'Description non disponible',
      image: amadeusHotel.media?.[0]?.uri || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
      latitude: amadeusHotel.geoCode?.latitude,
      longitude: amadeusHotel.geoCode?.longitude,
      amenities: amadeusHotel.amenities?.map(a => a.amenity) || [],
      rooms: []
    };
  }

  /**
   * Recherche d'hôtels par ville et dates (version simplifiée)
   */
  async searchHotels(city, checkIn, checkOut, guests = 2) {
    // Conversion du nom de ville en code IATA
    const cityCodes = {
      'paris': 'PAR',
      'nice': 'NCE',
      'lyon': 'LYS',
      'marseille': 'MRS',
      'barcelona': 'BCN',
      'london': 'LON',
      'rome': 'ROM',
      'madrid': 'MAD',
      'berlin': 'BER'
    };

    const cityCode = cityCodes[city.toLowerCase()] || city.toUpperCase().substring(0, 3);
    return await this.getHotels(cityCode, checkIn, checkOut, guests);
  }

  /**
   * Récupère un hôtel spécifique par son ID
   */
  async getHotelById(hotelId) {
    try {
      if (!process.env.AMADEUS_CLIENT_ID) {
        const hotels = this.getMockHotels();
        return hotels.find(h => h.id === parseInt(hotelId) || h.hotelId === hotelId);
      }

      const response = await this.amadeus.shopping.hotelByHotelId.get({
        hotelId: hotelId
      });

      return this.mapAmadeusHotel(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'hôtel:', error.message);
      // Fallback vers les données simulées
      const hotels = this.getMockHotels();
      return hotels.find(h => h.id === parseInt(hotelId));
    }
  }

  /**
   * Données simulées - Hôels en France (EUR)
   */
  getMockHotels() {
    return [
      {
        id: 1,
        name: 'Hôtel Le Parisien',
        address: '123 Avenue des Champs-Élysées, Paris',
        stars: 5,
        description: 'Hôtel de luxe au cœur de Paris',
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
        rooms: [
          {
            id: 101,
            type: 'Chambre Simple',
            description: 'Chambre confortable avec lit simple',
            price: 120,
            available: true,
            capacity: 1,
            amenities: ['WiFi', 'TV', 'Climatisation']
          },
          {
            id: 102,
            type: 'Chambre Double',
            description: 'Chambre spacieuse avec lit double',
            price: 180,
            available: true,
            capacity: 2,
            amenities: ['WiFi', 'TV', 'Climatisation', 'Mini-bar']
          },
          {
            id: 103,
            type: 'Suite Luxe',
            description: 'Suite avec vue panoramique',
            price: 350,
            available: true,
            capacity: 3,
            amenities: ['WiFi', 'TV', 'Climatisation', 'Mini-bar', 'Jacuzzi', 'Vue Tour Eiffel']
          }
        ]
      },
      {
        id: 2,
        name: 'Hôtel Côte d\'Azur',
        address: '45 Promenade des Anglais, Nice',
        stars: 4,
        description: 'Hôtel face à la mer Méditerranée',
        image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400',
        rooms: [
          {
            id: 201,
            type: 'Chambre Vue Mer',
            description: 'Chambre avec balcon et vue sur la mer',
            price: 150,
            available: true,
            capacity: 2,
            amenities: ['WiFi', 'TV', 'Balcon', 'Vue mer']
          },
          {
            id: 202,
            type: 'Chambre Standard',
            description: 'Chambre confortable',
            price: 95,
            available: true,
            capacity: 2,
            amenities: ['WiFi', 'TV', 'Climatisation']
          },
          {
            id: 203,
            type: 'Suite Familiale',
            description: 'Suite spacieuse pour famille',
            price: 280,
            available: false,
            capacity: 4,
            amenities: ['WiFi', 'TV', 'Climatisation', 'Kitchenette', 'Balcon']
          }
        ]
      },
      {
        id: 3,
        name: 'Hôtel Montagne Blanche',
        address: '78 Route des Alpes, Chamonix',
        stars: 4,
        description: 'Hôtel au pied du Mont-Blanc',
        image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400',
        rooms: [
          {
            id: 301,
            type: 'Chambre Montagne',
            description: 'Chambre avec vue sur les montagnes',
            price: 135,
            available: true,
            capacity: 2,
            amenities: ['WiFi', 'TV', 'Cheminée', 'Vue montagne']
          },
          {
            id: 302,
            type: 'Chalet',
            description: 'Chalet privatif',
            price: 420,
            available: true,
            capacity: 6,
            amenities: ['WiFi', 'TV', 'Cheminée', 'Cuisine équipée', 'Sauna', 'Jardin']
          }
        ]
      }
    ];
  }

  /**
   * HÔTELS EN TUNISIE - Prix en Dinars Tunisiens (TND)
   */
  getTunisianHotels() {
    return [
      {
        id: 1,
        name: 'Hôtel La Grande Bleue',
        address: 'Avenue Habib Bourguiba, Sousse',
        stars: 5,
        description: 'Hôtel de luxe en bord de mer avec vue panoramique sur la Méditerranée. Profitez d\'un sejour inoubliable dans un cadre magnifique avec des services de qualité supérieure.',
        image: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=600',
        gallery: [
          'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800',
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',
          'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800',
          'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800'
        ],
        latitude: 35.8288,
        longitude: 10.6405,
        rating: 4.8,
        reviewCount: 156,
        ratingDistribution: { 5: 98, 4: 38, 3: 12, 2: 5, 1: 3 },
        reviews: [
          { author: 'Marie D.', date: 'Janvier 2025', rating: 5, title: 'Exceptionnel!', content: 'Chambre spacieuse et propre, personnel très accueillant. Le petit-déjeuner était variado et délicieux. Je recommande vivement!', helpful: 24 },
          { author: 'Ahmed B.', date: 'Décembre 2024', rating: 5, title: 'Parfait pour les familles', content: 'Nous avons passé un excellent séjour en famille. Les enfants ont adorés la piscine. Service impeccable.', helpful: 18 },
          { author: 'Sophie L.', date: 'Novembre 2024', rating: 4, title: 'Très bon rapport qualité-prix', content: 'Bon hôtel avec de belles prestations. Un peu de bruit le matin mais rien de grave. Je reviendrai.', helpful: 12 }
        ],
        amenities: ['WiFi gratuit', 'Piscine', 'Spa', 'Restaurant', 'Bar', 'Salle de sport', 'Plage privée', 'Climatisation', 'Parking gratuit', 'Service chambre 24h/24'],
        rooms: [
          {
            id: 1,
            type: 'Chambre Deluxe',
            description: 'Chambre moderne avec balcon vue mer',
            originalPrice: 300,
            price: 250,
            available: true,
            capacity: 2,
            amenities: ['WiFi', 'TV', 'Climatisation', 'Mini-bar', 'Vue mer', 'Coffre-fort']
          },
          {
            id: 2,
            type: 'Suite Présidentielle',
            description: 'Suite spacieuse avec salon et vue mer',
            originalPrice: 700,
            price: 550,
            available: true,
            capacity: 4,
            amenities: ['WiFi', 'TV', 'Climatisation', 'Jacuzzi', 'Vue mer', 'Service majordome']
          }
        ]
      },
      {
        id: 2,
        name: 'Hôtel Le Pacha',
        address: 'Port El Kantaoui, Sousse',
        stars: 4,
        description: 'Hôtel authentique avec architecture traditionnelle et marina. Un cadre enchanteur pour un séjour mémorable en Tunisie.',
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600',
        gallery: [
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',
          'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800',
          'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
          'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800'
        ],
        latitude: 35.8898,
        longitude: 10.6005,
        rating: 4.5,
        reviewCount: 98,
        ratingDistribution: { 5: 55, 4: 28, 3: 10, 2: 3, 1: 2 },
        reviews: [
          { author: 'Karim M.', date: ' Janvier 2025', rating: 5, title: 'Magnifique vue sur le port', content: 'L\'hôtel est magnifique, la vue sur le port est incroyable. Le personnel est aux petits soins.', helpful: 15 },
          { author: 'Fatma H.', date: 'Décembre 2024', rating: 4, title: 'Séjour agréable', content: 'Très bon séjour dans l\'ensemble. Les chambres sont confortables et le petit-déjeuner est excellent.', helpful: 10 }
        ],
        amenities: ['WiFi gratuit', 'Piscine', 'Restaurant', 'Bar', 'Marina privée', 'Climatisation', 'Parking gratuit', 'Navette plage'],
        rooms: [
          {
            id: 3,
            type: 'Chambre Standard',
            description: 'Chambre confortable avec vue jardin',
            originalPrice: 150,
            price: 120,
            available: true,
            capacity: 2,
            amenities: ['WiFi', 'TV', 'Climatisation', 'Vue jardin']
          },
          {
            id: 4,
            type: 'Chambre Marina',
            description: 'Chambre avec vue sur le port de plaisance',
            originalPrice: 220,
            price: 180,
            available: true,
            capacity: 2,
            amenities: ['WiFi', 'TV', 'Climatisation', 'Mini-bar', 'Vue port']
          }
        ]
      },
      {
        id: 3,
        name: 'Hôtel Les Dunes',
        address: 'Zone Touristique, Djerba',
        stars: 5,
        description: 'Complexe hôtelier en front de mer avec plages de sable fin. L\'endroit idéal pour se détendre et profiter du soleil de Tunisie.',
        image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600',
        gallery: [
          'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',
          'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800',
          'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800'
        ],
        latitude: 33.8758,
        longitude: 10.8589,
        rating: 4.6,
        reviewCount: 203,
        ratingDistribution: { 5: 125, 4: 52, 3: 18, 2: 5, 1: 3 },
        reviews: [
          { author: 'Paul R.', date: ' Janvier 2025', rating: 5, title: 'Paradísiaque!', content: 'Les bungalows sont merveilleux, directement sur la plage. Le personnel est adorable et très professionnel.', helpful: 32 },
          { author: 'Nadia K.', date: 'Décembre 2024', rating: 5, title: 'Vacances parfaites', content: 'Nous avons adorés notre séjour. Les activités pour enfants sont top et la nourriture est excellente.', helpful: 21 },
          { author: 'Marc D.', date: 'Novembre 2024', rating: 4, title: 'Excellent complexe', content: 'Très belle établissement avec de grandes piscines et une plage privée magnifique.', helpful: 14 }
        ],
        amenities: ['WiFi gratuit', 'Piscine', 'Spa', 'Restaurant', 'Bar', 'Plage privée', 'Animations', 'Climatisation', 'Parking gratuit', 'Navette aéroport'],
        rooms: [
          {
            id: 5,
            type: 'Bungalow Vue Jardin',
            description: 'Bungalow confort au milieu des palmiers',
            originalPrice: 250,
            price: 200,
            available: true,
            capacity: 2,
            amenities: ['WiFi', 'TV', 'Climatisation', 'Terrasse', 'Vue jardin']
          },
          {
            id: 6,
            type: 'Bungalow Vue Mer',
            description: 'Bungalow avec accès direct à la plage',
            originalPrice: 380,
            price: 300,
            available: true,
            capacity: 2,
            amenities: ['WiFi', 'TV', 'Climatisation', 'Plage privée', 'Vue mer']
          }
        ]
      }
    ];
  }
}

module.exports = new HotelService();
