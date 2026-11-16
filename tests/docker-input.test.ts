import { test } from 'node:test';
import assert from 'node:assert/strict';
import { containerRef, imageRef, portArgs, boundedInt, InputError } from '../lib/docker.ts';

const rejects = (fn: () => unknown) => assert.throws(fn, InputError);

test('container refs accept docker ids and names only', () => {
  assert.equal(containerRef('3f2a9c1b7d4e'), '3f2a9c1b7d4e');
  assert.equal(containerRef('my_app-1.web'), 'my_app-1.web');
  for (const bad of ['', 'a;rm -rf /', '$(id)', '`id`', 'a b', '-rm', '../x', 'a|b', 'x'.repeat(200), 42, null]) {
    rejects(() => containerRef(bad));
  }
});

test('image refs accept registry/name:tag and digests only', () => {
  for (const ok of ['nginx', 'nginx:1.27', 'localhost:5001/app:latest', 'localhost:5001/team/app:v2.1', 'library/redis@sha256:' + 'a'.repeat(64)]) {
    assert.equal(imageRef(ok), ok);
  }
  for (const bad of ['', '--privileged', 'nginx; id', 'nginx && id', 'nginx $(id)', 'Nginx', 'a b', 'x'.repeat(300)]) {
    rejects(() => imageRef(bad));
  }
});

test('port mappings become separate -p arguments', () => {
  assert.deepEqual(portArgs(''), []);
  assert.deepEqual(portArgs(undefined), []);
  assert.deepEqual(portArgs('8080:80'), ['-p', '8080:80']);
  assert.deepEqual(portArgs('8080:80, 127.0.0.1:9000:9000/udp'), ['-p', '8080:80', '-p', '127.0.0.1:9000:9000/udp']);
  for (const bad of ['80:80 --privileged', '80:80;id', '-v /:/host', 'abc', '80:80/sctp']) {
    rejects(() => portArgs(bad));
  }
});

test('log tail is a bounded integer', () => {
  assert.equal(boundedInt(undefined, 100, 5000), 100);
  assert.equal(boundedInt(50, 100, 5000), 50);
  assert.equal(boundedInt('20', 100, 5000), 20);
  for (const bad of [0, -1, 5001, 1.5, '10; id', 'all']) rejects(() => boundedInt(bad, 100, 5000));
});
