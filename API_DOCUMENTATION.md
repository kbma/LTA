# 📡 DOCUMENTATION API - Service Hôtelier

## Vue d'ensemble

Cette documentation décrit l'API utilisée pour récupérer les données hôtelières dans la plateforme HotelDiscount.

**Note importante** : L'implémentation utilise l'API **Amadeus** pour les données hôtelières en temps réel. Un mode dégradé avec données simulées est disponible si les credentials ne sont pas configurés.

## Configuration actuelle

### Service: hotelService.js
**Type**: API Amadeus (avec fallback données simulées)
**SDK**: `amadeus` (npm package officiel)
**Base URL**: https://api.amadeus.com (géré par le SDK)
**Authentification**: OAuth 2.0 (automatique via le SDK)

## Installation du SDK Amadeus

```bash
npm install amadeus
```

## Configuration des credentials

Ajoutez ces variables dans votre fichier `.env` :

```env
# Amadeus API Configuration
# Obtenez vos clés sur https://developers.amadeus.com/
AMADEUS_CLIENT_ID=votre_client_id
AMADEUS_CLIENT_SECRET=votre_client_secret
AMADEUS_HOSTNAME=test # Utilisez 'production' pour l'environnement de production
```

### Comment obtenir les credentials :

1. Créez un compte sur [Amadeus for Developers](https://developers.amadeus.com/)
2. Sélectionnez "Self-Service" pour accéder aux APIs gratuites
3. Créez une nouvelle application
4. Copiez le `API_KEY` et `API_SECRET` dans votre fichier `.env"

## Utilisation du service

### Récupérer tous les hôtels (Paris par défaut)

```javascript
const hotelService = require('./services/hotelService');

// Avec paramètres
const hotels = await hotelService.getHotels('PAR', '2024-12-01', '2024-12-05', 2);

// Avec valeurs par défaut
const hotels = await hotelService.getHotels();
```

### Rechercher des hôtels par ville

```javascript
// Les codes ville supportés: Paris, Nice, Lyon, Marseille, Barcelona, London, Rome, Madrid, Berlin
const hotels = await hotelService.searchHotels('Paris', '2024-12-01', '2024-12-05', 2);
```

### Récupérer un hôtel par ID

```javascript
const hotel = await hotelService.getHotelById('HTL12345');
```

## Structure des données

### Format des hôtels (réponse API)

```json
{
  "id": "HTL12345",
  "hotelId": "HTL12345",
  "name": "Grand Hotel Paris",
  "address": "123 Avenue des Champs-Élysées, Paris",
  "city": "Paris",
  "countryCode": "FR",
  "stars": 5,
  "description": "Hôtel de luxe au cœur de Paris",
  "image": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400",
  "latitude": 48.8566,
  "longitude": 2.3522,
  "amenities": ["WiFi", "Piscine", "Spa"],
  "rooms": [
    {
      "id": "ROOM001",
      "type": "Chambre Double",
      "description": "Chambre spacieuse avec lit double",
      "price": 150.00,
      "available": true,
      "currency": "EUR",
      "amenities": ["WiFi", "TV", "Mini-bar"]
    }
  ]
}
```

## Fallback (Données simulées)

Si les credentials Amadeus ne sont pas configurés ou si l'API échoue, le service retourne automatiquement des données simulées :

```javascript
// Dans hotelService.js
getMockHotels() {
  return [
    {
      id: 1,
      name: 'Hôtel Le Parisien',
      address: '123 Avenue des Champs-Élysées, Paris',
      stars: 5,
      // ...
    }
  ];
}
```

## Gestion des erreurs

### Codes d'erreur possibles

| Code | Description |
|------|-------------|
| 401 | Credentials Amadeus invalides |
| 429 | Limite de requêtes atteinte |
| 500 | Erreur serveur Amadeus |

### Exemple de gestion des erreurs

```javascript
try {
  const hotels = await hotelService.getHotels('PAR', '2024-12-01', '2024-12-05', 2);
  console.log('Hôtels récupérés:', hotels.length);
} catch (error) {
  if (error.response?.status === 401) {
    console.error('Credentials Amadeus invalides');
  } else if (error.response?.status === 429) {
    console.error('Limite de requêtes API atteinte');
  } else {
    console.error('Erreur:', error.message);
  }
}
```

## Endpoints Amadeus utilisés

### 1. Hotel List

Récupère la liste des hôtels dans une ville :

```
GET /shopping/hotelList
```

**Paramètres** :
- `cityCode` (string): Code ville IATA (ex: 'PAR')
- `checkInDate` (date): Date d'arrivée (YYYY-MM-DD)
- `checkOutDate` (date): Date de départ (YYYY-MM-DD)
- `adults` (integer): Nombre d'adultes

### 2. Hotel Offers Search

Recherche les offres disponibles pour un hôtel :

```
GET /shopping/hotelOffersSearch
```

**Paramètres** :
- `hotelId` (string): ID de l'hôtel
- `checkInDate` (date): Date d'arrivée
- `checkOutDate` (date): Date de départ
- `adults` (integer): Nombre d'adultes
- `roomQuantity` (integer): Nombre de chambres

### 3. Hotel by ID

Récupère les détails d'un hôtel spécifique :

```
GET /shopping/hotelByHotelId
```

**Paramètres** :
- `hotelId` (string): ID de l'hôtel

## Rate Limiting

L'API Amadeus Self-Service inclut :
- **5 000 requêtes/mois** gratuites
- **Limite de débit**: 100 requêtes/minute

Pour éviter de dépasser les limites, le service utilise :
1. Fallback automatique vers les données simulées
2. Gestion des erreurs avec retry basique

## Codes ville IATA supportés

| Ville | Code | Pays |
|-------|------|------|
| Paris | PAR | France |
| Nice | NCE | France |
| Lyon | LYS | France |
| Marseille | MRS | France |
| Barcelona | BCN | Espagne |
| London | LON | Royaume-Uni |
| Rome | ROM | Italie |
| Madrid | MAD | Espagne |
| Berlin | BER | Allemagne |

## Tester l'intégration

1. Configurez vos credentials dans `.env`
2. Redémarrez le serveur : `npm start`
3. Visitez http://localhost:3000
4. Vérifiez la console pour les logs API

## Documentation officielle Amadeus

- [Documentation API Amadeus](https://developers.amadeus.com/)
- [Référence Hotel API](https://developers.amadeus.com/documents_legacy/Hotel/v3)
- [Guide de démarrage](https://developers.amadeus.com/get-started/get-started-amadeus-apis)

---

**Version**: 2.0  
**Dernière mise à jour**: 2024  
**Auteur**: Équipe HotelDiscount
