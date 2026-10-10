import {
  User,
  Property,
  PropertyVerification,
  InspectionRequest,
  PropertyEnquiry,
  Application,
  ListingReport,
  AuditLog
} from '@/types/prophunta';

// Default seed accounts for testing every role:
// Password for all seed users is "Password123!"
export const SEED_USERS: User[] = [
  {
    id: 'user_seeker_1',
    name: 'Chidi Okonkwo',
    email: 'seeker@prophunta.ai',
    phone: '+234 803 123 4567',
    role: 'SEEKER',
    profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    location: 'Lekki Phase 1, Lagos',
    verificationStatus: 'VERIFIED',
    kycStatus: 'VERIFIED',
    kycDocumentType: 'PASSPORT',
    kycDocumentNumber: 'A08924192',
    kycSubmittedAt: '2026-09-01T10:00:00Z',
    kycReviewedAt: '2026-09-01T12:00:00Z',
    kycReviewedBy: 'user_admin_1',
    isDemo: true,
    createdAt: '2026-09-01T10:00:00Z',
    updatedAt: '2026-10-01T10:00:00Z',
    bio: 'Tech entrepreneur searching for high-security residences and investment properties in Lagos and Abuja.'
  },
  {
    id: 'user_seeker_unverified',
    name: 'Ngozi Eze (Unverified Seeker)',
    email: 'unverified@prophunta.ai',
    phone: '+234 802 333 4455',
    role: 'SEEKER',
    location: 'Yaba, Lagos',
    verificationStatus: 'UNVERIFIED',
    kycStatus: 'NOT_SUBMITTED',
    isDemo: true,
    createdAt: '2026-10-09T10:00:00Z',
    updatedAt: '2026-10-09T10:00:00Z',
    bio: 'Newly registered tenant exploring listings prior to identity verification.'
  },
  {
    id: 'user_owner_1',
    name: 'Alhaji Ibrahim Danjuma',
    email: 'owner@prophunta.ai',
    phone: '+234 802 987 6543',
    role: 'OWNER',
    profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    location: 'Ikoyi, Lagos',
    verificationStatus: 'VERIFIED',
    kycStatus: 'VERIFIED',
    kycDocumentType: 'NIN',
    kycDocumentNumber: '19283746501',
    kycSubmittedAt: '2026-08-15T09:30:00Z',
    kycReviewedAt: '2026-08-15T11:00:00Z',
    kycReviewedBy: 'user_admin_1',
    isDemo: true,
    createdAt: '2026-08-15T09:30:00Z',
    updatedAt: '2026-10-02T11:00:00Z',
    bio: 'Property owner with verified titles across Ikoyi, Lekki Phase 1, and Victoria Island.'
  },
  {
    id: 'user_agent_1',
    name: 'Tunde Adeleke',
    email: 'agent@prophunta.ai',
    phone: '+234 805 456 7890',
    role: 'AGENT',
    profilePhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
    location: 'Victoria Island, Lagos',
    verificationStatus: 'VERIFIED',
    kycStatus: 'VERIFIED',
    kycDocumentType: 'PASSPORT',
    kycDocumentNumber: 'B01928471',
    agentVerificationLevel: 'LEVEL_3_LICENSED_PRACTITIONER',
    agencyName: 'Adeleke & Partners Realty',
    licenseNumber: 'LASRERA-2024-0891',
    isDemo: true,
    createdAt: '2026-08-10T08:00:00Z',
    updatedAt: '2026-10-03T14:30:00Z',
    bio: 'Licensed LASRERA property practitioner specializing in verified residential and commercial acquisitions.'
  },
  {
    id: 'user_admin_1',
    name: 'Amina Bello (Verification Officer)',
    email: 'admin@prophunta.ai',
    phone: '+234 809 111 2233',
    role: 'ADMIN',
    profilePhoto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
    location: 'PropHunta Headquarters, Lagos',
    verificationStatus: 'VERIFIED',
    kycStatus: 'VERIFIED',
    isDemo: true,
    createdAt: '2026-07-01T08:00:00Z',
    updatedAt: '2026-10-05T09:00:00Z',
    bio: 'Lead Property Verification Officer & Platform Trust Administrator.'
  }
];

