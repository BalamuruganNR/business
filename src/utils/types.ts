export interface AnimalPost {
    id: string;
    imageUrl: string;
    description: string;
    username: string;
    userAvatar?: string;
    userBadge?: string;
    likes: number;
    comments: number;
    timestamp: string;
    species: string;
    location?: {
      lat: number;
      lng: number;
      address?: string;
    };
    adoptable?: boolean;
    trending?: boolean;
    views?: number;
  }
  
  export interface User {
    id?: string;
    uid: string;
    username: string;
    email: string;
    phoneNumber?: string;
    profilePic?: string;
    bio?: string;
    badges?: string[];
    followers?: number;
    following?: number;
    joinDate?: any;
    donationsMade?: number;
    adoptions?: number;
    isCollaborator?: boolean;
    verified?: boolean;
    authProvider?: string;
    lastLogin?: any;
    scheduledForDeletion?: boolean;
    deletionDate?: any;
    isAdmin?: boolean;
    updatedAt?: any;
    posts?: number;
  }
  
  export interface Notification {
    id: string;
    type: 'like' | 'comment' | 'friendRequest' | 'adoption' | 'donation';
    fromUser: {
      id: string;
      username: string;
      profilePic: string;
    };
    postId?: string;
    message: string;
    timestamp: string;
    read: boolean;
  }
  
  export interface Comment {
    id: string;
    postId: string;
    userId: string;
    username: string;
    userAvatar?: string;
    text: string;
    timestamp: string;
    likes: number;
  }
  
  export interface ExtinctAnimal {
    id: number;
    name: string;
    scientificName: string;
    period: string;
    location: string;
    cause: string;
    imageUrl: string;
    description: string;
  }
  
  export interface Donation {
    id: string;
    userId: string;
    amount?: number;
    items?: string[];
    shelterName: string;
    timestamp: string;
    message?: string;
    anonymous: boolean;
  }
  
  export interface Shelter {
    id: string;
    name: string;
    location: {
      lat: number;
      lng: number;
      address: string;
    };
    animals: number;
    needsHelp: boolean;
    contactInfo: {
      phone?: string;
      email?: string;
      website?: string;
    };
  }
  