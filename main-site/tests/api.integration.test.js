import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { spawn } from 'node:child_process';
import path from 'node:path';

const API_PORT = Number(process.env.TEST_API_PORT || 4100);
const API_BASE_URL = `http://127.0.0.1:${API_PORT}`;
let apiProcess;

async function waitForApi(baseUrl, timeoutMs = 30000) {
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(`${baseUrl}/api/movies/top`);
      if (res.ok) return;
    } catch {
      // Server not ready yet.
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`API did not become ready in ${timeoutMs} ms`);
}

beforeAll(async () => {
  const cwd = path.resolve(process.cwd());

  apiProcess = spawn(process.execPath, ['server/index.js'], {
    cwd,
    env: {
      ...process.env,
      HOST: '127.0.0.1',
      PORT: String(API_PORT),
    },
    stdio: 'pipe',
  });

  apiProcess.stderr?.on('data', (chunk) => {
    const text = chunk?.toString?.() || '';
    if (text.trim()) {
      // Keep server errors visible in test output.
      process.stderr.write(text);
    }
  });

  await waitForApi(API_BASE_URL);
}, 45000);

afterAll(() => {
  if (!apiProcess || apiProcess.killed) return;
  apiProcess.kill('SIGTERM');
});

describe('API integration smoke checks', () => {
  it('returns movies list for public endpoint', async () => {
    const response = await fetch(`${API_BASE_URL}/api/movies/top`);
    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(Array.isArray(payload)).toBe(true);
  });

  it('returns genres list for public endpoint', async () => {
    const response = await fetch(`${API_BASE_URL}/api/genres`);
    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(Array.isArray(payload)).toBe(true);
  });

  it('blocks admin endpoint without auth token', async () => {
    const response = await fetch(`${API_BASE_URL}/api/admin/stats`);
    expect(response.status).toBe(401);

    const payload = await response.json();
    expect(payload).toHaveProperty('message');
  });

  it('allows admin login and returns current user', async () => {
    const loginResponse = await fetch(`${API_BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'absolute.cinema2027@gmail.com',
        password: 'absolute2027',
      }),
    });

    expect(loginResponse.status).toBe(200);
    const loginPayload = await loginResponse.json();
    expect(loginPayload?.token).toBeTruthy();

    const meResponse = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${loginPayload.token}`,
      },
    });

    expect(meResponse.status).toBe(200);
    const mePayload = await meResponse.json();
    expect(mePayload?.user?.isAdmin).toBe(true);
  });
});
