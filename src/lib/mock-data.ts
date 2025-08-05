import type { Property } from './types';

export const properties: Property[] = [
  {
    id: 'prop1',
    title: 'Modern Villa in Beverly Hills',
    price: 3500000,
    address: '123 Luxury Lane',
    city: 'Beverly Hills',
    state: 'CA',
    zip: '90210',
    bedrooms: 5,
    bathrooms: 6,
    sqft: 6000,
    type: 'House',
    status: 'For Sale',
    description: 'A stunning modern villa with breathtaking views, a home theater, and an infinity pool. Experience luxury living at its finest.',
    images: ['https://placehold.co/800x600/c2f0c2/4f4f4f', 'https://placehold.co/800x600/c2f0c2/4f4f4f', 'https://placehold.co/800x600/c2f0c2/4f4f4f'],
    features: ['Infinity Pool', 'Home Theater', 'Gourmet Kitchen', '3-Car Garage', 'Smart Home System'],
    agent: {
      name: 'Jane Doe',
      avatar: 'https://placehold.co/100x100'
    },
    isVerified: true,
    postedDate: '2023-10-26',
    virtualTourUrl: '#',
    priceHistory: [
      { date: '2023-01-01', price: 3200000, label: 'Jan' },
      { date: '2023-04-01', price: 3350000, label: 'Apr' },
      { date: '2023-07-01', price: 3450000, label: 'Jul' },
      { date: '2023-10-01', price: 3500000, label: 'Oct' },
    ]
  },
  {
    id: 'prop2',
    title: 'Cozy Downtown Apartment',
    price: 750000,
    address: '456 Urban St, Apt 12B',
    city: 'San Francisco',
    state: 'CA',
    zip: '94105',
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1200,
    type: 'Apartment',
    status: 'For Sale',
    description: 'A chic and cozy apartment in the heart of the city, featuring modern amenities and floor-to-ceiling windows with city views.',
    images: ['https://placehold.co/800x600/e6f5e6/4f4f4f', 'https://placehold.co/800x600/e6f5e6/4f4f4f'],
    features: ['City View', 'Modern Kitchen', 'Fitness Center', '24/7 Security'],
    agent: {
      name: 'John Smith',
      avatar: 'https://placehold.co/100x100'
    },
    isVerified: true,
    postedDate: '2023-11-05',
    priceHistory: [
      { date: '2023-02-01', price: 720000, label: 'Feb' },
      { date: '2023-05-01', price: 730000, label: 'May' },
      { date: '2023-08-01', price: 740000, label: 'Aug' },
      { date: '2023-11-01', price: 750000, label: 'Nov' },
    ]
  },
  {
    id: 'prop3',
    title: 'Suburban Family Home',
    price: 980000,
    address: '789 Maple Ave',
    city: 'Austin',
    state: 'TX',
    zip: '78701',
    bedrooms: 4,
    bathrooms: 3,
    sqft: 3500,
    type: 'House',
    status: 'For Sale',
    description: 'Spacious family home in a quiet suburban neighborhood. Large backyard, great schools nearby, and a newly renovated kitchen.',
    images: ['https://placehold.co/800x600/90ee90/4f4f4f', 'https://placehold.co/800x600/90ee90/4f4f4f'],
    features: ['Large Backyard', 'Renovated Kitchen', 'Community Pool', 'Fireplace'],
    agent: {
      name: 'Emily White',
      avatar: 'https://placehold.co/100x100'
    },
    isVerified: false,
    postedDate: '2023-11-15',
    priceHistory: [
      { date: '2023-03-01', price: 950000, label: 'Mar' },
      { date: '2023-06-01', price: 965000, label: 'Jun' },
      { date: '2023-09-01', price: 975000, label: 'Sep' },
      { date: '2023-11-01', price: 980000, label: 'Nov' },
    ]
  },
    {
    id: 'prop4',
    title: 'Rustic Lakeside Cabin',
    price: 550000,
    address: '101 Forest Rd',
    city: 'Lake Tahoe',
    state: 'CA',
    zip: '96145',
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1800,
    type: 'House',
    status: 'For Sale',
    description: 'Charming cabin with lake access. Perfect for a vacation home or a peaceful primary residence. Features a large deck and stone fireplace.',
    images: ['https://placehold.co/800x600/c2f0c2/4f4f4f', 'https://placehold.co/800x600/c2f0c2/4f4f4f'],
    features: ['Lake Access', 'Large Deck', 'Stone Fireplace', 'Wooded Lot'],
    agent: {
      name: 'Michael Brown',
      avatar: 'https://placehold.co/100x100'
    },
    isVerified: true,
    postedDate: '2023-11-20',
    priceHistory: [
      { date: '2023-01-01', price: 520000, label: 'Jan' },
      { date: '2023-04-01', price: 530000, label: 'Apr' },
      { date: '2023-07-01', price: 540000, label: 'Jul' },
      { date: '2023-10-01', price: 550000, label: 'Oct' },
    ]
  },
];
