---
name: deploy
description: Run tests, bump version, commit, push, wait for CI, trigger EasyPanel, verify version is live, and produce player-facing release notes copied to clipboard
---

Deploy Kombass to production. Run after manual testing is complete and the user says changes are ready to deploy.

## 1. Pre-deployment tests

Run frontend tests, backend compile check, and E2E tests:

```bash
cd /Users/Max/repos/kombass/frontend && CI=true npm test
cd /Users/Max/repos/kombass/server && npm run postinstall
```

If either fails, surface the errors and stop — do NOT commit.

Then run the E2E suite (requires Node 20+ via nvm):

```bash
# Kill any leftover E2E frontend on port 3001
kill $(lsof -t -i :3001) 2>/dev/null || true
source ~/.nvm/nvm.sh && nvm use 20
cd /Users/Max/repos/kombass/e2e && npx playwright test --ignore-snapshots --reporter=list
```

If E2E fails, surface the errors and stop — do NOT commit. Note: E2E uses a separate frontend on port 3001 and a dedicated `kombass` postgres database on localhost:5432 (not the dev database).

## 2. Bump version

Read the current version from `frontend/package.json`. Bump the patch version (e.g. 0.3.1 → 0.3.2). Also check `frontend/public/index.html` for a `<meta name="app-version">` tag and update it to match.

## 3. Stage, commit, push

Check what's uncommitted:

```bash
cd /Users/Max/repos/kombass && git status
git diff --stat
git log --oneline -5
```

Stage all modified and untracked files relevant to the change (not test-results, build artefacts, .env files). Include the version bump files.

Ask the user for a commit message if one wasn't provided as an argument ($ARGUMENTS). Commit and push to main.

## 4. Watch CI

```bash
gh run watch $(gh run list --repo maxime-pico/kombass --limit 1 --json databaseId -q '.[0].databaseId') --repo maxime-pico/kombass
```

If CI fails, fetch failed logs and surface them to the user:

```bash
gh run view <id> --repo maxime-pico/kombass --log-failed
```

Do NOT proceed to deploy if CI failed.

## 5. Trigger EasyPanel

```bash
curl -s http://46.224.96.173:3000/api/compose/deploy/f33e4cfd9c3d0c1f8a4cc6e912e77f1cd34723244c781423
```

## 6. Wait and verify version

Poll the production site with exponential backoff, checking the `<meta name="app-version">` tag matches the new version. Start at 10s, double each attempt, timeout after 7 minutes.

```bash
expected="0.X.Y"  # from frontend/package.json
delay=10; elapsed=0; max=420
while [ $elapsed -lt $max ]; do
  sleep $delay
  elapsed=$((elapsed + delay))
  version=$(curl -s https://kombass.maximepico.com | grep -o 'app-version" content="[^"]*"' | cut -d'"' -f3)
  echo "$(date +%H:%M:%S) [${elapsed}s elapsed] — version: $version (expecting $expected)"
  if [ "$version" = "$expected" ]; then echo "Version matched!"; break; fi
  delay=$((delay * 2))
done
```

Report if it doesn't match within the timeout.

## 7. Generate release notes and copy to clipboard

Look at ALL commits included in this deploy (since the last deployed version tag or the previous version bump commit). Use `git log` and `git diff --stat` to understand the full scope of changes.

Write **player-facing** release notes only:
- Skip internal changes (test infrastructure, refactoring, dev tooling, CI changes)
- Focus on features and gameplay changes players will notice
- Keep it short, engaging, 2-4 sentences max
- Format: `**Kombass vX.Y.Z**\n\n<description>`

Copy the release notes to the system clipboard:

```bash
echo '<release notes>' | pbcopy
```

## 8. Report outcome

Output a summary:

---
✅ Deployed successfully

**Version:** vX.Y.Z
**Commit:** <short hash> — <message>
**CI:** passed
**Site:** kombass.maximepico.com

**Release notes** (copied to clipboard):
> <the release notes>
---

If anything failed, report the step and error instead.
