export interface Tag {
  id: string;
  name: string;
  category: 'industry' | 'type'; // Industry or Work Type
}

export interface Project {
  id: string;
  title: string;
  description: string;
  client: string;
  date: string; // Format: YYYY-MM
  tags: string[]; // Array of Tag IDs
  imageUrl: string;
  gallery: string[];
  featured?: boolean;
}

export interface User {
  id: string;
  email: string;
}

export type Theme = 'light' | 'dark';