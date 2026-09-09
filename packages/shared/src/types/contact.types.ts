import type { ContactStatus } from '../enums/contact-status.enum';
import type { PaginationQuery } from './api.types';

export interface Contact {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  status: ContactStatus;
  /** Free-form merge data available to templates as {{attributes.key}}. */
  attributes: Record<string, string | number | boolean | null>;
  /** Lists this contact belongs to. */
  listIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ContactList {
  id: string;
  name: string;
  description?: string | null;
  /** Number of contacts on the list. */
  contactCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContactRequest {
  email: string;
  firstName?: string;
  lastName?: string;
  attributes?: Record<string, string | number | boolean | null>;
  listIds?: string[];
}

export type UpdateContactRequest = Partial<CreateContactRequest> & {
  status?: ContactStatus;
};

export interface ContactQuery extends PaginationQuery {
  status?: ContactStatus;
  listId?: string;
}
