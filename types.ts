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
  videoUrl?: string; // 비메오 링크 (선택 사항)
  websiteUrl?: string; // 실제 웹사이트/앱 링크 (선택 사항)
  thumbnailUrl?: string; // 메일 빌더용 자동 크롭 썸네일 (선택 사항)
  created_at?: string; // Supabase auto-generated timestamp (정렬용)
}

export interface User {
  id: string;
  email: string;
}

export type Theme = 'light' | 'dark';
