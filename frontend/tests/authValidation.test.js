import assert from 'node:assert/strict'
import test from 'node:test'
import {
  authErrorMessage,
  authFieldErrors,
  passwordRequirements,
  validateAuth,
} from '../src/components/auth/validation.js'

const valid = {
  name: 'Nguyễn Minh',
  email: '  PERSON@example.com  ',
  password: 'a'.repeat(12),
  confirmPassword: 'a'.repeat(12),
}

test('accepts registration under the backend policy without invented composition rules', () => {
  assert.deepEqual(validateAuth(valid, 'register'), {})
  assert.ok(passwordRequirements(valid.password).every(({ met }) => met))
})

test('rejects blank and invalid email/name values', () => {
  assert.ok(validateAuth({ ...valid, name: ' ', email: '' }, 'register').name)
  assert.ok(validateAuth({ ...valid, email: 'invalid' }, 'login').email)
  assert.ok(
    validateAuth({ ...valid, email: 'a'.repeat(255) + '@example.com' }, 'login')
      .email,
  )
  assert.ok(validateAuth({ ...valid, name: 'a'.repeat(121) }, 'register').name)
})

test('requires 12 Unicode code points for registration but permits existing shorter login passwords', () => {
  assert.ok(
    validateAuth({ ...valid, password: 'a'.repeat(11) }, 'register').password,
  )
  assert.equal(
    validateAuth({ ...valid, password: 'a' }, 'login').password,
    undefined,
  )
  assert.ok(
    validateAuth({ ...valid, password: '😀'.repeat(6) }, 'register').password,
  )
  assert.equal(
    validateAuth(
      { ...valid, password: '😀'.repeat(12), confirmPassword: '😀'.repeat(12) },
      'register',
    ).password,
    undefined,
  )
})

test('enforces the BCrypt UTF-8 byte boundary, including Vietnamese characters', () => {
  assert.equal(
    validateAuth({ ...valid, password: 'ắ'.repeat(24) }, 'login').password,
    undefined,
  )
  assert.ok(
    validateAuth({ ...valid, password: 'ắ'.repeat(25) }, 'login').password,
  )
  assert.equal(
    validateAuth({ ...valid, password: 'a'.repeat(72) }, 'login').password,
    undefined,
  )
  assert.ok(
    validateAuth({ ...valid, password: 'a'.repeat(73) }, 'login').password,
  )
})

test('rejects blank and NUL-containing passwords', () => {
  for (const password of ['', ' '.repeat(12), 'test\0password']) {
    assert.ok(validateAuth({ ...valid, password }, 'login').password)
  }
})

test('requires confirmation to match exactly without trimming passwords', () => {
  assert.ok(
    validateAuth({ ...valid, confirmPassword: '' }, 'register').confirmPassword,
  )
  assert.ok(
    validateAuth(
      { ...valid, confirmPassword: valid.password + ' ' },
      'register',
    ).confirmPassword,
  )
})

test('returns localized API/network errors without exposing backend messages', () => {
  assert.match(authErrorMessage({}, 'login'), /kết nối/)
  assert.match(
    authErrorMessage({ response: { status: 401 } }, 'login'),
    /không chính xác/,
  )
  assert.match(
    authErrorMessage({ response: { status: 409 } }, 'register'),
    /đã được sử dụng/,
  )
  for (const status of [400, 403, 429, 500]) {
    const message = authErrorMessage(
      { response: { status, data: { message: 'INTERNAL_DETAILS' } } },
      'login',
    )
    assert.ok(message)
    assert.ok(!message.includes('INTERNAL_DETAILS'))
  }
})

test('maps supported API validation fields into Vietnamese and ignores unknown fields', () => {
  const errors = authFieldErrors({
    response: {
      data: {
        validationErrors: [{ field: 'email' }, { field: 'unknown' }, null],
      },
    },
  })
  assert.deepEqual(Object.keys(errors), ['email'])
  assert.match(errors.email, /Email chưa hợp lệ/)
  assert.deepEqual(authFieldErrors({}), {})
})
