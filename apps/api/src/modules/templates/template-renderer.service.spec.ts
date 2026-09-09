import { TemplateRendererService } from './template-renderer.service';

describe('TemplateRendererService', () => {
  const renderer = new TemplateRendererService();

  it('extracts merge tags from the subject and body', () => {
    const variables = renderer.extractVariables(
      'Hi {{firstName}}',
      '<p>{{firstName}} on the {{ attributes.plan }} plan</p>',
    );

    expect(variables).toEqual(['firstName', 'attributes.plan']);
  });

  it('substitutes contact values into subject and html', () => {
    const result = renderer.render(
      { subject: 'Hi {{firstName}}', html: '<p>Plan: {{attributes.plan}}</p>' },
      {
        email: 'a@example.com',
        firstName: 'Alex',
        attributes: { plan: 'pro' },
      },
    );

    expect(result.subject).toBe('Hi Alex');
    expect(result.html).toBe('<p>Plan: pro</p>');
    expect(result.missingVariables).toEqual([]);
  });

  it('reports tags with no matching data instead of failing the send', () => {
    const result = renderer.render(
      { subject: 'Hi {{firstName}}', html: '<p>{{attributes.company}}</p>' },
      { email: 'a@example.com', firstName: 'Alex' },
    );

    expect(result.missingVariables).toEqual(['attributes.company']);
  });

  it('derives a plain-text part from the html when none is stored', () => {
    const result = renderer.render(
      { subject: 'Hello', html: '<h1>Title</h1><p>Line one</p><p>Line two</p>' },
      { email: 'a@example.com' },
    );

    expect(result.text).toBe('TitleLine one\n\nLine two');
  });
});