export const SEED_PROPERTIES: Property[] = [
  {
    id: 'prop-1',
    ownerId: 'user_owner_1',
    authorizedAgentId: 'user_agent_1',
    title: '5 Bedroom Waterfront Detached Villa with Private Jetty',
    propertyType: 'House',
    listingType: 'SALE',
    description: 'Direct lagoon-facing architectural masterpiece in Admiralty Way, Lekki Phase 1. Features automated smart home infrastructure, private boat jetty, infinity pool, 24/7 dedicated industrial power generation, and verified Governor\'s Consent.',
    state: 'Lagos',
    city: 'Lagos',
    area: 'Lekki Phase 1',
    address: 'Admiralty Way, Lekki Phase 1, Lagos',
    latitude: 6.4474,
    longitude: 3.4735,
    price: 850000000,
    priceUnit: 'total',
    agreementFee: 42500000,
    cautionFee: 0,
    serviceCharge: 3500000,
    otherCharges: 8500000,
    bedrooms: 5,
    bathrooms: 6,
    sqft: 750,
    features: [
      'Private Boat Jetty',
      'Infinity Pool',
      '24/7 Manned Security',
      'Smart Automation',
      'Cinema Room',
      'Industrial Solar Hybrid',
      'CCTV Perimeter'
    ],
    availabilityStatus: 'AVAILABLE',
    intendedUse: 'Residential',
    listingStatus: 'VERIFIED',
    viewsCount: 1420,
    isFeatured: true,
    floodRisk: 'Low',
    createdAt: '2026-09-10T12:00:00Z',
    updatedAt: '2026-10-04T16:00:00Z',
    publishedAt: '2026-09-15T09:00:00Z',
    media: [
      {
        id: 'med-1-1',
        propertyId: 'prop-1',
        url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80',
        type: 'image',
        caption: 'Lagoon facade and pool terrace',
        isPrimary: true,
        order: 1
      },
      {
        id: 'med-1-2',
        propertyId: 'prop-1',
        url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
        type: 'image',
        caption: 'Double volume reception salon',
        isPrimary: false,
        order: 2
      },
      {
        id: 'med-1-3',
        propertyId: 'prop-1',
        url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
        type: 'image',
        caption: 'Master penthouse suite',
        isPrimary: false,
        order: 3
      }
    ],
    documents: [
      {
        id: 'doc-1-1',
        propertyId: 'prop-1',
        uploadedBy: 'user_owner_1',
        documentType: 'GOVERNORS_CONSENT',
        fileName: 'Gov_Consent_Lekki_Block14_Plot8.pdf',
        fileReference: '/secure-vault/docs/doc-1-1.pdf',
        status: 'APPROVED',
        uploadedAt: '2026-09-11T10:00:00Z',
        reviewedAt: '2026-09-14T14:00:00Z',
        reviewedBy: 'user_admin_1',
        reviewNotes: 'Governor\'s Consent registered in Lagos Land Registry (Volume 2412, Page 45). Authenticated.'
      },
      {
        id: 'doc-1-2',
        propertyId: 'prop-1',
        uploadedBy: 'user_owner_1',
        documentType: 'SURVEY_PLAN',
        fileName: 'Survey_Plan_LagoonFront_Lekki.pdf',
        fileReference: '/secure-vault/docs/doc-1-2.pdf',
        status: 'APPROVED',
        uploadedAt: '2026-09-11T10:05:00Z',
        reviewedAt: '2026-09-14T14:15:00Z',
        reviewedBy: 'user_admin_1',
        reviewNotes: 'Cadastral coordinates checked against Surveyor General database. No encroachment.'
      }
    ],
    verification: {
      verificationId: 'ver-1',
      propertyId: 'prop-1',
      reviewerId: 'user_admin_1',
      ownerIdentityStatus: 'PASSED',
      locationStatus: 'PASSED',
      authorityDocumentStatus: 'PASSED',
      availabilityStatus: 'PASSED',
      mediaStatus: 'PASSED',
      inspectionStatus: 'PASSED',
      overallStatus: 'PASSED',
      reviewNotes: 'Full audit passed. Title documentation reviewed at Alausa registry. Physical site inspected.',
      reviewedAt: '2026-09-15T08:30:00Z',
      lastVerifiedAt: '2026-09-15T08:30:00Z'
    }
  },
  {
    id: 'prop-2',
    ownerId: 'user_owner_1',
    authorizedAgentId: 'user_agent_1',
    title: 'Luxury 3 Bedroom Serviced Apartment in Ikoyi',
    propertyType: 'Apartment',
    listingType: 'RENT',
    description: 'High-end fully serviced flat on Bourdillon Road, Ikoyi. Features fitted Italian kitchen, 24-hour uninterrupted power, Olympic swimming pool, squash court, round-the-clock armed concierge, and serene landscaped grounds.',
    state: 'Lagos',
    city: 'Lagos',
    area: 'Ikoyi',
    address: 'Bourdillon Road, Ikoyi, Lagos',
    latitude: 6.4525,
    longitude: 3.4416,
    price: 35000000,
    priceUnit: '/year',
    agreementFee: 3500000,
    cautionFee: 3500000,
    serviceCharge: 6000000,
    otherCharges: 1000000,
    bedrooms: 3,
    bathrooms: 4,
    sqft: 280,
    features: [
      '24/7 Guaranteed Power',
      'Olympic Swimming Pool',
      'Squash Court',
      'Fitted Italian Kitchen',
      'Elevator',
      'Armed Concierge'
    ],
    availabilityStatus: 'AVAILABLE',
    intendedUse: 'Residential',
    listingStatus: 'VERIFIED',
    viewsCount: 890,
    isFeatured: true,
    floodRisk: 'None',
    createdAt: '2026-09-18T10:00:00Z',
    updatedAt: '2026-10-06T11:00:00Z',
    publishedAt: '2026-09-20T10:00:00Z',
    media: [
      {
        id: 'med-2-1',
        propertyId: 'prop-2',
        url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
        type: 'image',
        caption: 'Modern luxury living room',
        isPrimary: true,
        order: 1
      },
      {
        id: 'med-2-2',
        propertyId: 'prop-2',
        url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
        type: 'image',
        caption: 'Serviced complex exterior',
        isPrimary: false,
        order: 2
      }
    ],
    documents: [
      {
        id: 'doc-2-1',
        propertyId: 'prop-2',
        uploadedBy: 'user_agent_1',
        documentType: 'LETTER_OF_AUTHORITY',
        fileName: 'Management_Authority_Ikoyi_Flat4B.pdf',
        fileReference: '/secure-vault/docs/doc-2-1.pdf',
        status: 'APPROVED',
        uploadedAt: '2026-09-18T12:00:00Z',
        reviewedAt: '2026-09-19T15:00:00Z',
        reviewedBy: 'user_admin_1',
        reviewNotes: 'Authority letter confirmed directly with facility management company.'
      }
    ],
    verification: {
      verificationId: 'ver-2',
      propertyId: 'prop-2',
      reviewerId: 'user_admin_1',
      ownerIdentityStatus: 'PASSED',
      locationStatus: 'PASSED',
      authorityDocumentStatus: 'PASSED',
      availabilityStatus: 'PASSED',
      mediaStatus: 'PASSED',
      inspectionStatus: 'PASSED',
      overallStatus: 'PASSED',
      reviewNotes: 'Management mandate verified. Current vacancy confirmed with facility manager.',
      reviewedAt: '2026-09-20T09:00:00Z',
      lastVerifiedAt: '2026-09-20T09:00:00Z'
    }
  },
  {
    id: 'prop-3',
    ownerId: 'user_owner_1',
    authorizedAgentId: 'user_agent_1',
    title: 'Contemporary 4 Bedroom Semi-Detached Duplex with BQ',
    propertyType: 'House',
    listingType: 'SALE',
    description: 'Newly constructed contemporary duplex in a gated, secure residential enclave in Gwarinpa, Abuja. High ceilings, marble tiling, solar inverter backup, and CCTV perimeter monitoring.',
    state: 'Abuja (FCT)',
    city: 'Abuja',
    area: 'Gwarinpa',
    address: '3rd Avenue, Gwarinpa Estate, Abuja',
    latitude: 9.1108,
    longitude: 7.4165,
    price: 320000000,
    priceUnit: 'total',
    agreementFee: 16000000,
    cautionFee: 0,
    serviceCharge: 1200000,
    otherCharges: 3200000,
    bedrooms: 4,
    bathrooms: 5,
    sqft: 420,
    features: [
      'Gated Community',
      'Boys Quarters (BQ)',
      'Solar Inverter Backup',
      'Pre-installed CCTV',
      'Spacious Compound',
      'Borehole & Water Treatment'
    ],
    availabilityStatus: 'AVAILABLE',
    intendedUse: 'Residential',
    listingStatus: 'VERIFIED',
    viewsCount: 650,
    isFeatured: true,
    floodRisk: 'None',
    createdAt: '2026-09-22T08:00:00Z',
    updatedAt: '2026-10-01T12:00:00Z',
    publishedAt: '2026-09-25T14:00:00Z',
    media: [
      {
        id: 'med-3-1',
        propertyId: 'prop-3',
        url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
        type: 'image',
        caption: 'Duplex exterior and driveway',
        isPrimary: true,
        order: 1
      }
    ],
    verification: {
      verificationId: 'ver-3',
      propertyId: 'prop-3',
      reviewerId: 'user_admin_1',
      ownerIdentityStatus: 'PASSED',
      locationStatus: 'PASSED',
      authorityDocumentStatus: 'PASSED',
      availabilityStatus: 'PASSED',
      mediaStatus: 'PASSED',
      inspectionStatus: 'PASSED',
      overallStatus: 'PASSED',
      reviewNotes: 'FCDA Right of Occupancy verified. No conflicting allocation.',
      reviewedAt: '2026-09-25T11:00:00Z',
      lastVerifiedAt: '2026-09-25T11:00:00Z'
    }
  },
  {
    id: 'prop-4',
    ownerId: 'user_owner_1',
    authorizedAgentId: 'user_agent_1',
    title: 'Brand New 4 Bedroom Terrace with Swimming Pool',
    propertyType: 'House',
    listingType: 'RENT',
    description: 'Executive terrace house situated in a serene, quiet cul-de-sac in Ikeja GRA. Features central standby power plant, swimming pool, club house, and dedicated security guards.',
    state: 'Lagos',
    city: 'Lagos',
    area: 'Ikeja GRA',
    address: 'Isaac John Street, Ikeja GRA, Lagos',
    latitude: 6.5898,
    longitude: 3.3587,
    price: 22000000,
    priceUnit: '/year',
    agreementFee: 2200000,
    cautionFee: 2200000,
    serviceCharge: 4000000,
    otherCharges: 500000,
    bedrooms: 4,
    bathrooms: 4,
    sqft: 350,
    features: [
      'Central Generator',
      'Shared Swimming Pool',
      'Clubhouse',
      'Children Play Area',
      'Quiet Cul-de-sac'
    ],
    availabilityStatus: 'AVAILABLE',
    intendedUse: 'Residential',
    listingStatus: 'UNDER_REVIEW',
    viewsCount: 410,
    isFeatured: false,
    floodRisk: 'Low',
    createdAt: '2026-10-04T11:00:00Z',
    updatedAt: '2026-10-07T09:00:00Z',
    media: [
      {
        id: 'med-4-1',
        propertyId: 'prop-4',
        url: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80',
        type: 'image',
        caption: 'Terrace facade',
        isPrimary: true,
        order: 1
      }
    ],
    verification: {
      verificationId: 'ver-4',
      propertyId: 'prop-4',
      reviewerId: 'user_admin_1',
      ownerIdentityStatus: 'PASSED',
      locationStatus: 'PASSED',
      authorityDocumentStatus: 'IN_REVIEW',
      availabilityStatus: 'PENDING',
      mediaStatus: 'PASSED',
      inspectionStatus: 'PENDING',
      overallStatus: 'IN_REVIEW',
      reviewNotes: 'Authority letter under verification with Ikeja Estate facility management.',
      reviewedAt: '2026-10-06T15:00:00Z',
      lastVerifiedAt: '2026-10-06T15:00:00Z'
    }
  }
];

