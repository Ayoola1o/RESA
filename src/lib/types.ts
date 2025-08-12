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
  type: 'House' | 'Apartment' | 'Condo' | 'Land' | 'Single Room' | 'R&P Apart' | 'Self Apart' | 'Office Space' | 'Warehouse' | 'Shop';
  status: 'For Sale' | 'For Rent' | 'Sold' | 'Rented';
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
  floodRisk: 'Low' | 'Medium' | 'High' | 'None';
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

export type Application = {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyImage: string;
  status: 'Submitted' | 'Under Review' | 'Approved' | 'Rejected';
  dateSubmitted: string;
  type: 'Rental' | 'Offer';
};

export type Lease = {
  id: string;
  propertyId: string;
  propertyTitle: string;
  tenantName: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  status: 'Active' | 'Expired' | 'Terminated';
}

export type MaintenanceRequest = {
    id: string;
    propertyId: string;
    propertyTitle: string;
    tenantName: string;
    dateSubmitted: string;
    description: string;
    category: 'Plumbing' | 'Electrical' | 'Appliance' | 'HVAC' | 'Structural' | 'General';
    priority: 'Low' | 'Medium' | 'High' | 'Emergency';
    status: 'Pending' | 'In Progress' | 'Completed';
}