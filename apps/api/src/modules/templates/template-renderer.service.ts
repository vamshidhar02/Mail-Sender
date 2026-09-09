import { Injectable } from '@nestjs/common';
import Handlebars from 'handlebars';
import { TEMPLATE_VARIABLE_PATTERN } from '@mailer/shared';

export interface RenderContext {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  attributes?: Record<string, unknown>;
}

export interface RenderedMail {
  subject: string;
  html: string;
  text: string;
  missingVariables: string[];
}

@Injectable()
export class TemplateRendererService {
  /** Compiled templates are cached by content hash - campaigns reuse one body
   *  across every recipient, so compiling per message would dominate send cost. */
  private readonly cache = new Map<string, HandlebarsTemplateDelegate>();

  /** Merge tags referenced by a subject or body, deduplicated. */
  extractVariables(...sources: string[]): string[] {
    const found = new Set<string>();
    for (const source of sources) {
      const pattern = new RegExp(TEMPLATE_VARIABLE_PATTERN.source, 'g');
      let match = pattern.exec(source);
      while (match) {
        if (match[1]) found.add(match[1]);
        match = pattern.exec(source);
      }
    }
    return [...found];
  }

  render(
    template: { subject: string; html: string; text?: string | null },
    context: RenderContext,
  ): RenderedMail {
    const declared = this.extractVariables(template.subject, template.html);
    const missingVariables = declared.filter((name) => this.resolve(name, context) === undefined);

    return {
      subject: this.compile(template.subject)(context),
      html: this.compile(template.html)(context),
      text: template.text ? this.compile(template.text)(context) : this.toPlainText(template.html),
      missingVariables,
    };
  }

  private compile(source: string): HandlebarsTemplateDelegate {
    const cached = this.cache.get(source);
    if (cached) return cached;
    const compiled = Handlebars.compile(source, { noEscape: false });
    this.cache.set(source, compiled);
    return compiled;
  }

  private resolve(path: string, context: RenderContext): unknown {
    return path
      .split('.')
      .reduce<unknown>(
        (value, key) =>
          value && typeof value === 'object'
            ? (value as Record<string, unknown>)[key]
            : undefined,
        context as unknown,
      );
  }

  private toPlainText(html: string): string {
    return html
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}
