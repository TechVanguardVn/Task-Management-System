import assert from 'node:assert/strict'
import test from 'node:test'
import { validateApiBaseUrl } from '../src/api/config.js'

test('normalizes a public HTTPS origin', () => {
  assert.equal(
    validateApiBaseUrl(' https://example.com/ '),
    'https://example.com',
  )
})

test('allows HTTP only for local development', () => {
  assert.equal(
    validateApiBaseUrl('http://localhost:8080'),
    'http://localhost:8080',
  )
  assert.equal(
    validateApiBaseUrl('http://127.0.0.1:8080'),
    'http://127.0.0.1:8080',
  )
  assert.equal(validateApiBaseUrl('http://[::1]:8080'), 'http://[::1]:8080')
  assert.throws(() => validateApiBaseUrl('http://example.com'))
})

for (const [label, value] of [
  ['missing value', undefined],
  ['empty value', ''],
  ['invalid URL', 'not a URL'],
  ['credentials', 'https://user:example@example.com'],
  ['path', 'https://example.com/api'],
  ['query', 'https://example.com?key=example'],
  ['fragment', 'https://example.com/#example'],
  ['other protocol', 'file:///example'],
]) {
  test(`rejects API configuration with ${label}`, () => {
    assert.throws(() => validateApiBaseUrl(value))
  })
}