export const SEED_INSPECTIONS: InspectionRequest[] = [
  {
    id: 'insp-1',
    propertyId: 'prop-1',
    propertyTitle: '5 Bedroom Waterfront Detached Villa with Private Jetty',
    propertyAddress: 'Admiralty Way, Lekki Phase 1, Lagos',
    seekerId: 'user_seeker_1',
    seekerName: 'Chidi Okonkwo',
    seekerEmail: 'seeker@prophunta.ai',
    seekerPhone: '+234 803 123 4567',
    hostId: 'user_agent_1',
    preferredDate: '2026-10-12',
    preferredTimeSlot: '11:00 AM - 01:00 PM',
    type: 'IN_PERSON',
    status: 'SCHEDULED',
    notes: 'Please ensure boat jetty and generator room are unlocked for inspection.',
    createdAt: '2026-10-05T09:00:00Z',
    updatedAt: '2026-10-06T10:00:00Z'
  },
  {
    id: 'insp-2',
    propertyId: 'prop-2',
    propertyTitle: 'Luxury 3 Bedroom Serviced Apartment in Ikoyi',
    propertyAddress: 'Bourdillon Road, Ikoyi, Lagos',
    seekerId: 'user_seeker_1',
    seekerName: 'Chidi Okonkwo',
    seekerEmail: 'seeker@prophunta.ai',
    seekerPhone: '+234 803 123 4567',
    hostId: 'user_owner_1',
    preferredDate: '2026-10-15',
    preferredTimeSlot: '02:00 PM - 04:00 PM',
    type: 'VIDEO',
    status: 'REQUESTED',
    notes: 'Video walkthrough requested ahead of physical trip to Lagos.',
    createdAt: '2026-10-07T14:30:00Z',
    updatedAt: '2026-10-07T14:30:00Z'
  }
];

