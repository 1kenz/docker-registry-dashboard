import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

/** Thrown for input that must never reach the docker CLI. Routes map it to HTTP 400. */
export class InputError extends Error {}

const CONTAINER_REF = /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}$/;
const IMAGE_REF = /^[a-z0-9][a-z0-9._\/-]*(:[0-9]{1,5}\/[a-z0-9][a-z0-9._\/-]*)?(:[A-Za-z0-9_][A-Za-z0-9_.-]{0,127})?(@sha256:[a-f0-9]{64})?$/;
const PORT_MAP = /^((\d{1,3}\.){3}\d{1,3}:)?(\d{1,5}:)?\d{1,5}(\/(tcp|udp))?$/;

/** Container id or name, as `docker ps` prints them. */
export function containerRef(value: unknown): string {
  if (typeof value !== 'string' || !CONTAINER_REF.test(value)) {
    throw new InputError('Invalid container id or name');
  }
  return value;
}

/** Image reference such as `localhost:5001/app:1.2` or `nginx@sha256:…`. */
export function imageRef(value: unknown): string {
  if (typeof value !== 'string' || value.length > 255 || !IMAGE_REF.test(value)) {
    throw new InputError('Invalid image reference');
  }
  return value;
}

/** Port mappings separated by commas or spaces, e.g. `8080:80, 127.0.0.1:9000:9000/udp`. */
export function portArgs(value: unknown): string[] {
  if (value === undefined || value === null || value === '') return [];
  if (typeof value !== 'string') throw new InputError('Invalid port mapping');
  const maps = value.split(/[\s,]+/).filter(Boolean);
  if (maps.length > 20 || maps.some((m) => !PORT_MAP.test(m))) {
    throw new InputError('Invalid port mapping');
  }
  return maps.flatMap((m) => ['-p', m]);
}

/** Positive integer within [1, max]; falls back to `fallback` when absent. */
export function boundedInt(value: unknown, fallback: number, max: number): number {
  if (value === undefined || value === null || value === '') return fallback;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > max) throw new InputError('Invalid number');
  return n;
}

/** Runs the docker CLI without a shell, so arguments are never interpreted. */
export async function docker(args: string[], timeoutMs = 30_000) {
  return execFileAsync('docker', args, {
    encoding: 'utf8',
    timeout: timeoutMs,
    maxBuffer: 10 * 1024 * 1024,
  });
}

/** Parses `--format "{{json .}}"` output: one JSON object per line. */
export function jsonLines(stdout: string): unknown[] {
  return stdout
    .split('\n')
    .filter((line) => line.trim())
    .flatMap((line) => {
      try {
        return [JSON.parse(line)];
      } catch {
        return [];
      }
    });
}

export function errorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const e = error as { stderr?: unknown; message?: unknown };
    if (typeof e.stderr === 'string' && e.stderr.trim()) return e.stderr.trim();
    if (typeof e.message === 'string') return e.message;
  }
  return 'Unexpected error';
}
