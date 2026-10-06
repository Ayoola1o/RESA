import type { Property, Conversation, Application, Lease, MaintenanceRequest, Tenant } from './types';

const realEstateImages = [
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
];

const getPropertyImage = (index: number) => realEstateImages[index % realEstateImages.length];

const userAvatars = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80',
];

const getAvatar = (index: number) => userAvatars[index % userAvatars.length];

export const properties: Property[] = [
  {
    id: 'prop1',
    title: 'Luxury 4 Bedroom Duplex',
    price: 180000000,
    address: 'Lekki Phase 1',
    city: 'Lagos',
    state: 'Lagos',
    zip: '105102',
    bedrooms: 4,
    bathrooms: 4,
    sqft: 3200,
    type: 'House',
    status: 'For Sale',
    description: 'An architectural masterpiece in Lekki Phase 1, Lagos. High-end finishes, private swimming pool, smart home integration, cinema room, and round-the-clock security in a serene gated estate.',
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
    ],
    features: ['Swimming Pool', 'Smart Home System', 'Fitted Kitchen', 'BQ Included', '24/7 Security'],
    agent: { name: 'Ayoola Properties', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80' },
    isVerified: true,
    postedDate: '2025-04-15',
    virtualTourUrl: '#',
    rating: 4.8,
    reviewsCount: 24,
    priceHistory: [ { date: '2024-01-01', price: 165000000, label: 'Jan' }, { date: '2024-06-01', price: 172000000, label: 'Jun' }, { date: '2025-01-01', price: 180000000, label: 'Jan' } ],
    floodRisk: 'Low'
  },
  {
    id: 'prop2',
    title: '3 Bedroom Bungalow',
    price: 85000000,
    address: '4th Avenue, Gwarinpa',
    city: 'Abuja',
    state: 'FCT',
    zip: '900108',
    bedrooms: 3,
    bathrooms: 3,
    sqft: 1800,
    type: 'House',
    status: 'For Sale',
    description: 'Charming detached 3 bedroom bungalow in Gwarinpa, Abuja. Large landscaped green compound, ample parking for 4 cars, fully ensuite rooms, and serene neighborhood.',
    images: [
      'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1200&q=80',
    ],
    features: ['Perimeter Fence', 'Green Lawn', 'Ensuite Bedrooms', 'Borehole & Water Plant'],
    agent: { name: 'Abuja Realty Hub', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80' },
    isVerified: false,
    postedDate: '2025-04-10',
    rating: 4.6,
    reviewsCount: 18,
    priceHistory: [ { date: '2024-05-01', price: 80000000, label: 'May' }, { date: '2025-01-01', price: 85000000, label: 'Jan' } ],
    floodRisk: 'None'
  },
  {
    id: 'prop3',
    title: '2 Bedroom Apartment',
    price: 4500000,
    address: 'Ahmadu Bello Way, Victoria Island',
    city: 'Lagos',
    state: 'Lagos',
    zip: '101241',
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1200,
    type: 'Apartment',
    status: 'For Rent',
    priceUnit: '/year',
    description: 'Luxury serviced 2 bedroom apartment in prestigious Victoria Island, Lagos. Elevators, Olympic swimming pool, gym, 24/7 power, and ocean breeze.',
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
    ],
    features: ['Serviced Complex', 'Swimming Pool', 'Fitness Gym', 'Ocean Breeze', '24/7 Security'],
    agent: { name: 'Island Living', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80' },
    isVerified: true,
    postedDate: '2025-04-18',
    rating: 4.4,
    reviewsCount: 12,
    priceHistory: [ { date: '2024-03-01', price: 4000000, label: 'Mar' }, { date: '2025-01-01', price: 4500000, label: 'Jan' } ],
    floodRisk: 'Low'
  },
  {
    id: 'prop4',
    title: 'Residential Land (300sqm)',
    price: 45000000,
    address: 'GRA Scheme, Ikeja',
    city: 'Lagos',
    state: 'Lagos',
    zip: '100271',
    bedrooms: 0,
    bathrooms: 0,
    sqft: 3229,
    type: 'Land',
    status: 'For Sale',
    description: 'Prime 300sqm dry residential plot in Ikeja, Lagos with verifiable Certificate of Occupancy (C of O), instant physical allocation, and paved access roads.',
    images: [
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
    ],
    features: ['100% Dry Land', 'C of O Verified', 'Perimeter Wall', 'Electricity Connected'],
    agent: { name: 'Lagos Lands Prime', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80' },
    isVerified: true,
    postedDate: '2025-04-12',
    rating: 4.2,
    reviewsCount: 8,
    priceHistory: [],
    floodRisk: 'None'
  },
  {
    id: 'prop5',
    title: 'Miami Beachfront Condo',
    price: 4500,
    address: '25 Ocean Drive',
    city: 'Miami',
    state: 'FL',
    zip: '33139',
    bedrooms: 3,
    bathrooms: 3,
    sqft: 2200,
    type: 'Condo',
    status: 'Rented',
    description: 'Luxurious condo with direct beach access and panoramic ocean views. State-of-the-art amenities.',
    images: [
      'https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
    ],
    features: ['Oceanfront', 'Rooftop Pool', 'Valet Parking', 'Gym'],
    agent: { name: 'Sophia Garcia', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80' },
    isVerified: true,
    postedDate: '2023-11-22',
    priceHistory: [ { date: '2023-01-01', price: 1100000, label: 'Jan' }, { date: '2023-05-01', price: 1150000, label: 'May' }, { date: '2023-09-01', price: 1200000, label: 'Sep' } ],
    floodRisk: 'Medium'
  },
  {
    id: 'prop6',
    title: 'Denver Mountain View House',
    price: 850000,
    address: '555 Peak Lane',
    city: 'Denver',
    state: 'CO',
    zip: '80202',
    bedrooms: 4,
    bathrooms: 4,
    sqft: 3200,
    type: 'House',
    status: 'For Sale',
    description: 'Modern home with stunning Rocky Mountain views. Open floor plan and high-end finishes throughout.',
    images: [
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80',
    ],
    features: ['Mountain Views', 'Open Concept', 'Heated Floors', '2-Car Garage'],
    agent: { name: 'David Miller', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80' },
    isVerified: false,
    postedDate: '2023-11-18',
    priceHistory: [ { date: '2023-02-01', price: 820000, label: 'Feb' }, { date: '2023-06-01', price: 835000, label: 'Jun' }, { date: '2023-10-01', price: 850000, label: 'Oct' } ],
    floodRisk: 'Low'
  },
  {
    id: 'prop7',
    title: 'Historic Boston Brownstone',
    price: 2100000,
    address: '12 Beacon St',
    city: 'Boston',
    state: 'MA',
    zip: '02108',
    bedrooms: 4,
    bathrooms: 5,
    sqft: 4000,
    type: 'House',
    status: 'For Sale',
    description: 'A piece of history in Beacon Hill. This brownstone combines classic charm with modern updates.',
    images: [
      'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=1200&q=80',
    ],
    features: ['Historic District', 'Rooftop Terrace', 'Original Woodwork', 'Wine Cellar'],
    agent: { name: 'Olivia Chen', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80' },
    isVerified: true,
    postedDate: '2023-11-12',
    priceHistory: [ { date: '2023-01-01', price: 2000000, label: 'Jan' }, { date: '2023-06-01', price: 2050000, label: 'Jun' }, { date: '2023-11-01', price: 2100000, label: 'Nov' } ],
    floodRisk: 'Low'
  },
  {
    id: 'prop8',
    title: 'Chicago Loft with Skyline View',
    price: 680000,
    address: '99 Wicker Park Ave',
    city: 'Chicago',
    state: 'IL',
    zip: '60622',
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1500,
    type: 'Condo',
    status: 'For Sale',
    description: 'Stunning loft in a trendy neighborhood with exposed brick and panoramic city views.',
    images: [
      'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=1200&q=80',
    ],
    features: ['Exposed Brick', 'High Ceilings', 'Private Balcony', 'Rooftop Deck'],
    agent: { name: 'Ethan Williams', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80' },
    isVerified: true,
    postedDate: '2023-11-10',
    priceHistory: [ { date: '2023-03-01', price: 650000, label: 'Mar' }, { date: '2023-07-01', price: 670000, label: 'Jul' }, { date: '2023-11-01', price: 680000, label: 'Nov' } ],
    floodRisk: 'Low'
  },
  {
    id: 'prop9',
    title: 'Seattle Waterfront House',
    price: 1800000,
    address: '42 Puget Sound Rd',
    city: 'Seattle',
    state: 'WA',
    zip: '98101',
    bedrooms: 4,
    bathrooms: 3,
    sqft: 3800,
    type: 'House',
    status: 'For Sale',
    description: 'Beautiful waterfront property with private dock and stunning views of Puget Sound.',
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
    ],
    features: ['Waterfront', 'Private Dock', 'Floor-to-ceiling windows', 'Hot Tub'],
    agent: { name: 'Isabella Johnson', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80' },
    isVerified: true,
    postedDate: '2023-11-08',
    priceHistory: [ { date: '2023-02-01', price: 1750000, label: 'Feb' }, { date: '2023-06-01', price: 1780000, label: 'Jun' }, { date: '2023-10-01', price: 1800000, label: 'Oct' } ],
    floodRisk: 'Medium'
  },
  {
    id: 'prop10',
    title: 'Phoenix Desert Oasis',
    price: 950000,
    address: '7 Cactus Lane',
    city: 'Phoenix',
    state: 'AZ',
    zip: '85001',
    bedrooms: 5,
    bathrooms: 4,
    sqft: 4500,
    type: 'House',
    status: 'For Sale',
    description: 'Spacious home with a resort-style backyard, pool, and outdoor kitchen.',
    images: [
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
    ],
    features: ['Swimming Pool', 'Outdoor Kitchen', 'Desert Landscaping', 'Solar Panels'],
    agent: { name: 'Lucas Hernandez', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80' },
    isVerified: false,
    postedDate: '2023-11-01',
    priceHistory: [ { date: '2023-04-01', price: 920000, label: 'Apr' }, { date: '2023-08-01', price: 935000, label: 'Aug' }, { date: '2023-11-01', price: 950000, label: 'Nov' } ],
    floodRisk: 'Low'
  },
  ...Array.from({ length: 34 }, (_, i) => ({
    id: `prop${11 + i}`,
    title: 'Spacious Family Home',
    price: 800000 + i * 10000,
    address: `${100 + i} Oak Street`,
    city: 'Columbus',
    state: 'OH',
    zip: '43215',
    bedrooms: 4,
    bathrooms: 3,
    sqft: 2800 + i * 50,
    type: 'House' as Property['type'],
    status: 'For Sale' as Property['status'],
    description: 'A beautiful and spacious home perfect for families, located in a friendly neighborhood.',
    images: [getPropertyImage(i)],
    features: ['Large Yard', '2-Car Garage', 'Modern Kitchen', 'Community Park'],
    agent: { name: 'Agent Smith', avatar: getAvatar(i) },
    isVerified: i % 2 === 0,
    postedDate: `2023-10-${(i % 30) + 1}`,
    priceHistory: [ { date: '2023-01-01', price: 780000 + i * 10000, label: 'Jan' }, { date: '2023-06-01', price: 790000 + i * 10000, label: 'Jun' } ],
    floodRisk: 'Low' as const
  })),
  ...Array.from({ length: 34 }, (_, i) => ({
    id: `rent${1 + i}`,
    title: `Modern Downtown Loft`,
    price: 2500 + i * 100,
    address: `${200 + i} High Street, Apt ${300 + i}`,
    city: 'New York',
    state: 'NY',
    zip: '10001',
    bedrooms: 1 + (i % 3),
    bathrooms: 1 + (i % 2),
    sqft: 800 + i * 20,
    type: 'Apartment' as Property['type'],
    status: (i % 4 === 0 ? 'Rented' : 'For Rent') as Property['status'],
    description: 'Stylish apartment for rent in a prime downtown location, with great amenities.',
    images: [getPropertyImage(i + 3)],
    features: ['Gym Access', 'Rooftop Terrace', 'In-unit Laundry', 'Concierge'],
    agent: { name: 'Rental Group', avatar: getAvatar(i + 1) },
    isVerified: i % 3 === 0,
    postedDate: `2023-11-${(i % 30) + 1}`,
    priceHistory: [],
    floodRisk: 'Low' as 'Low' | 'Medium' | 'High' | 'None'
  })),
  ...Array.from({ length: 34 }, (_, i) => ({
    id: `sr${i + 1}`,
    title: `Cozy Single Room ${i + 1}`,
    price: 600 + i * 20,
    address: `${300 + i} College Ave`,
    city: 'Student City',
    state: 'MA',
    zip: '02140',
    bedrooms: 1,
    bathrooms: 1,
    sqft: 250 + i * 5,
    type: 'Single Room' as Property['type'],
    status: 'For Rent' as Property['status'],
    description: 'A comfortable and affordable single room, perfect for students or young professionals.',
    images: [getPropertyImage(i + 6)],
    features: ['Shared Kitchen', 'All Utilities Included', 'Furnished', 'Close to Campus'],
    agent: { name: 'Campus Rentals', avatar: getAvatar(i + 2) },
    isVerified: i % 3 === 0,
    postedDate: `2023-11-${(i % 30) + 1}`,
    priceHistory: [],
    floodRisk: 'Low' as const
  })),
  ...Array.from({ length: 34 }, (_, i) => ({
    id: `rp${i + 1}`,
    title: `Spacious Room & Parlor Apt ${i + 1}`,
    price: 1200 + i * 50,
    address: `${400 + i} Family Circle`,
    city: 'Metroville',
    state: 'GA',
    zip: '30303',
    bedrooms: 1,
    bathrooms: 1,
    sqft: 600 + i * 10,
    type: 'R&P Apart' as Property['type'],
    status: 'For Rent' as Property['status'],
    description: 'A well-laid-out room and parlor apartment with a separate living area.',
    images: [getPropertyImage(i + 2)],
    features: ['Separate Living Room', 'Balcony', 'Gated Community', 'Parking Space'],
    agent: { name: 'City Apartments', avatar: getAvatar(i + 3) },
    isVerified: i % 2 === 0,
    postedDate: `2023-11-${(i % 30) + 1}`,
    priceHistory: [],
    floodRisk: 'Medium' as const
  })),
  ...Array.from({ length: 34 }, (_, i) => ({
    id: `sa${i + 1}`,
    title: `Modern Self-Contained Apt ${i + 1}`,
    price: 1800 + i * 75,
    address: `${500 + i} Independence Way`,
    city: 'Liberty Town',
    state: 'PA',
    zip: '19104',
    bedrooms: 1,
    bathrooms: 1,
    sqft: 750 + i * 15,
    type: 'Self Apart' as Property['type'],
    status: 'For Rent' as Property['status'],
    description: 'A fully self-contained apartment with a private kitchen and bathroom.',
    images: [getPropertyImage(i + 5)],
    features: ['Private Kitchen', 'Modern Bathroom', 'Washer/Dryer', 'High-Speed Internet'],
    agent: { name: 'Prestige Living', avatar: getAvatar(i + 4) },
    isVerified: true,
    postedDate: `2023-11-${(i % 30) + 1}`,
    priceHistory: [],
    floodRisk: 'Low' as const
  })),
  ...Array.from({ length: 34 }, (_, i) => ({
    id: `os${i + 1}`,
    title: `Prime Downtown Office Space ${i + 1}`,
    price: 5000 + i * 200,
    address: `${10 + i} Commerce Plaza`,
    city: 'Business Bay',
    state: 'NY',
    zip: '10005',
    bedrooms: 0,
    bathrooms: 0,
    sqft: 1000 + i * 100,
    type: 'Office Space' as Property['type'],
    status: 'For Rent' as Property['status'],
    description: 'A professional office space in a high-rise building with great amenities.',
    images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80'],
    features: ['Conference Rooms', 'Reception Service', 'High-Speed Internet', 'Parking Garage'],
    agent: { name: 'Corporate Realty', avatar: getAvatar(i + 5) },
    isVerified: true,
    postedDate: `2023-10-${(i % 30) + 1}`,
    priceHistory: [],
    floodRisk: 'Low' as const
  })),
  ...Array.from({ length: 34 }, (_, i) => ({
    id: `wh${i + 1}`,
    title: `Large Industrial Warehouse ${i + 1}`,
    price: 10000 + i * 500,
    address: `${1 + i} Logistics Drive`,
    city: 'Industry City',
    state: 'NJ',
    zip: '07302',
    bedrooms: 0,
    bathrooms: 0,
    sqft: 20000 + i * 1000,
    type: 'Warehouse' as Property['type'],
    status: 'For Rent' as Property['status'],
    description: 'A massive warehouse space with high ceilings and multiple loading docks.',
    images: ['https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80'],
    features: ['Loading Docks', '30ft Ceilings', 'Office Space Included', 'Secure Yard'],
    agent: { name: 'Industrial Properties', avatar: getAvatar(i) },
    isVerified: i % 2 === 0,
    postedDate: `2023-10-${(i % 30) + 1}`,
    priceHistory: [],
    floodRisk: 'Medium' as const
  })),
  ...Array.from({ length: 34 }, (_, i) => ({
    id: `sh${i + 1}`,
    title: `Retail Shop on Main Street ${i + 1}`,
    price: 3500 + i * 150,
    address: `${1000 + i} Main St`,
    city: 'Commerceville',
    state: 'CA',
    zip: '90212',
    bedrooms: 0,
    bathrooms: 1,
    sqft: 1200 + i * 50,
    type: 'Shop' as Property['type'],
    status: 'For Rent' as Property['status'],
    description: 'A retail shop with high foot traffic and excellent window display opportunities.',
    images: ['https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80'],
    features: ['High Foot Traffic', 'Large Windows', 'Stock Room', 'Street Parking'],
    agent: { name: 'Retail Spaces Inc.', avatar: getAvatar(i + 1) },
    isVerified: true,
    postedDate: `2023-10-${(i % 30) + 1}`,
    priceHistory: [],
    floodRisk: 'Low' as const
  })),
  ...Array.from({ length: 34 }, (_, i) => ({
    id: `ld${i + 1}`,
    title: `Residential Land Plot ${i + 1}`,
    price: 250000 + i * 10000,
    address: `Lot ${10 + i}, Greenfield Estates`,
    city: 'Rural County',
    state: 'TX',
    zip: '78610',
    bedrooms: 0,
    bathrooms: 0,
    sqft: 43560 + i * 1000, // 1 acre +
    type: 'Land' as Property['type'],
    status: 'For Sale' as Property['status'],
    description: 'A beautiful plot of land ready for you to build your dream home.',
    images: ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80'],
    features: ['Utilities Available', 'Paved Road Access', 'No HOA', 'Zoned Residential'],
    agent: { name: 'Landmark Realty', avatar: getAvatar(i + 2) },
    isVerified: i % 4 === 0,
    postedDate: `2023-09-${(i % 30) + 1}`,
    priceHistory: [],
    floodRisk: 'None' as const
  })),
];


export const conversations: Conversation[] = [
  {
    id: 1,
    name: "Jane Doe (Agent)",
    property: "Modern Villa",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    messages: [
      { from: "Jane Doe (Agent)", text: "Hi John, I have some great news about the Modern Villa!", time: "10:00 AM", read: true },
      { from: "John Doe", text: "That's exciting! What's the update?", time: "10:01 AM" },
      { from: "Jane Doe (Agent)", text: "The seller has accepted your offer! Congratulations!", time: "10:02 AM", read: true },
      { from: "John Doe", text: "Wow, that's fantastic! Thanks for all your help, Jane.", time: "10:05 AM" },
    ]
  },
  {
    id: 2,
    name: "Tenant (456 Urban St)",
    property: "Cozy Downtown Apartment",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    messages: [
        { from: "Tenant (456 Urban St)", text: "Hi John, the sink in the kitchen is leaking. Can you please take a look?", time: "Yesterday", read: true },
        { from: "John Doe", text: "Oh no, sorry to hear that. I'll get a plumber to come over tomorrow morning. Is that okay?", time: "Yesterday" },
        { from: "Tenant (456 Urban St)", text: "Yes, that works perfectly. Thank you!", time: "Yesterday", read: true },
    ]
  },
  {
    id: 3,
    name: "Michael Brown (Agent)",
    property: "Rustic Lakeside Cabin",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    messages: [
      { from: "Michael Brown (Agent)", text: "Following up on the Rustic Lakeside Cabin - are you still interested in scheduling a viewing?", time: "3 days ago", read: false },
    ]
  },
];

const rentalProperty = properties.find(p => p.status === 'For Rent');
const forSaleProperty = properties.find(p => p.status === 'For Sale');


export const applications: Application[] = [
    {
        id: 'app1',
        propertyId: rentalProperty?.id || 'rent1',
        propertyTitle: rentalProperty?.title || 'Modern Downtown Loft',
        propertyImage: rentalProperty?.images[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
        status: 'Approved',
        dateSubmitted: '2023-11-15',
        type: 'Rental',
    },
    {
        id: 'app2',
        propertyId: forSaleProperty?.id || 'prop2',
        propertyTitle: forSaleProperty?.title || 'Cozy Downtown Apartment',
        propertyImage: forSaleProperty?.images[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
        status: 'Under Review',
        dateSubmitted: '2023-11-20',
        type: 'Offer',
    },
    {
        id: 'app3',
        propertyId: 'rent3',
        propertyTitle: 'Modern Downtown Loft',
        propertyImage: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
        status: 'Submitted',
        dateSubmitted: '2023-11-22',
        type: 'Rental',
    },
    {
        id: 'app4',
        propertyId: 'prop7',
        propertyTitle: 'Historic Boston Brownstone',
        propertyImage: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=1200&q=80',
        status: 'Rejected',
        dateSubmitted: '2023-10-30',
        type: 'Offer',
    },
]

const today = new Date();

const tenantNames = ["Alice Johnson", "Bob Williams", "Charlie Brown", "Diana Prince", "Ethan Hunt", "Fiona Glenanne", "George Costanza", "Holly Golightly"];

// Find all rented properties
const rentedProperties = properties.filter(p => p.status === 'Rented');

// Generate leases for each rented property
export const leases: Lease[] = rentedProperties.map((prop, i) => {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - (i % 12));
    const endDate = new Date(startDate);
    endDate.setFullYear(startDate.getFullYear() + 1);

    return {
        id: `lease${i + 1}`,
        propertyId: prop.id,
        propertyTitle: prop.title,
        tenantName: tenantNames[i % tenantNames.length],
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        rentAmount: prop.price,
        status: 'Active'
    };
});

export const maintenanceRequests: MaintenanceRequest[] = [
    { id: 'maint1', propertyId: 'prop2', propertyTitle: 'Cozy Downtown Apartment', tenantName: 'Alice Johnson', dateSubmitted: '2023-11-28', description: "The kitchen sink is clogged and water is not draining properly.", category: 'Plumbing', priority: 'High', status: 'Pending' },
    { id: 'maint2', propertyId: 'prop5', propertyTitle: 'Miami Beachfront Condo', tenantName: 'Bob Williams', dateSubmitted: '2023-11-25', description: "The AC unit in the master bedroom is making a loud rattling noise.", category: 'HVAC', priority: 'Medium', status: 'In Progress' },
    { id: 'maint3', propertyId: 'rent4', propertyTitle: 'Modern Downtown Loft', tenantName: 'Charlie Brown', dateSubmitted: '2023-11-22', description: "A light fixture in the hallway has burned out. I can't reach it to change the bulb.", category: 'Electrical', priority: 'Low', status: 'Completed' },
    { id: 'maint4', propertyId: 'prop2', propertyTitle: 'Cozy Downtown Apartment', tenantName: 'Alice Johnson', dateSubmitted: '2023-11-20', description: "The main door lock is sticking and it's very difficult to turn the key.", category: 'Structural', priority: 'High', status: 'Completed' },
    { id: 'maint5', propertyId: 'prop5', propertyTitle: 'Miami Beachfront Condo', tenantName: 'Bob Williams', dateSubmitted: '2023-11-18', description: "No hot water in the guest bathroom. The rest of the apartment is fine.", category: 'Plumbing', priority: 'Emergency', status: 'Pending' },
];


export const tenants: Record<string, Tenant> = {};

rentedProperties.forEach((prop, i) => {
    const lease = leases.find(l => l.propertyId === prop.id);
    if (lease) {
        const paymentStatusOptions: Tenant['paymentStatus'][] = ['Paid', 'Upcoming', 'Overdue'];
        const paymentStatus = paymentStatusOptions[i % 3];
        
        let nextPaymentDue = new Date();
        if (paymentStatus === 'Upcoming') {
            nextPaymentDue.setDate(today.getDate() + (i % 15) + 1);
        } else if (paymentStatus === 'Overdue') {
            nextPaymentDue.setDate(today.getDate() - ((i % 5) + 1));
        } else { // Paid
            nextPaymentDue.setMonth(today.getMonth() + 1);
            nextPaymentDue.setDate(1);
        }

        tenants[prop.id] = {
            name: lease.tenantName,
            avatar: getAvatar(i),
            leaseId: lease.id,
            nextPaymentDue: nextPaymentDue.toISOString().split('T')[0],
            rentAmount: prop.price,
            paymentStatus: paymentStatus
        };
    }
});