export const SEED_ENQUIRIES: PropertyEnquiry[] = [
  {
    id: 'enq-1',
    propertyId: 'prop-1',
    propertyTitle: '5 Bedroom Waterfront Detached Villa with Private Jetty',
    propertyImage: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=400&q=80',
    seekerId: 'user_seeker_1',
    seekerName: 'Chidi Okonkwo',
    hostId: 'user_agent_1',
    hostName: 'Tunde Adeleke (Agent)',
    ownerId: 'user_owner_1',
    authorizedAgentId: 'user_agent_1',
    lastMessageText: 'The legal team has the Governor\'s Consent file ready for inspection.',
    lastMessageAt: '2026-10-07T11:45:00Z',
    unreadCountForSeeker: 1,
    unreadCountForHost: 0,
    messages: [
      {
        id: 'msg-1',
        senderId: 'user_seeker_1',
        senderName: 'Chidi Okonkwo',
        senderRole: 'SEEKER',
        text: 'Good day Tunde, I noticed this listing has verified Governor\'s Consent. Can we inspect the physical cadastral plan during our site visit?',
        timestamp: '2026-10-07T10:15:00Z',
        read: true
      },
      {
        id: 'msg-2',
        senderId: 'user_agent_1',
        senderName: 'Tunde Adeleke',
        senderRole: 'AGENT',
        text: 'Hello Chidi, absolutely. The legal team has the certified true copy and Governor\'s Consent file ready for your surveyor\'s inspection.',
        timestamp: '2026-10-07T11:45:00Z',
        read: false
      }
    ]
  }
];

