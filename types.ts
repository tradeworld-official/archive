export interface Tag {
  id: string;
  name: string;
  category: 'industry' | 'type' | 'exhibition_region';
}

export interface Project {
  id: string;
  title: string;
  description: string;
  client: string;
  date: string;
  tags: string[];
  imageUrl: string;
  gallery: string[];
  featured?: boolean;
  videoUrl?: string;
  websiteUrl?: string;
  thumbnailUrl?: string;
  created_at?: string;
}

export interface ExhibitionCustomField {
  label: string;
  value: string;
}

export interface Exhibition {
  id: string;
  name: string;
  nameEn?: string;
  description?: string;
  logoUrl?: string;
  imageUrl: string;
  gallery: string[];
  startDate?: string;
  endDate?: string;
  venueCountry?: string;
  venueCity?: string;
  venueName?: string;
  tags: string[];
  customFields: ExhibitionCustomField[];
  isActive: boolean;
  isPublic: boolean;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  email: string;
}

export type Theme = 'light' | 'dark';
