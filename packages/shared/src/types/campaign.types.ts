import type { CampaignStatus } from '../enums/campaign-status.enum';
import type { MessageStatus } from '../enums/message-status.enum';
import type { PaginationQuery } from './api.types';

export interface Campaign {
  id: string;
  name: string;
  templateId: string;
  listIds: string[];
  /** Name of the linked template, for list views. */
  templateName?: string;
  status: CampaignStatus;
  fromName: string;
  fromEmail: string;
  replyTo?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCampaignRequest {
  name: string;
  templateId: string;
  listIds: string[];
  fromName: string;
  fromEmail: string;
  replyTo?: string;
}

export type UpdateCampaignRequest = Partial<CreateCampaignRequest>;

export interface CampaignQuery extends PaginationQuery {
  status?: CampaignStatus;
}

/** One outbound message - the unit a send actually processes. */
export interface CampaignMessage {
  id: string;
  campaignId: string;
  contactId: string;
  email: string;
  status: MessageStatus;
  error?: string | null;
  sentAt?: string | null;
}

/** Counted from the message rows, not stored. */
export interface CampaignStats {
  recipients: number;
  sent: number;
  failed: number;
  pending: number;
}

export interface SendCampaignResult {
  campaignId: string;
  recipients: number;
  sent: number;
  failed: number;
}

export interface SendTestRequest {
  /** Recipients for the test blast; capped server-side. */
  emails: string[];
}
