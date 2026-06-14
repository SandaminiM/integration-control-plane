import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTEXT_FILE = path.join(__dirname, '../../../.auth/context.json');

export function getAuthContext(): { orgHandler: string; projectHandler: string | null } {
  return JSON.parse(readFileSync(CONTEXT_FILE, 'utf8'));
}
