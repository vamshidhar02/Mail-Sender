import type {
  Contact as SharedContact,
  ContactList as SharedContactList,
  ContactStatus,
} from '@mailer/shared';

type ContactRow = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  status: string;
  attributes: unknown;
  createdAt: Date;
  updatedAt: Date;
  memberships?: Array<{ listId: string }>;
};

type ContactListRow = {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: { memberships: number };
};

/** Flattens the membership join rows into a plain list of ids. */
export function toContact(row: ContactRow): SharedContact {
  return {
    id: row.id,
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
    status: row.status as ContactStatus,
    attributes: (row.attributes ?? {}) as SharedContact['attributes'],
    listIds: (row.memberships ?? []).map((entry) => entry.listId),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toContactList(row: ContactListRow): SharedContactList {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    contactCount: row._count?.memberships ?? 0,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
