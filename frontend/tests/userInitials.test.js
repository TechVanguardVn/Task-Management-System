import assert from 'node:assert/strict'
import test from 'node:test'
import { userInitials } from '../src/components/layout/userInitials.js'
import { navigation, pageContext } from '../src/components/layout/navigation.js'

for (const [name, expected] of [
  ['Trần Huỳnh Minh Kiệt', 'TK'],
  ['Nguyễn Văn An', 'NA'],
  ['Minh Kiệt', 'MK'],
  ['Admin', 'A'],
  ['  trần\t huỳnh  minh\nkiệt ', 'TK'],
  ['Đặng Ánh', 'ĐÁ'],
  ['Ánh'.normalize('NFD'), 'Á'],
  ['', 'U'],
  ['   ', 'U'],
  [undefined, 'U'],
  [null, 'U'],
]) {
  test(`avatar initials: ${JSON.stringify(name)} → ${expected}`, () => {
    assert.equal(userInitials(name), expected)
  })
}

test('navigation contains only the four supported workspace routes', () => {
  assert.deepEqual(
    navigation.map(({ to }) => to).sort(),
    ['/dashboard', '/tasks', '/projects', '/kanban'].sort(),
  )
  assert.equal(pageContext('/projects'), 'Dự án')
  assert.equal(pageContext('/projects/example'), 'Dự án')
  assert.equal(pageContext('/projects-other'), 'Không tìm thấy trang')
})
