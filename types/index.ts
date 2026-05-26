export interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  cover_image?: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  category: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: 'admin' | 'editor' | 'viewer';
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
}
