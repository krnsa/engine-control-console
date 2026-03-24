const { generateHotfireReport } = require("./hotfireReportGenerator");
const { engineState } = require("../state/engineState");

function createHotfireReportTrigger({
  graphsDirectory,
  terminalStates = [500, 800, 900],
  activeStates = [200, 250, 290, 300, 310, 320, 350, 400],
  minRowsForReport = 10
}) {
  let lastSequenceCode = null;
  let sawActiveSequence = false;
  let generationInFlight = false;
  let lastGeneratedAtMs = null;

  const terminalSet = new Set(terminalStates);
  const activeSet = new Set(activeStates);

  async function runGeneration({ csvPath, timestampMs }) {
    if (generationInFlight) return;
    generationInFlight = true;
    try {
      const result = await generateHotfireReport({ 
        csvPath,
        graphsDirectory,
        endTimestampMs: timestampMs,
        runTimestampMs: timestampMs
      });

      if (result.rowCount < minRowsForReport) {
        return;
      }
      lastGeneratedAtMs = timestampMs;
      console.log(`[REPORT] Hotfire report generated at ${result.outputDir}`);
      engineState.addEvent({
        source: "reporting",
        level: "info",
        message: `Hotfire report ready: ${result.outputDir}`,
        fields: { outputDir: result.outputDir, rowCount: result.rowCount }
      });
    } catch (err) {
      console.error(`[REPORT] Failed to generate hotfire report: ${err.message}`);
      engineState.addEvent({
        source: "reporting",
        level: "error",
        message: `Hotfire report failed: ${err.message}`,
        fields: { csvPath, timestampMs }
      });
    } finally {
      generationInFlight = false;
    }
  }

  function observe(state, csvPath) {
    if (!state || !csvPath || !graphsDirectory) return;

    const sequence = state.system?.sequence || {};
    const currentCode = typeof sequence.code === "number" ? sequence.code : null;
    const ts = typeof state.timestamp === "number" ? state.timestamp : Date.now();

    if (currentCode !== null && activeSet.has(currentCode)) {
      sawActiveSequence = true;
    }

    const changed = currentCode !== lastSequenceCode;
    if (!changed) return;

    const previousCode = lastSequenceCode;
    lastSequenceCode = currentCode;

    if (!sawActiveSequence) return;
    if (currentCode === null || !terminalSet.has(currentCode)) return;

    // Prevent duplicate generation at the same terminal timestamp.
    if (typeof lastGeneratedAtMs === "number" && Math.abs(ts - lastGeneratedAtMs) < 1000) {
      return;
    }

    // Avoid generating on startup if sequence is already terminal.
    if (previousCode === null) return;

    sawActiveSequence = false;
    runGeneration({ csvPath, timestampMs: ts });
  }

  return { observe };
}

module.exports = {
  createHotfireReportTrigger
};
