import {existsSync,readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {parseEnv} from 'node:util';

// Local, read-only check. Reports paths/rules only, never matching secret values.
function git(args,optional=false){const r=spawnSync('git',args,{encoding:'utf8',maxBuffer:16*1024*1024});if(r.status!==0){if(optional)return '';throw new Error('Git inspection failed. Run from the repository root.');}return r.stdout;}
const files=[...new Set(git(['ls-files','--cached','--others','--exclude-standard','-z']).split('\0').filter(Boolean))];
const findings=[];const privatePath=p=>/(^|\/)(?:\.env(?:\..+)?|local-data|node_modules|\.pnpm-store|dist|build|\.aws|\.codex|\.agents)(?:\/|$)/i.test(p)&&p!=='.env.example';
const env=existsSync('.env')?parseEnv(readFileSync('.env','utf8')):{};
const known=Object.entries(env).filter(([k,v])=>/(SECRET|KEY|TOKEN|PASSWORD|PAYPAL_CLIENT_ID)/i.test(k)&&v.length>=8).flatMap(([,v])=>[v,Buffer.from(v).toString('base64')]);
if(env.PAYPAL_CLIENT_ID&&env.PAYPAL_CLIENT_SECRET)known.push(Buffer.from(env.PAYPAL_CLIENT_ID+':'+env.PAYPAL_CLIENT_SECRET).toString('base64'));
const patterns=[['Google API key',/AIza[0-9A-Za-z_-]{35}/],['GitHub access token',/(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})/],['private key',/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],['AWS access key',/AKIA[A-Z0-9]{16}/]];
function scan(path,bytes,where='working tree'){
  if(privatePath(path)||/\.(?:zip|7z|pfx|p12|pem|key|sqlite3?|log)$/i.test(path))findings.push({path,where,rule:'private/generated/archive file'});
  const text=bytes.toString('utf8');
  if(known.some(v=>text.includes(v)))findings.push({path,where,rule:'configured credential value (redacted)'});
  for(const [rule,pattern] of patterns)if(pattern.test(text))findings.push({path,where,rule});
  const assignment=/(?:PAYPAL_CLIENT_SECRET|AI_API_KEY|GEMINI_API_KEY|(?:SANDBOX_)?PASSWORD)\s*[=:]\s*['"]([^'"\r\n]+)['"]/g;
  for(const match of text.matchAll(assignment))if(!['dummy-test-only','your_sandbox_secret','your_api_key'].includes(match[1]))findings.push({path,where,rule:'literal credential assignment (redacted)'});
}
for(const path of files)if(existsSync(path))scan(path,readFileSync(path));
const indexEntries=git(['ls-files','--stage','-z']).split('\0').filter(Boolean);
for(const entry of indexEntries){const match=/^(\d+) ([a-f0-9]+) 0\t(.+)$/.exec(entry);if(!match)throw new Error('Unmerged index entry: resolve before release.');
  if(match[1]!=='100644'&&match[1]!=='100755')findings.push({path:match[3],where:'Git index',rule:'non-regular release file requires review'});
  scan(match[3],Buffer.from(git(['cat-file','-p',match[2]])),'Git index');
}
// Inspect every reachable/reflog Git blob as well as commit metadata, without printing content.
const history=git(['rev-list','--objects','--all','--reflog'],true).trim().split('\n').filter(Boolean);
for(const line of history){const space=line.indexOf(' ');const oid=space<0?line:line.slice(0,space);const path=space<0?'[commit metadata]':line.slice(space+1);
  const type=git(['cat-file','-t',oid]).trim();if(type==='blob'||type==='commit')scan(path,Buffer.from(git(['cat-file','-p',oid])),'Git history');
}
for(const required of ['LICENSE','README.md','.env.example','pnpm-lock.yaml'])if(!files.includes(required))findings.push({path:required,rule:'required release file absent'});
if(!readFileSync('LICENSE','utf8').startsWith('MIT License'))findings.push({path:'LICENSE',rule:'expected MIT license missing'});
const privateTracked=git(['ls-files','-z']).split('\0').filter(Boolean).filter(privatePath);
if(privateTracked.length)findings.push(...privateTracked.map(path=>({path,rule:'private file tracked'})));
console.log(JSON.stringify({filesChecked:files.length,indexBlobsInspected:indexEntries.length,historyObjectsInspected:history.length,knownCredentialChecks:known.length,findings},null,2));
if(findings.length)process.exitCode=1;
else console.log('PASS: source/history checks found no configured credentials or recognized credential patterns. Heuristic scan; not a universal guarantee.');
