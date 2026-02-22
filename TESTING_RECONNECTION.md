# Reconnection Testing Guide (Week 4)

## Setup Complete ✅
- Server running on port 9000
- Client running on port 3000
- Both compiled and ready to test

## 6 Test Scenarios

### Test 1: Basic Reconnection
**Goal**: Reach active gameplay, refresh browser, expect syncing overlay and state restoration.

**Steps**:
1. Open two browser windows: `http://localhost:3000`
2. Window 1: Create room (e.g., "test-room"), join as Player 1
3. Window 2: Join same room as Player 2
4. Both players:
   - Update settings (any board size/unit count)
   - Select unit types
   - Place units
5. Once both ready and gameplay starts (step 0+), **in Window 1 only**:
   - Press **F5** to refresh
6. **Expect**:
   - Syncing overlay appears with "Reconnecting..." message
   - Overlay disappears within 2 seconds
   - Game state restored: same units, same board layout
   - Step/round match where you left off
   - Can continue moving units normally

**Check**:
- Browser console: `Game state restored:` log with correct gameState
- Server console: `Player N reconnected to game` message
- No errors in either console

---

### Test 2: Mid-Combat Disconnect
**Goal**: Submit moves, refresh during animation, expect post-combat state (animations NOT replayed).

**Steps**:
1. Repeat Test 1 setup (both players ready, gameplay started)
2. **Player 1**: Move a unit to attack Player 2's unit
3. **Player 2**: Move a unit to attack Player 1's unit (or just move)
4. Both press Confirm Moves
5. **Animation starts** — immediately press F5 in Window 1 (while units are animating or booms are playing)
6. **Expect**:
   - Syncing overlay appears
   - Reconnects to post-combat state (units show final positions, not start positions)
   - NO unit animations replay (units already at final positions)
   - Dead units are already removed
   - Step is now at combat phase (step = unitsCount) showing ghosts
   - futureUnits are cleared (ready for next round)

**Check**:
- Browser console: `Game state restored: {...gameState}` with post-combat unit positions
- Units in `gameState.players[].units` match expected final positions
- Dead units not in units array
- `gameState.players[].futureUnits` is null for both players

---

### Test 3: Both Players Disconnect
**Goal**: Active round, both players F5 independently, expect identical game state.

**Steps**:
1. Play through 1-2 rounds to get to round 2
2. Once round 2 starts (both players can move), **without coordinating**:
   - **Window 1 (Player 1)**: Press F5
   - Wait 3 seconds
   - **Window 2 (Player 2)**: Press F5
3. **Expect**:
   - Both reconnect independently
   - Both see identical board state (same unit positions, same step/round)
   - Both can resume moving units from same state

**Check**:
- Console logs show both players reconnecting at roughly same time
- Same `gameState` logged in both windows (same units positions, step, round)
- No "opponent_reconnected" alerts or special handling needed

---

### Test 4: Invalid Session Token
**Goal**: Delete Player record in DB, then F5 — expect error alert and redirect to intro.

**Steps**:
1. Start a game and reach gameplay (both players ready)
2. **In a third terminal**: Run Prisma Studio
   ```bash
   cd /Users/Max/repos/kombass/server
   PATH="/tmp/node_wrapper:$PATH" npx prisma studio
   ```
