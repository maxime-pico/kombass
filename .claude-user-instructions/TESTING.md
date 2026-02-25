# Kombass Testing Guide

## Overview

Three-layer testing infrastructure:

| Layer | What it tests | How to run |
|-------|--------------|-----------|
| **Unit tests** | Combat engine, win conditions | `cd frontend && CI=true npm test` |
| **Browser test harness** | All scenarios visually in the browser | Navigate to `localhost:3000/test` |
| **Playwright E2E** | Full browser automation | `cd e2e && npx playwright test` |

---

## Unit Tests (Jest)

```bash
cd frontend
CI=true npm test               # Single pass, all tests
npm test                       # Watch mode
npm test -- --testPathPattern=engine   # Engine tests only
```

**Test files:**
- `src/engine/__tests__/combatEngine.test.ts` — Range, damage, flag zone, symmetry
- `src/engine/__tests__/winCondition.test.ts` — All win/loss conditions
- `src/App.test.tsx` — App smoke tests

---

## Browser Test Harness

Start frontend in test mode:
```bash
cd frontend
REACT_APP_TEST_MODE=true npm start    # or: npm run start:test
```

Then navigate to **`http://localhost:3000/test`**

**What you can do:**
- Click **"Run All Scenarios"** — runs all 10 combat scenarios in-browser, shows PASS/FAIL with life totals
- Click **"Load in App"** on any scenario — injects scenario state into the live game (navigates to `/`)

**Console API** (available on any page when `REACT_APP_TEST_MODE=true`):
```javascript
// List available scenarios
window.__KOMBASS_TEST_API__.getScenarios()

// Load a scenario by name or index
window.__KOMBASS_TEST_API__.loadScenario('basic_melee')
window.__KOMBASS_TEST_API__.loadScenario(0)

// Read current app state
window.__KOMBASS_TEST_API__.getState()

// Run combat calculation (returns result, does NOT apply to state)
window.__KOMBASS_TEST_API__.triggerCombat()

// Jump to a specific game step
window.__KOMBASS_TEST_API__.setStep(5)   // 5 = combat phase
```

---

## Playwright E2E Tests

### Prerequisites
- Node 20+ required (`nvm use 20`)
- Frontend dev server must be running on port 3000 with `REACT_APP_TEST_MODE=true`
- OR let Playwright start it automatically (configured in `playwright.config.ts`)

### Run tests
```bash
cd e2e
npx playwright test                       # All tests
npx playwright test tests/combat-scenarios.spec.ts    # Combat tests only
npx playwright test tests/visual-regression.spec.ts   # Visual tests only
npx playwright test --ui                  # Interactive UI mode
npx playwright test --update-snapshots    # Regenerate visual baselines
npx playwright show-report                # View HTML report
```

### Test files
- `tests/combat-scenarios.spec.ts` — Solo mode: loads scenarios, verifies combat results, tests harness UI
- `tests/visual-regression.spec.ts` — Screenshot comparison for intro screen, test harness, and combat board

### Visual regression baselines
Stored in `tests/visual-regression.spec.ts-snapshots/`. Regenerate when UI changes are intentional:
```bash
npx playwright test tests/visual-regression.spec.ts --update-snapshots
```

---

## Two-Tab Manual Testing Protocol

For testing the full multiplayer game flow with Chrome MCP:

1. Start backend: `cd server && npm run watch-ts` (in one terminal), `npm run watch-node` (another)
2. Start frontend: `cd frontend && REACT_APP_TEST_MODE=true npm start`
3. Open **two browser tabs** at `localhost:3000`
4. Tab 1: Click PLAY → get room URL
5. Tab 2: Navigate to the room URL
6. Both tabs: Use `window.__KOMBASS_TEST_API__` to fast-forward through setup phases:
   ```javascript
   // After placement, inject final positions directly
   window.__KOMBASS_TEST_API__.setStep(0)
   ```
7. Both tabs submit moves → verify combat resolution matches `triggerCombat()` output

---

## CI Pipeline

Tests run on every PR and push to `main`:

1. **test-frontend** — `CI=true npm test` (unit + engine tests)
2. **test-backend** — `tsc --noEmit` (TypeScript type check)
3. **test-e2e** — Playwright tests (runs after frontend + backend pass)
   - Playwright report uploaded as artifact on failure

---

## Adding New Scenarios

1. Add entry to `frontend/src/engine/scenarios.ts`
2. Unit test picks it up automatically (scenarios loop in `combatEngine.test.ts`)
3. Browser harness shows it at `/test`
4. Playwright tests verify it via `getScenarios()`

**Scenario structure:**
```typescript
{
  name: "my_scenario",
  description: "Human readable description",
  input: {
    units: [[...player0units], [...player1units]],
    futureUnits: [[...], [...]],
    flags: [{ x: 0, y: 10, inZone: true }, { x: 21, y: 10, inZone: true }],
    isPlayer: 0,
    unitsCount: 1,
  },
  expected: {
    myUnitsLife: [2],           // player 0 unit life values
    opponentUnitsLife: [-1],    // player 1 unit life values
    flagsInZone: [true, true],  // optional: flag inZone values
  },
}
```
