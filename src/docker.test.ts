import { afterEach, describe, expect, mock, test } from 'bun:test';
import { DockerRegistry } from './docker';

const tag = (name: string) => ({
  content_type: 'image',
  creator: 1,
  digest: `sha256:${name}`,
  full_size: 1,
  id: 1,
  images: [],
  last_pulled: '2026-01-01T00:00:00Z',
  last_pushed: '2026-01-01T00:00:00Z',
  last_updated: '2026-01-01T00:00:00Z',
  last_updater: 1,
  last_updater_username: 'test',
  media_type: 'application/vnd.docker.distribution.manifest.v2+json',
  name,
  repository: 1,
  tag_last_pulled: '2026-01-01T00:00:00Z',
  tag_last_pushed: '2026-01-01T00:00:00Z',
  tag_status: 'active',
  v2: true,
});

afterEach(() => {
  mock.restore();
});

describe('DockerRegistry', () => {
  test('gets all tags across paginated responses', async () => {
    const fetchMock = mock((input: string | URL) => {
      const url = String(input);
      const page = new URL(url).searchParams.get('page');
      const results = page === '2' ? [tag('second')] : [tag('first')];

      return Promise.resolve(new Response(JSON.stringify({ count: 2, next: null, previous: null, results })));
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const registry = new DockerRegistry({ repository: 'owner/images' });
    (registry as { tagListLimit: number }).tagListLimit = 1;

    const tags = await registry.getTags();

    expect(tags.map(({ name }) => name)).toEqual(['first', 'second']);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test('logs in and deletes a tag', async () => {
    const fetchMock = mock((input: string | URL) => {
      const url = String(input);
      if (url.endsWith('/login/')) {
        return Promise.resolve(new Response(JSON.stringify({ token: 'token' })));
      }
      return Promise.resolve(new Response(null, { status: 204 }));
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const registry = new DockerRegistry({ repository: 'owner/images' });

    await registry.login('username', 'password');
    await registry.deleteTag('old');

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: 'POST',
      body: JSON.stringify({ username: 'username', password: 'password' }),
    });
    expect(fetchMock.mock.calls[1]?.[0]).toBe('https://hub.docker.com/v2/repositories/owner/images/tags/old/');
  });

  test('rejects failed requests', async () => {
    globalThis.fetch = mock(() => Promise.resolve(new Response(null, { status: 500 }))) as unknown as typeof fetch;

    await expect(new DockerRegistry({ repository: 'owner/images' }).getTags()).rejects.toThrow(
      'Failed to fetch tags from Docker Hub',
    );
  });
});
