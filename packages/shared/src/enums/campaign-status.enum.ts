export enum CampaignStatus {
  Draft = 'DRAFT',
  Sending = 'SENDING',
  Sent = 'SENT',
  Failed = 'FAILED',
}

/** Statuses a campaign can still be edited or deleted from. */
export const EDITABLE_CAMPAIGN_STATUSES: CampaignStatus[] = [CampaignStatus.Draft];
