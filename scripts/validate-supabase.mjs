import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const migrationsDir = path.resolve('supabase/migrations');
const migrations = (await readdir(migrationsDir)).filter((file) => /^\d+_.+\.sql$/.test(file)).sort();
if (!migrations.length) throw new Error('Nenhuma migration Supabase encontrada.');

let previous = 0;
for (const migration of migrations) {
  const version = Number(migration.match(/^(\d+)_/)?.[1]);
  if (!Number.isInteger(version) || version !== previous + 1) throw new Error(`Sequência de migrations inválida em ${migration}.`);
  previous = version;
  const sql = await readFile(path.join(migrationsDir, migration), 'utf8');
  if (/\bDROP\s+TABLE\b/i.test(sql)) throw new Error(`${migration} contém DROP TABLE; migrations destrutivas exigem revisão manual.`);
}

const secretPatterns = [/ghp_[A-Za-z0-9]+/, /sbp_[A-Za-z0-9]+/, /SUPABASE_SERVICE_ROLE_KEY\s*[:=]\s*['"][^'$]/];
const files = ['supabase/functions/admin-users/index.ts', 'supabase/functions/admin-settings/index.ts', 'supabase/functions/certificate-files/index.ts', 'supabase/functions/student-files/index.ts'];
for (const file of files) {
  const content = await readFile(file, 'utf8');
  if (!content.includes('serve(')) throw new Error(`${file} não exporta um servidor Edge Function.`);
  if (secretPatterns.some((pattern) => pattern.test(content))) throw new Error(`Possível segredo versionado em ${file}.`);
}

console.log(`Supabase validation passed: ${migrations.length} migrations and ${files.length} Edge Functions checked.`);
