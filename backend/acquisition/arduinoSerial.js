/**
 * Arduino serial reader
 * Streams serial lines into the engine event stream.
 */

const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const { engineState } = require("../state/engineState");
const { SYSTEM_CONFIG } = require("../config/system.config");

function parseArduinoLine(line) {
  const valveMatch = line.match(/^Valve\s+(\d+)\s+->\s+(OPEN|CLOSED)/i);
  if (valveMatch) {
    return {
      message: `Valve ${valveMatch[1]} -> ${valveMatch[2].toUpperCase()}`,
      fields: { valve: Number(valveMatch[1]), state: valveMatch[2].toUpperCase() }
    };
  }

  const feedbackMatch = line.match(/^Feedback changed!\s*(\d+)\s+feedback:\s+(TRUE|FALSE)/i);
  if (feedbackMatch) {
    return {
      message: `Feedback changed! ${feedbackMatch[1]} feedback: ${feedbackMatch[2].toUpperCase()}`,
      fields: {
        valve: Number(feedbackMatch[1]),
        feedback: feedbackMatch[2].toUpperCase()
      }
    };
  }

  return { message: line, fields: null };
}

function startArduinoSerial() {
  const { port, baudRate, maxEvents } = SYSTEM_CONFIG.arduinoSerial || {};
  if (!port) {
    console.log("[ARDUINO] Serial disabled (no port configured)");
    return;
  }

  const serial = new SerialPort({ path: port, baudRate, autoOpen: false });
  const parser = serial.pipe(new ReadlineParser({ delimiter: "\n" }));

  serial.open((err) => {
    if (err) {
      console.error(`[ARDUINO] Failed to open ${port}: ${err.message}`);
      return;
    }
    console.log(`[ARDUINO] Listening on ${port} @ ${baudRate} baud`);
    engineState.addEvent({
      message: `Arduino serial connected on ${port}`,
      source: "arduino",
      level: "info",
      max: maxEvents
    });
  });

  parser.on("data", (raw) => {
    const line = String(raw || "").trim();
    if (!line) return;
    const parsed = parseArduinoLine(line);
    engineState.addEvent({
      message: parsed.message,
      source: "arduino",
      level: "info",
      fields: parsed.fields,
      max: maxEvents
    });
  });

  serial.on("error", (err) => {
    console.error(`[ARDUINO] Serial error: ${err.message}`);
    engineState.addEvent({
      message: `Arduino serial error: ${err.message}`,
      source: "arduino",
      level: "error",
      max: maxEvents
    });
  });

  serial.on("close", () => {
    console.warn("[ARDUINO] Serial disconnected");
    engineState.addEvent({
      message: "Arduino serial disconnected",
      source: "arduino",
      level: "warn",
      max: maxEvents
    });
  });
}

module.exports = { startArduinoSerial };
