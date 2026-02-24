import React, { useState } from "react";
import { scenarios } from "../engine/scenarioLoader";
import { calculateCombatResults } from "../engine";
import { buildAnimationQueue, buildBoomQueue } from "../engine/animationEngine";

interface TestResult {
  scenarioName: string;
  passed: boolean;
  details: string;
}

function TestHarness() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);

  const runAllScenarios = () => {
    setRunning(true);
    const newResults: TestResult[] = scenarios.map((scenario) => {
      try {
        const result = calculateCombatResults(scenario.input);
        const animQueue = buildAnimationQueue(scenario.input);
        const boomQueue = buildBoomQueue(scenario.input, animQueue);
        const isPlayer = scenario.input.isPlayer;
        const opponentNumber = ((isPlayer + 1) % 2) as 0 | 1;

        const myLifeOk = scenario.expected.myUnitsLife.every(
          (expectedLife, i) => result.newFutureUnits[isPlayer][i]?.life === expectedLife
        );
        const oppLifeOk = scenario.expected.opponentUnitsLife.every(
          (expectedLife, i) => result.newFutureUnits[opponentNumber][i]?.life === expectedLife
        );
        let flagsOk = true;
        if (scenario.expected.flagsInZone) {
          flagsOk =
            result.flags[0].inZone === scenario.expected.flagsInZone[0] &&
            result.flags[1].inZone === scenario.expected.flagsInZone[1];
        }
        const boomCountOk = boomQueue.length === scenario.expected.expectedBoomCount;

        const passed = myLifeOk && oppLifeOk && flagsOk && boomCountOk;
        let failDetails = [];
        if (!myLifeOk) failDetails.push(`my: expected [${scenario.expected.myUnitsLife}] got [${result.newFutureUnits[isPlayer].map((u) => u?.life)}]`);
        if (!oppLifeOk) failDetails.push(`opp: expected [${scenario.expected.opponentUnitsLife}] got [${result.newFutureUnits[opponentNumber].map((u) => u?.life)}]`);
        if (!boomCountOk) failDetails.push(`boomCount: expected ${scenario.expected.expectedBoomCount} got ${boomQueue.length}`);

        return {
          scenarioName: scenario.name,
          passed,
          details: passed
            ? `My units: [${result.newFutureUnits[isPlayer].map((u) => u?.life).join(",")}] Opp: [${result.newFutureUnits[opponentNumber].map((u) => u?.life).join(",")}] Booms: ${boomQueue.length}`
            : `FAIL — ${failDetails.join(" | ")}`,
        };
      } catch (e: any) {
        return { scenarioName: scenario.name, passed: false, details: `ERROR: ${e.message}` };
      }
    });
    setResults(newResults);
    setRunning(false);
  };

  const loadIntoApp = (scenarioName: string) => {
    const api = (window as any).__KOMBASS_TEST_API__;
    if (api) {
      // Store scenario in sessionStorage before navigation
      sessionStorage.setItem("KOMBASS_TEST_SCENARIO", scenarioName);
      window.location.href = "/";
    } else {
      alert("Test API not available. Start with REACT_APP_TEST_MODE=true");
    }
  };

  const passed = results.filter((r) => r.passed).length;

  return (
    <div style={{ fontFamily: "monospace", padding: "20px", maxWidth: "900px", margin: "0 auto" }}>
      <h1>Kombass Test Harness</h1>
      <p style={{ color: "#888" }}>
        Run combat scenarios in isolation without a server or second player.
      </p>

      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={runAllScenarios}
          disabled={running}
          style={{ padding: "10px 20px", marginRight: "10px", cursor: "pointer", background: "#4caf50", color: "white", border: "none", borderRadius: "4px" }}
        >
          {running ? "Running..." : "▶ Run All Scenarios"}
        </button>
        {results.length > 0 && (
          <span style={{ color: passed === results.length ? "#4caf50" : "#f44336" }}>
            {passed}/{results.length} passed
          </span>
        )}
      </div>

      <h2>Scenarios</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#222", color: "white" }}>
            <th style={{ padding: "8px", textAlign: "left" }}>Name</th>
            <th style={{ padding: "8px", textAlign: "left" }}>Description</th>
            <th style={{ padding: "8px", textAlign: "left" }}>Status</th>
            <th style={{ padding: "8px", textAlign: "left" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {scenarios.map((scenario, i) => {
            const result = results.find((r) => r.scenarioName === scenario.name);
            return (
              <tr key={scenario.name} style={{ borderBottom: "1px solid #333", background: i % 2 === 0 ? "#1a1a1a" : "#111" }}>
                <td style={{ padding: "8px", fontWeight: "bold" }}>{scenario.name}</td>
                <td style={{ padding: "8px", color: "#aaa", fontSize: "12px" }}>{scenario.description}</td>
                <td style={{ padding: "8px" }}>
                  {result ? (
                    <span style={{ color: result.passed ? "#4caf50" : "#f44336" }}>
                      {result.passed ? "✓ PASS" : "✗ FAIL"}
                      <br />
                      <span style={{ fontSize: "11px", color: "#888" }}>{result.details}</span>
                    </span>
                  ) : (
                    <span style={{ color: "#888" }}>—</span>
                  )}
                </td>
                <td style={{ padding: "8px" }}>
                  <button
                    onClick={() => loadIntoApp(scenario.name)}
                    style={{ padding: "4px 10px", cursor: "pointer", background: "#2196f3", color: "white", border: "none", borderRadius: "4px", fontSize: "12px" }}
                  >
                    Load in App
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div style={{ marginTop: "20px", color: "#888", fontSize: "12px" }}>
        <p><strong>Usage:</strong></p>
        <ul>
          <li>Click "Run All Scenarios" to test combat engine in isolation</li>
          <li>Click "Load in App" to inject a scenario into the running game (navigates to /)</li>
          <li>In browser console: <code>window.__KOMBASS_TEST_API__.getScenarios()</code></li>
          <li>In browser console: <code>window.__KOMBASS_TEST_API__.loadScenario('basic_melee')</code></li>
        </ul>
      </div>
    </div>
  );
}

export default TestHarness;
