#!/usr/bin/env python3
"""Verification runner for 3DContinents. See SKILL.md."""
import json, os, re, subprocess, sys, time
from pathlib import Path
REPO = Path(__file__).resolve().parents[3]
CHROME = os.environ.get('CHROME_PATH', '/usr/bin/google-chrome')
failures = []
def check(name, ok, detail=''):
    print(('PASS' if ok else 'FAIL'), name, (':: ' + str(detail))[:400] if detail else '')
    if not ok: failures.append(name)
def run(cmd, **kw):
    return subprocess.run(cmd, cwd=REPO, capture_output=True, text=True, timeout=900, **kw)
def main():
    if not (REPO / 'node_modules').is_dir():
        check('npm install', run(['npm', 'install', '--no-audit', '--no-fund']).returncode == 0)
    proc = run(['npx', 'vitest', 'run'])
    tail = re.sub(r'\x1b\[[0-9;]*m', '', proc.stdout + proc.stderr)
    m = re.search(r'Tests\s+(\d+) passed', tail)
    check('vitest suites (9 tests)', proc.returncode == 0 and m, tail[-300:])
    proc = run(['npm', 'run', 'build'])
    check('vite build', proc.returncode == 0, (proc.stdout + proc.stderr)[-300:])
    server = subprocess.Popen([sys.executable, '-m', 'http.server', '4193', '--bind', '127.0.0.1'], cwd=REPO / 'dist', stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        time.sleep(1.5)
        proc = subprocess.run([CHROME, '--headless=new', '--no-sandbox', '--disable-gpu', '--enable-unsafe-swiftshader',
                               '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1',
                               '--virtual-time-budget=10000', '--window-size=1280,900',
                               '--dump-dom', 'http://127.0.0.1:4193/'],
                              capture_output=True, text=True, timeout=120)
        dom = proc.stdout
        check('render: built app boots', len(dom) > 500 and '<h1' in dom or 'canvas' in dom, dom[:200])
        errs = [l for l in proc.stderr.splitlines() if 'console' in l.lower() and 'error' in l.lower()
                and not re.search(r'dbus|gpu|vulkan|ozone|fontconfig', l, re.I)]
        check('render: no js console errors', not errs, errs[:3])
    finally:
        server.terminate()
    print('FAILURES=%d' % len(failures))
    with open(REPO / '.cursor/skills/verify-3dcontinents/evidence.json', 'w') as f:
        json.dump({'repo': '3DContinents', 'ts': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'failures': failures}, f, indent=2)
    return 1 if failures else 0
if __name__ == '__main__':
    sys.exit(main())