export const SEED_APPLICATIONS: Application[] = [
  {
    id: 'app-1',
    propertyId: 'prop-2',
    propertyTitle: 'Luxury 3 Bedroom Serviced Apartment in Ikoyi',
    propertyPrice: 35000000,
    propertyImage: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80',
    seekerId: 'user_seeker_1',
    applicantName: 'Chidi Okonkwo',
    applicantEmail: 'seeker@prophunta.ai',
    applicantPhone: '+234 803 123 4567',
    type: 'RENTAL',
    occupation: 'Managing Director, Horizon FinTech',
    moveInDate: '2026-11-01',
    occupants: 3,
    message: 'Expression of interest for 2-year lease. Professional family looking for a verified, secure home in Ikoyi.',
    status: 'SUBMITTED',
    createdAt: '2026-10-06T15:00:00Z',
    updatedAt: '2026-10-06T15:00:00Z'
  }
];

export const SEED_REPORTS: ListingReport[] = [
  {
    id: 'rep-1',
    propertyId: 'prop-4',
    propertyTitle: 'Brand New 4 Bedroom Terrace with Swimming Pool',
    reporterId: 'user_seeker_1',
    reporterName: 'Chidi Okonkwo',
    reason: 'Incorrect Information',
    description: 'The property description states 4 bedrooms, but the floor plan and video show 3 bedrooms plus study.',
    status: 'UNDER_INVESTIGATION',
    reportedAt: '2026-10-06T18:00:00Z'
  }
];

export const SEED_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-1',
    actor: { id: 'user_admin_1', email: 'admin@prophunta.ai', role: 'ADMIN' },
    actorId: 'user_admin_1',
    actorEmail: 'admin@prophunta.ai',
    actorRole: 'ADMIN',
    action: 'VERIFICATION_APPROVED',
    objectType: 'PROPERTY',
    objectId: 'prop-1',
    timestamp: '2026-09-15T08:30:00Z',
    result: 'SUCCESS',
    metadata: { notes: 'Passed Lagos Land Registry verification and physical inspection' }
  },
  {
    id: 'aud-2',
    actor: { id: 'user_owner_1', email: 'owner@prophunta.ai', role: 'OWNER' },
    actorId: 'user_owner_1',
    actorEmail: 'owner@prophunta.ai',
    actorRole: 'OWNER',
    action: 'PROPERTY_SUBMITTED',
    objectType: 'PROPERTY',
    objectId: 'prop-2',
    timestamp: '2026-09-18T10:00:00Z',
    result: 'SUCCESS'
  },
  {
    id: 'aud-3',
    actor: { id: 'user_seeker_1', email: 'seeker@prophunta.ai', role: 'SEEKER' },
    actorId: 'user_seeker_1',
    actorEmail: 'seeker@prophunta.ai',
    actorRole: 'SEEKER',
    action: 'INSPECTION_REQUESTED',
    objectType: 'INSPECTION',
    objectId: 'insp-1',
    timestamp: '2026-10-05T09:00:00Z',
    result: 'SUCCESS'
  }
];
