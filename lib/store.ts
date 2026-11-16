import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const KEY = /^[a-zA-Z0-9][a-zA-Z0-9._\/:-]{0,255}$/;
const MAX_TEXT = 10_000;

/** Small JSON key/value file under data/, keyed by repository name. */
export function textStore(file: string) {
  const target = path.join(DATA_DIR, file);

  const read = (): Record<string, string> => {
    try {
      const parsed = JSON.parse(fs.readFileSync(target, 'utf8'));
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  };

  const write = (key: unknown, text: unknown): string | null => {
    if (typeof key !== 'string' || !KEY.test(key) || key.includes('..')) return 'Invalid repository name';
    if (typeof text !== 'string' || text.length > MAX_TEXT) return 'Text must be a string up to 10000 characters';
    const data = Object.assign(Object.create(null), read()) as Record<string, string>;
    data[key] = text;
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(target, JSON.stringify(data, null, 2), 'utf8');
    return null;
  };

  return { read, write };
}
