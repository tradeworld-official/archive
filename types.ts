export interface Tag {
  id: string;
  name: string;
  category: 'industry' | 'type';
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

export interface User {
  id: string;
  email: string;
}

export type Theme = 'light' | 'dark';