3. In Prisma Studio (http://localhost:5555):
   - Click "Player" model
   - Find the Player record for Window 1 (check sessionToken in browser DevTools → Application → localStorage)
   - Delete that record
4. In Window 1: Press F5
5. **Expect**:
   - Syncing overlay appears
   - After 1-2 seconds, alert appears: `Reconnection failed: Invalid or expired session. Starting a new game.`
   - localStorage `kombass_session_token` is cleared
   - Browser redirects to intro screen (step = -5)
   - Player can start a new game

**Check**:
- Browser console shows `Reconnection failed: Invalid or expired session`
- localStorage no longer has `kombass_session_token` key
- Application state reset to `step: -5, isInRoom: false, gameStarted: false`

---

### Test 5: Completed Game
**Goal**: Play to game over, don't close modal, press F5 — expect "Game has ended" alert.

**Steps**:
1. Start a game with reduced unit count (e.g., 1 unit per side) for faster completion
2. Play until game ends (flag captured or all units dead)
   - Game over modal appears ("Player X wins!")
   - **DO NOT close the modal**
3. In the modal still visible: Press F5
4. **Expect**:
   - Syncing overlay appears briefly
   - Alert appears: `Reconnection failed: Game has ended. Starting a new game.`
   - localStorage cleared
   - Redirected to intro screen

**Check**:
- Server log shows: `reconnect_error with error: "Game has ended"`
- Game status in DB is "COMPLETED"
- Client state reset: `step: -5`

---

### Test 6: Network Failure (Offline Simulation)
**Goal**: Simulate network failure, press F5 — expect graceful fallback (no blank screen).

**Steps**:
1. Start a game and reach gameplay
2. **In Window 1**: Open DevTools (F12)
3. **Disable Network**:
   - Click Network tab
   - Click "offline" dropdown (top-left of Network tab)
   - Select "Offline"
4. With network offline: Press F5
5. **Expect**:
   - Syncing overlay appears
   - After ~5 seconds, timeout occurs
   - Error caught gracefully: localStorage token cleared, step → -5
   - Intro screen displays (no blank page)
   - Can re-enable network and start fresh game

**Check**:
- Browser console shows error (but no unhandled exception crash)
- Application doesn't hang or show blank white screen
- Intro screen loads after error handling
- Can play normally after re-enabling network

---

## Debugging Checklist

If any test fails:

### Check Server Logs
```bash
tail -f /tmp/server.log  # See server activity
```
Look for:
- `Reconnection attempt with token: ...`
- `Player N reconnected to game ...`
- Any error messages

### Check Browser Console
1. Expand console drawer (F12 → Console tab)
2. Search for:
   - `"Game state restored"` — should log full gameState object
   - `"Reconnection failed"` — error details
   - Any red errors (not expected for success cases)

### Check Prisma Studio
1. Run: `cd server && PATH="/tmp/node_wrapper:$PATH" npx prisma studio`
2. Open http://localhost:5555
3. Check:
   - Game record: status should match expected state (PLACEMENT, ACTIVE, COMPLETED)
   - Player records: socketId should be populated after reconnection, null after disconnect
   - Session tokens match what's in localStorage

### Verify Database State
```bash
# In another terminal, from server/ directory:
npm run postinstall  # if you modified any .ts files
npm start            # restart server if changes made
```

---

## Common Issues & Fixes

### Issue: "Port 9000 already in use"
**Fix**: Kill old process
```bash
pkill -f "node dist/server.js"
cd /Users/Max/repos/kombass/server && npm start
```

### Issue: Client shows blank screen after F5
**Fix**: Check if server is running and has no errors
```bash
curl http://localhost:9000  # Should get a response (not error)
```

### Issue: Socket events not firing
**Fix**: Check compilation
```bash
cd /Users/Max/repos/kombass/server && npm run postinstall
```

### Issue: "Invalid or expired session" immediately
**Fix**: Check localStorage in DevTools
- Application tab → Storage → localStorage → http://localhost:3000
- `kombass_session_token` should exist and be a UUID

---

## Testing Notes

- **Test Order**: Run tests 1→2→3→4→5→6 (each builds on previous knowledge)
- **Between Tests**: Close both browser windows and clear localStorage
  - DevTools → Application → Storage → localStorage → Clear All
- **Database State**: Check Prisma Studio after each test to verify data persistence
- **Timing**: Some reconnections take 1-2 seconds; be patient with overlays
- **Console Logs**: Always check browser console AND server logs simultaneously

---

## Success Criteria

All 6 tests pass when:
- ✅ Syncing overlay appears on F5 in active game
- ✅ Game state restored with correct units/step/round
- ✅ No animations replay on mid-combat reconnect
- ✅ Both players can reconnect independently to same state
- ✅ Invalid tokens clear localStorage and redirect to intro
- ✅ Completed games show error alert and redirect
- ✅ Network offline handled gracefully (no blank screen)

