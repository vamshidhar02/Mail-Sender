import type { PaginationQuery } from './api.types';

export interface Template {
  id: string;
  name: string;
  subject: string;
  /** Handlebars-style body with {{mergeTags}}. */
  html: string;
  text?: string | null;
  /** Merge tags detected in subject + body, for the campaign editor. */
  variables: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateRequest {
  name: string;
  subject: string;
  html: string;
  text?: string;
}

export type UpdateTemplateRequest = Partial<CreateTemplateRequest>;

export type TemplateQuery = PaginationQuery;

export interface RenderPreviewRequest {
  /** Sample merge data; falls back to placeholder values when omitted. */
  sample?: Record<string, unknown>;
}

export interface RenderPreviewResponse {
  subject: string;
  html: string;
  text: string;
  missingVariables: string[];
}
