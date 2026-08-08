#!/usr/bin/env node
/**
 * Dev-only: create a Supabase session for an existing user (service role)
 * and open ragapp://auth-callback with tokens on Android and/or iOS Simulator.
 *
 * Usage:
 *   yarn auth:login <email>
 *   yarn auth:login <email> --ios
 *   yarn auth:login <email> --android
 *   yarn auth:login <email> --device emulator-5554
 *   yarn auth:login <email> --print   # only print deep link
 *
 * Requires in .env:
 *   EXPO_PUBLIC_SUPABASE_URL
 *   EXPO_PUBLIC_SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PACKAGE =
  process.env.RAGAPP_PACKAGE || 'berlin.cypherpunkacademy.ragapp';

const env = {};
for (const file of ['.env', '.env.local']) {
  try {
    for (const line of readFileSync(resolve(ROOT, file), 'utf8').split('\n')) {
      const m = line.match(/^([^#=\s][^=]*)=(.*)$/);
      if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  } catch {
    /* optional */
  }
}
// process.env wins so you can override .env (e.g. production login)
const get = (k) => process.env[k] ?? env[k];

const args = process.argv.slice(2);
const printOnly = args.includes('--print');
const wantIos = args.includes('--ios');
const wantAndroid = args.includes('--android');
const deviceIdx = args.indexOf('--device');
const deviceSerial =
  deviceIdx >= 0 ? args[deviceIdx + 1] : process.env.ANDROID_SERIAL || null;
const email = args.find((a, i) => !a.startsWith('--') && (deviceIdx < 0 || i !== deviceIdx + 1));

if (!email || !email.includes('@')) {
  console.error(
    'Usage: yarn auth:login <email> [--ios] [--android] [--device SERIAL] [--print]',
  );
  process.exit(1);
}

const SUPABASE_URL = get('EXPO_PUBLIC_SUPABASE_URL');
const ANON_KEY = get('EXPO_PUBLIC_SUPABASE_ANON_KEY');
const SERVICE_ROLE_KEY = get('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE_KEY) {
  console.error(
    'Missing env. Need EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY',
  );
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const anon = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

console.log(`Looking up ${email} on ${SUPABASE_URL} …`);

const { data: listData, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
if (listErr) {
  console.error('listUsers failed:', listErr.message);
  process.exit(1);
}

const user = listData.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
if (!user) {
  console.error(`No auth.users row for ${email}. Create the account first.`);
  process.exit(1);
}

console.log(`User id: ${user.id}`);

const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
  type: 'magiclink',
  email,
});
if (linkErr) {
  console.error('generateLink failed:', linkErr.message);
  process.exit(1);
}

const tokenHash = linkData?.properties?.hashed_token;
if (!tokenHash) {
  console.error('generateLink returned no hashed_token:', linkData);
  process.exit(1);
}

const { data: sessionData, error: otpErr } = await anon.auth.verifyOtp({
  type: 'email',
  token_hash: tokenHash,
});
if (otpErr) {
  console.error('verifyOtp failed:', otpErr.message);
  process.exit(1);
}

const session = sessionData.session;
if (!session?.access_token || !session?.refresh_token) {
  console.error('No session returned from verifyOtp');
  process.exit(1);
}

// Query params (not hash) — Android Intent URLs often drop fragments
const deepLink =
  `ragapp://auth-callback` +
  `?access_token=${encodeURIComponent(session.access_token)}` +
  `&refresh_token=${encodeURIComponent(session.refresh_token)}`;

console.log(`Session for ${session.user?.email ?? email} (expires ${session.expires_at ?? '?'})`);
console.log(deepLink);

if (printOnly) {
  process.exit(0);
}

function adbDevices() {
  try {
    const out = execFileSync('adb', ['devices'], { encoding: 'utf8' });
    return out
      .split('\n')
      .slice(1)
      .map((l) => l.trim())
      .filter((l) => l.endsWith('\tdevice'))
      .map((l) => l.split('\t')[0]);
  } catch {
    return [];
  }
}

function bootedIosSims() {
  try {
    const out = execFileSync('xcrun', ['simctl', 'list', 'devices', 'booted', '-j'], {
      encoding: 'utf8',
    });
    const json = JSON.parse(out);
    const ids = [];
    for (const devices of Object.values(json.devices ?? {})) {
      for (const d of devices) {
        if (d.state === 'Booted' && d.udid) ids.push({ udid: d.udid, name: d.name });
      }
    }
    return ids;
  } catch {
    return [];
  }
}

function openOnAndroid(serial) {
  console.log(`Opening deep link on Android ${serial} …`);
  execFileSync('adb', ['-s', serial, 'shell', 'am', 'force-stop', PACKAGE], {
    stdio: 'inherit',
  });
  // Entire remote command as one argv so `&` in the URL is not split by adb's shell
  const quoted = deepLink.replace(/'/g, `'\\''`);
  execFileSync(
    'adb',
    ['-s', serial, 'shell', `am start -W -a android.intent.action.VIEW -d '${quoted}' ${PACKAGE}`],
    { stdio: 'inherit' },
  );
}

function openOnIos(udid, name) {
  console.log(`Opening deep link on iOS Simulator ${name} (${udid}) …`);
  try {
    execFileSync('xcrun', ['simctl', 'terminate', udid, PACKAGE], { stdio: 'ignore' });
  } catch {
    /* app may not be running */
  }
  execFileSync('xcrun', ['simctl', 'openurl', udid, deepLink], { stdio: 'inherit' });
}

// Platform selection: --ios / --android restrict; default = both available targets
const openIos = wantIos || (!wantIos && !wantAndroid && !deviceSerial);
const openAndroid = wantAndroid || deviceSerial || (!wantIos && !wantAndroid);

let opened = 0;

if (openIos) {
  const sims = bootedIosSims();
  if (sims.length === 0 && (wantIos || !openAndroid)) {
    console.warn('No booted iOS Simulator. Start one (e.g. yarn ios) and retry.');
  }
  for (const sim of sims) {
    try {
      openOnIos(sim.udid, sim.name);
      opened += 1;
    } catch (e) {
      console.error(`simctl failed for ${sim.name}:`, e.message);
    }
  }
}

if (openAndroid) {
  const serials = deviceSerial ? [deviceSerial] : adbDevices();
  if (serials.length === 0 && (wantAndroid || deviceSerial || !openIos)) {
    console.warn('No Android device via adb.');
  }
  for (const serial of serials) {
    try {
      openOnAndroid(serial);
      opened += 1;
    } catch (e) {
      console.error(`adb failed for ${serial}:`, e.message);
    }
  }
}

if (opened === 0) {
  console.warn('Deep link printed above; open it on the device/simulator manually.');
  process.exit(1);
}
