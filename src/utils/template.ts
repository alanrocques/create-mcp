import Handlebars from 'handlebars';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Templates are shipped in src/templates/ relative to the package root
const TEMPLATES_DIR = path.resolve(__dirname, '..', '..', 'src', 'templates');

Handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);
Handlebars.registerHelper('neq', (a: unknown, b: unknown) => a !== b);
Handlebars.registerHelper('includes', (arr: unknown[], value: unknown) => {
  return Array.isArray(arr) && arr.includes(value);
});

export function renderTemplate(templateRelPath: string, context: Record<string, unknown>): string {
  const templatePath = path.join(TEMPLATES_DIR, templateRelPath);
  const source = fs.readFileSync(templatePath, 'utf-8');
  const template = Handlebars.compile(source, { noEscape: true });
  return template(context);
}

export function getTemplatesDir(): string {
  return TEMPLATES_DIR;
}
