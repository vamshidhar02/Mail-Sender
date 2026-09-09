export enum ContactStatus {
  Subscribed = 'SUBSCRIBED',
  Unsubscribed = 'UNSUBSCRIBED',
}

/** Only these contacts are eligible to receive a campaign. */
export const SENDABLE_CONTACT_STATUSES: ContactStatus[] = [ContactStatus.Subscribed];
