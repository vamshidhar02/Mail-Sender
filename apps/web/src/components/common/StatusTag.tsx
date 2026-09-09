import { Tag } from 'antd';
import { CampaignStatus, ContactStatus } from '@mailer/shared';

const CAMPAIGN_COLORS: Record<CampaignStatus, string> = {
  [CampaignStatus.Draft]: 'default',
  [CampaignStatus.Sending]: 'processing',
  [CampaignStatus.Sent]: 'success',
  [CampaignStatus.Failed]: 'error',
};

const CONTACT_COLORS: Record<ContactStatus, string> = {
  [ContactStatus.Subscribed]: 'success',
  [ContactStatus.Unsubscribed]: 'default',
};

export function CampaignStatusTag({ status }: { status: CampaignStatus }) {
  return <Tag color={CAMPAIGN_COLORS[status]}>{status}</Tag>;
}

export function ContactStatusTag({ status }: { status: ContactStatus }) {
  return <Tag color={CONTACT_COLORS[status]}>{status}</Tag>;
}
