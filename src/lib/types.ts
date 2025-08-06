export type Property = {
  id: string;
  title: string;
  price: number;
  address: string;
  city: string;
  state: string;
  zip: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  type: 'House' | 'Apartment' | 'Condo' | 'Land';
  status: 'For Sale' | 'For Rent' | 'Sold';
  description: string;
  images: string[];
  features: string[];
  agent: {
    name: string;
    avatar: string;
  };
  isVerified: boolean;
  postedDate: string;
  virtualTourUrl?: string;
  priceHistory: { date: string; price: number; label: string }[];
};

export type Conversation = {
  id: number;
  name: string;
  property: string;
  avatar: string;
  messages: {
    from: string;
    text: string;
    time: string;
    read?: boolean;
  }[];
};
