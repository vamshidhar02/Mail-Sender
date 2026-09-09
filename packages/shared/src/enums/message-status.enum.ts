/** Lifecycle of a single outbound message (one row per recipient). */
export enum MessageStatus {
  Pending = 'PENDING',
  Sent = 'SENT',
  Failed = 'FAILED',
}
