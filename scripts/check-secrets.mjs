import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

// Reports locations/categories only; never emits matching credential values.
const tracked = execFileSync('git', ['ls-files', '-z']).toString().split('\0').filter(Boolean)
const untracked = execFileSync('git', ['ls-files', '--others', '--exclude-standard', '-z']).toString().split('\0').filter(Boolean)
const findings = []
const patterns = [
  ['private key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['credential-bearing database URI', /(?:postgres(?:ql)?|jdbc:postgresql):\/\/[^\s/:]+:[^\s/@]+@/i],
  ['service credential', /\b(?:sb_secret_|ghp_|github_pat_|sk_live_)[a-zA-Z0-9_]{20,}\b/],
  ['literal JWT', /\beyJ[a-zA-Z0-9_-]{20,}\.eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}\b/],
]
function inspect(path, bytes, source) {
  if (bytes.includes(0)) return
  const text = bytes.toString('utf8')
  for (const [category, pattern] of patterns) if (pattern.test(text)) findings.push({ path, source, category })
  for (const match of text.matchAll(/^\s*(?:JWT_SECRET|DB_PASSWORD|FLYWAY_DB_PASSWORD)\s*=\s*(\S+)/gm)) {
    if (!/^(?:\$\{|YOUR_|<|#|"?\$|replace|change|example)/i.test(match[1])) findings.push({ path, source, category: 'literal secret environment assignment' })
  }
}
for (const path of tracked) {
  if (/(?:^|\/)\.env(?:\.|$)/.test(path) && !path.endsWith('.env.example')) findings.push({ path, category: 'tracked private environment file' })
  if (/\.(?:pem|key|p12|pfx)$/.test(path)) findings.push({ path, category: 'tracked key file' })
  inspect(path, execFileSync('git', ['show', `:${path}`], { maxBuffer: 10 * 1024 * 1024 }), 'index')
  try { inspect(path, readFileSync(path), 'working tree') } catch { /* A tracked file may be removed by this task. */ }
}
for (const path of untracked) inspect(path, readFileSync(path), 'new file')
console.log(JSON.stringify({ trackedPaths: tracked.length, newPaths: untracked.length, findings }, null, 2))
if (findings.length) process.exitCode = 1
