export type TwibbonCampaignState = 'draft' | 'published' | 'archived';
export type TwibbonAssetKind = 'frame' | 'thumbnail';
export type TwibbonAssetVisibility = 'private_draft' | 'public';
export type TwibbonRotation = 0 | 90 | 180 | 270;

export interface TwibbonTransformState {
  /** Offset horizontal pusat foto di ruang logis 1080x1080 */
  tx: number;
  /** Offset vertikal pusat foto di ruang logis 1080x1080 */
  ty: number;
  /** Faktor zoom relatif terhadap skala cover minimum (1..4) */
  zoom: number;
  /** Rotasi searah jarum jam dalam kelipatan 90 derajat */
  rotation: TwibbonRotation;
}

export interface TwibbonDraftPayload {
  title: string;
  description: string;
  frame_asset_id: string | null;
  thumbnail_asset_id: string | null;
  caption_default: string;
  caption_template: string;
}

export interface TwibbonAssetRecord {
  id: string;
  campaign_id: string;
  kind: TwibbonAssetKind;
  visibility: TwibbonAssetVisibility;
  bucket_id: string;
  storage_path: string;
  public_url: string | null;
  mime_type: string;
  byte_size: number;
  width: number;
  height: number;
  checksum: string | null;
  transparent_ratio: number | null;
  opaque_ratio: number | null;
  has_transparency_warning: boolean;
  validation_status: 'valid' | 'invalid';
  created_by: string | null;
  created_at: string;
}

export interface TwibbonRevisionRecord {
  id: string;
  campaign_id: string;
  revision_number: number;
  title: string;
  description: string | null;
  frame_asset_id: string;
  frame_public_url: string;
  thumbnail_asset_id: string | null;
  thumbnail_public_url: string | null;
  output_width: number;
  output_height: number;
  caption_default: string;
  caption_template: string;
  event_display_snapshot: {
    event_id?: string | null;
    title?: string | null;
    slug?: string | null;
    starts_at?: string | null;
    ends_at?: string | null;
    location?: string | null;
  } | null;
  published_by: string | null;
  published_at: string;
}

export interface TwibbonCampaignAdminRecord {
  id: string;
  slug: string;
  slug_locked: boolean;
  event_id: string | null;
  state: TwibbonCampaignState;
  published_revision_id: string | null;
  draft_payload: TwibbonDraftPayload;
  edit_version: number;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  archived_at: string | null;
}

export interface TwibbonAuditLogRecord {
  id: string;
  campaign_id: string;
  actor_id: string | null;
  action: string;
  revision_id: string | null;
  summary: string;
  changes: Record<string, unknown> | null;
  created_at: string;
}

export interface TwibbonPublicCampaignCard {
  id: string;
  slug: string;
  state: 'published' | 'archived';
  revision_id: string;
  revision_number: number;
  title: string;
  description: string | null;
  frame_url: string;
  thumbnail_url: string | null;
  published_at: string;
  archived_at: string | null;
  event: {
    id: string;
    title: string;
    slug: string;
    starts_at: string | null;
    ends_at: string | null;
    location: string | null;
    url: string;
  } | null;
  is_demo_fallback?: boolean;
}

export interface TwibbonPublicCampaignDetail {
  id: string;
  slug: string;
  state: 'published' | 'archived';
  can_generate: boolean;
  revision_id: string;
  revision_number: number;
  title: string;
  description: string | null;
  frame: {
    url: string;
    width: 1080;
    height: 1080;
  };
  thumbnail_url: string | null;
  caption_default: string;
  caption_template: string;
  published_at: string;
  archived_at: string | null;
  event: {
    id: string;
    title: string;
    slug: string;
    date: string | null;
    starts_at: string | null;
    ends_at: string | null;
    location: string | null;
    timezone: 'Asia/Jakarta';
    url: string;
    registration_status?: string | null;
  } | null;
  is_demo_fallback?: boolean;
}

export interface TwibbonErrorEnvelope {
  error: {
    code:
      | 'CAMPAIGN_NOT_FOUND'
      | 'AUTH_REQUIRED'
      | 'FORBIDDEN'
      | 'VERSION_CONFLICT'
      | 'PAYLOAD_TOO_LARGE'
      | 'VALIDATION_FAILED'
      | 'FRAME_INVALID'
      | 'RATE_LIMITED'
      | 'ASSET_UNAVAILABLE'
      | 'INTERNAL_ERROR';
    message: string;
    request_id: string;
    details?: Record<string, unknown>;
  };
}


// Type aliases used by App Router pages and admin components
export type TwibbonCampaignRow = TwibbonCampaignAdminRecord & {
  has_unpublished_changes?: boolean;
  draft_payload: TwibbonDraftPayload & {
    related_event_id?: string | null;
  };
};
export type TwibbonRevisionRow = TwibbonRevisionRecord;
export type TwibbonAuditLogRow = TwibbonAuditLogRecord;
export type TwibbonAssetRow = TwibbonAssetRecord;
export type PublicTwibbonCampaignSummary = TwibbonPublicCampaignCard;
export type PublicTwibbonCampaignDetail = TwibbonPublicCampaignDetail;

