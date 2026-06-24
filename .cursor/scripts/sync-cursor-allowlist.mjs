/**
 * Sync Cursor IDE yoloCommandAllowlist with .cursor/permissions.json
 * Run: node .cursor/scripts/sync-cursor-allowlist.mjs
 */
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const permissionsPath = path.join(__dirname, '..', 'permissions.json');
const raw = fs.readFileSync(permissionsPath, 'utf8');
const jsonText = raw.replace(/\/\/.*$/gm, '').replace(/,\s*([\]}])/g, '$1');
const permissions = JSON.parse(jsonText);
const allowlist = permissions.terminalAllowlist ?? [];

const STORAGE_KEY =
  'src.vs.platform.reactivestorage.browser.reactiveStorageServiceImpl.persistentStorage.applicationUser';

const dbPath = path.join(
  process.env.APPDATA,
  'Cursor',
  'User',
  'globalStorage',
  'state.vscdb'
);

const backupPath = `${dbPath}.sonafrik-backup-${Date.now()}`;
fs.copyFileSync(dbPath, backupPath);

const db = new DatabaseSync(dbPath);
const row = db.prepare('SELECT value FROM ItemTable WHERE key = ?').get(STORAGE_KEY);
if (!row) {
  console.error('Cursor storage key not found');
  process.exit(1);
}

const data = JSON.parse(row.value);
const before = data.composerState?.yoloCommandAllowlist ?? [];
data.composerState ??= {};
data.composerState.yoloCommandAllowlist = allowlist;
data.composerState.yoloEnableRunEverything = false;
data.composerState.smartAllowlistEnabled = false;

db.prepare('UPDATE ItemTable SET value = ? WHERE key = ?').run(
  JSON.stringify(data),
  STORAGE_KEY
);
db.close();

console.log('Backup:', backupPath);
console.log('Synced', allowlist.length, 'entries (was', before.length, ')');
console.log('Removed broad prefixes: pnpm, npm, node, supabase (bare)');
