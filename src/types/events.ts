export type PublishStatus = 'draft' | 'published' | 'archived';
export type RegistrationStatus = 'na' | 'soon' | 'open' | 'closed';
export type ResourceItemType = 'link' | 'text' | 'section_header';
export type ResourceLinkRole = 'general' | 'registration';

export interface PublicEvent {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  description: string | null;
  banner_url: string | null;
  starts_at: string | null;
  ends_at: string | null;
  location: string | null;
  publish_status: PublishStatus;
  registration_status: RegistrationStatus;
  is_featured: boolean;
  slug_locked: boolean;
  created_by?: string | null;
  updated_by?: string | null;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface PublicEventResource {
  id: string;
  event_id: string;
  item_type: ResourceItemType;
  title: string;
  description: string | null;
  url: string | null;
  link_role: ResourceLinkRole;
  content: string | null;
  copyable: boolean;
  is_required: boolean;
  is_visible: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}
