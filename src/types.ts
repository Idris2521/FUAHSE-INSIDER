export type AdminRole = 'SUPER_ADMIN' | 'USER_ADMIN' | 'CONTENT_ADMIN';

export type AccountStatus = 'active' | 'deactivated' | 'suspended';

export type SubmissionStatus = 'pending' | 'reviewing' | 'approved' | 'rejected' | 'posted';

export type SubmissionType = 'text' | 'image' | 'video' | 'audio' | 'file';

export interface UserProfile {
  id: string;
  follower_id: string;
  name: string;
  age: number;
  state: string;
  whatsapp_number: string;
  account_status: AccountStatus;
  created_at: string;
  updated_at: string;
  submission_count?: number;
}

export interface AdminAccount {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  status: 'active' | 'disabled';
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
}

export interface SubmissionMedia {
  id: string;
  submission_id: string;
  file_url: string;
  file_name?: string;
  storage_path?: string;
  file_type: 'image' | 'video' | 'audio' | 'file';
  file_size?: number;
  mime_type?: string;
  created_at: string;
}

export interface Submission {
  id: string;
  user_id?: string;
  follower_id: string;
  category_id?: string;
  category_name: string;
  submission_type: SubmissionType;
  text_content?: string;
  status: SubmissionStatus;
  rejection_reason?: string;
  moderation_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  posted_by?: string;
  posted_at?: string;
  created_at: string;
  updated_at: string;
  media?: SubmissionMedia[];
  // Sensitive identity details - OMITTED for Content Admin backend responses
  user_profile?: {
    name?: string;
    whatsapp_number?: string;
    age?: number;
    state?: string;
  };
}

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_email: string;
  actor_role: string;
  action: string;
  target_type: string;
  target_id?: string;
  details?: Record<string, any>;
  created_at: string;
}

export interface SystemSettings {
  platform_name: string;
  subtitle: string;
  whatsapp_channel_url: string;
  allow_submissions: boolean;
  max_image_mb: number;
  max_video_mb: number;
  max_audio_mb: number;
}

export interface DashboardStats {
  totalUsers: number;
  newUsersToday: number;
  totalSubmissions: number;
  pendingSubmissions: number;
  reviewingSubmissions: number;
  approvedSubmissions: number;
  postedSubmissions: number;
  rejectedSubmissions: number;
}

export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Federal Capital Territory (FCT)',
  'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
  'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
] as const;

export const WHATSAPP_CHANNEL_URL = 'https://whatsapp.com/channel/0029Vazzxus65yDCGNFyav1R';
