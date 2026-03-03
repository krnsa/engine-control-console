/*********************** Author: Aditya Sharma ************************************/
/************************  PROJECT GHOST  ****************************************/
/******************** PLC READING - LOGIC FILE  *****************************/ 

const net = require("net");
const { engineState } = require("../state/engineState");
const { SYSTEM_CONFIG } = require("../config/system.config");

function buildReadRequest(transactionId, unitId, functionCode, startAddress, quantity) {
  const buf = Buffer.alloc(12);
  buf.writeUInt16BE(transactionId & 0xffff, 0); // Transaction ID
  buf.writeUInt16BE(0, 2); // Protocol ID (Modbus TCP = 0)
  buf.writeUInt16BE(6, 4); // Remaining bytes
  buf.writeUInt8(unitId & 0xff, 6); // Unit ID
  buf.writeUInt8(functionCode & 0xff, 7); // 0x03 holding, 0x04 input
  buf.writeUInt16BE(startAddress & 0xffff, 8);
  buf.writeUInt16BE(quantity & 0xffff, 10);
  return buf;
}

function parseReadResponse(buf, expectedFunctionCode, expectedQuantity) {
  if (!Buffer.isBuffer(buf) || buf.length < 9) {
    return null;
  }

  const functionCode = buf.readUInt8(7);
  if (functionCode !== expectedFunctionCode) {
    return null;
  }

  const byteCount = buf.readUInt8(8);
  const expectedByteCount = expectedQuantity * 2;
  if (byteCount !== expectedByteCount || buf.length < 9 + byteCount) {
    return null;
  }

  const out = [];
  for (let i = 0; i < expectedQuantity; i++) {
    out.push(buf.readUInt16BE(9 + i * 2));
  }
  return out;
}

function parseBitReadResponse(buf, expectedFunctionCode, expectedQuantity) {
  if (!Buffer.isBuffer(buf) || buf.length < 9) return null;
  const functionCode = buf.readUInt8(7);
  if (functionCode !== expectedFunctionCode) return null;

  const byteCount = buf.readUInt8(8);
  const expectedByteCount = Math.ceil(expectedQuantity / 8);
  if (byteCount < expectedByteCount || buf.length < 9 + byteCount) return null;

  const out = [];
  for (let i = 0; i < expectedQuantity; i++) {
    const byteIndex = Math.floor(i / 8);
    const bitIndex = i % 8;
    const v = buf.readUInt8(9 + byteIndex);
    out.push(((v >> bitIndex) & 0x01) === 1);
  }
  return out;
}

function readRegistersOnce({
  host,
  port,
  unitId,
  functionCode,
  startAddress,
  quantity,
  timeoutMs = 1000,
  transactionId = 1
}) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let settled = false;
    let chunks = Buffer.alloc(0);

    const finish = (err, value) => {
      if (settled) return;
      settled = true;
      try {
        socket.destroy();
      } catch {
        // no-op
      }
      if (err) reject(err);
      else resolve(value);
    };

    socket.setTimeout(timeoutMs);

    socket.on("connect", () => {
      const req = buildReadRequest(transactionId, unitId, functionCode, startAddress, quantity);
      socket.write(req);
    });

    socket.on("data", (chunk) => {
      chunks = Buffer.concat([chunks, chunk]);
      const parsed = parseReadResponse(chunks, functionCode, quantity);
      if (parsed) {
        finish(null, parsed);
      }
    });

    socket.on("timeout", () => finish(new Error("PLC read timeout")));
    socket.on("error", (err) => finish(err));
    socket.on("close", () => {
      if (!settled) finish(new Error("PLC socket closed before response"));
    });

    socket.connect({ host, port });
  });
}

function readBitsOnce({
  host,
  port,
  unitId,
  functionCode,
  startAddress,
  quantity,
  timeoutMs = 1000,
  transactionId = 1
}) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let settled = false;
    let chunks = Buffer.alloc(0);

    const finish = (err, value) => {
      if (settled) return;
      settled = true;
      try {
        socket.destroy();
      } catch {
        // no-op
      }
      if (err) reject(err);
      else resolve(value);
    };

    socket.setTimeout(timeoutMs);

    socket.on("connect", () => {
      const req = buildReadRequest(transactionId, unitId, functionCode, startAddress, quantity);
      socket.write(req);
    });

    socket.on("data", (chunk) => {
      chunks = Buffer.concat([chunks, chunk]);
      const parsed = parseBitReadResponse(chunks, functionCode, quantity);
      if (parsed) {
        finish(null, parsed);
      }
    });

    socket.on("timeout", () => finish(new Error("PLC bit read timeout")));
    socket.on("error", (err) => finish(err));
    socket.on("close", () => {
      if (!settled) finish(new Error("PLC socket closed before bit response"));
    });

    socket.connect({ host, port });
  });
}

function stateName(code, map) {
  if (typeof code !== "number") return "Unknown";
  return map?.[code] || "Unknown";
}

function toSigned16(value) {
  const v = Number(value) & 0xffff;
  return v > 0x7fff ? v - 0x10000 : v;
}


function decodeFloat32FromRegisters(registers, wordOrder = "ABCD") {  /* Big and Little Indian Check Complete */
  if (!Array.isArray(registers) || registers.length < 2) return null;
  const r0 = registers[0] & 0xffff;
  const r1 = registers[1] & 0xffff;
  const a = (r0 >> 8) & 0xff;
  const b = r0 & 0xff;
  const c = (r1 >> 8) & 0xff;
  const d = r1 & 0xff;
  const order = String(wordOrder || "ABCD").toUpperCase();   /* Muy Muy Bueno */

  let bytes = [a, b, c, d];
  if (order === "CDAB") bytes = [c, d, a, b];
  else if (order === "BADC") bytes = [b, a, d, c];
  else if (order === "DCBA") bytes = [d, c, b, a];

  const buf = Buffer.from(bytes);
  const value = buf.readFloatBE(0);
  return Number.isFinite(value) ? value : null;
}

function startPlcSequencePoller() {
  const cfg = SYSTEM_CONFIG.plcSequence || {};
  if (!cfg.enabled) {
    console.log("[PLC] Sequence poller disabled in config"); // PLC Sequence Poller Disabled - Aditya Verfied - Muy Bueno Papi
    return () => {};
  }

  let txId = 1;
  let timer = null;
  let stateStartTs = null;
  let lastStateCode = null;
  let lastWarnTs = 0;
  let lastDebugTs = 0;
  const hasFixedOffset = typeof cfg.fixedRegisterOffset === "number";
  let addrOffset = hasFixedOffset ? cfg.fixedRegisterOffset : 0; // auto-detect 0-based vs 1-based register addressing

  const configuredFnCode = cfg.registerType === "input" ? 0x04 : 0x03;
  const fallbackFnCode = configuredFnCode === 0x04 ? 0x03 : 0x04;
  const timeoutMs = Math.max(100, cfg.timeoutMs || 1000);
  const debugNextRegister = cfg.debugReadNextRegister !== false;
  const debugAddressing = cfg.debugAddressing === true;
  const debugDumpRegisters = cfg.debugDumpRegisters === true;
  const debugDumpStartRegister = typeof cfg.debugDumpStartRegister === "number" ? cfg.debugDumpStartRegister : 0;
  const debugDumpCount = Math.max(1, Math.min(64, typeof cfg.debugDumpCount === "number" ? cfg.debugDumpCount : 8));

  async function readWithFallback(startAddress, quantity) {
    const attempts = hasFixedOffset
      ? [
          { fn: configuredFnCode, addr: startAddress + addrOffset },
          { fn: fallbackFnCode, addr: startAddress + addrOffset }
        ]
      : [
          { fn: configuredFnCode, addr: startAddress + addrOffset },
          { fn: fallbackFnCode, addr: startAddress + addrOffset },
          // Try opposite address base if first attempts fail.
          { fn: configuredFnCode, addr: startAddress + (addrOffset === 0 ? 1 : 0) },
          { fn: fallbackFnCode, addr: startAddress + (addrOffset === 0 ? 1 : 0) }
        ];

    let lastErr = null;
    for (const a of attempts) {
      try {
        const values = await readRegistersOnce({
          host: cfg.host,
          port: cfg.port || 502,
          unitId: cfg.unitId || 1,
          functionCode: a.fn,
          startAddress: a.addr,
          quantity,
          timeoutMs,
          transactionId: txId++
        });

        const detectedOffset = a.addr - startAddress;
        if (!hasFixedOffset && detectedOffset !== addrOffset) {
          addrOffset = detectedOffset;
          if (debugAddressing) {
            console.log(`[PLC] Using register offset ${addrOffset} (auto-detected)`);
          }
        }
        return values;
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr || new Error("PLC register read failed");
  }

  function discreteAddressFromDoc(addr) {
    // Accept raw protocol offsets directly; also accept 1xxxx documented addresses.
    // 10001 -> offset 0
    if (typeof addr !== "number") return 0;
    return addr >= 10001 ? addr - 10001 : addr;
  }

  async function readDiscreteInputsWithFallback(startAddress, quantity) {
    const baseAddress = discreteAddressFromDoc(startAddress);
    const attempts = hasFixedOffset
      ? [{ fn: 0x02, addr: baseAddress + addrOffset }]
      : [{ fn: 0x02, addr: baseAddress + addrOffset }, { fn: 0x02, addr: baseAddress + (addrOffset === 0 ? 1 : 0) }];

    let lastErr = null;
    for (const a of attempts) {
      try {
        const values = await readBitsOnce({
          host: cfg.host,
          port: cfg.port || 502,
          unitId: cfg.unitId || 1,
          functionCode: a.fn,
          startAddress: a.addr,
          quantity,
          timeoutMs,
          transactionId: txId++
        });

        const detectedOffset = a.addr - baseAddress;
        if (!hasFixedOffset && detectedOffset !== addrOffset) {
          addrOffset = detectedOffset;
          if (debugAddressing) {
            console.log(`[PLC] Using bit offset ${addrOffset} (auto-detected)`);
          }
        }
        return values;
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr || new Error("PLC discrete input read failed");
  }

  const poll = async () => {
    try {
      const now = Date.now();
      const stateValues = await readWithFallback(cfg.stateRegister || 0, 1);
      const currentState = stateValues?.[0];
      const effectiveStateRegister = (cfg.stateRegister || 0) + addrOffset;
      const nowDebug = Date.now();
      if (!debugDumpRegisters && nowDebug - lastDebugTs >= 1000) {
        // console.log(`[PLC][REG] stateReg=${effectiveStateRegister} value=${currentState}`);
        lastDebugTs = nowDebug;
      }

      if (debugNextRegister && !debugDumpRegisters) {
        try {
          const nextRegister = (cfg.stateRegister || 0) + 1;
          const nextValues = await readWithFallback(nextRegister, 1);
          const nextNextRegister = (cfg.stateRegister || 0) + 2;
          const nextNextValues = await readWithFallback(nextNextRegister, 1);
          const nowNextDebug = Date.now();
          if (nowNextDebug - lastDebugTs >= 1000) {
            const nextRaw = nextValues?.[0];
            const nextSigned = typeof nextRaw === "number" ? toSigned16(nextRaw) : null;
            const effectiveNextRegister = nextRegister + addrOffset;
            const nextNextRaw = nextNextValues?.[0];
            const nextNextSigned = typeof nextNextRaw === "number" ? toSigned16(nextNextRaw) : null;
            const effectiveNextNextRegister = nextNextRegister + addrOffset;
            // console.log(`[PLC][REG] stateReg=${effectiveNextRegister} value=${nextSigned}`);
            // console.log(`[PLC][REG] stateReg=${effectiveNextNextRegister} value=${nextNextSigned}`);
            // console.log(
            //   `[PLC][DBG] stateReg=${cfg.stateRegister || 0} value=${currentState} | nextReg=${nextRegister} raw=${nextRaw} signed=${nextSigned} | nextReg2=${nextNextRegister} raw=${nextNextRaw} signed=${nextNextSigned}` // Second Register - GUI
            // );
            lastDebugTs = nowNextDebug;
          }
        } catch {
          // keep poll alive even if debug read fails
        }
      }

      if (debugDumpRegisters) {
        try {
          const dumpValues = await readWithFallback(debugDumpStartRegister, debugDumpCount);
          const nowDumpDebug = Date.now();
          if (nowDumpDebug - lastDebugTs >= 1000) {
            const signedPairs = dumpValues
              .map((v, idx) => {
                const reg = debugDumpStartRegister + addrOffset + idx;
                return `${reg}:${toSigned16(v)}`;
              })
              .join(" | ");
            // console.log(
            //   `[PLC][REGS] ${signedPairs}`
            // );
            lastDebugTs = nowDumpDebug;
          }
        } catch {
          // keep poll alive if debug dump read fails
        }
      }

      let plcTimerSec = null;
      if (typeof cfg.timerRegister === "number") {
        try {
          const timerValues = await readWithFallback(cfg.timerRegister, 1);
          if (typeof timerValues?.[0] === "number") {
            plcTimerSec = cfg.timerSigned ? toSigned16(timerValues[0]) : timerValues[0];
          } else {
            plcTimerSec = null;
          }
        } catch {
          // Timer register optional; keep state updates alive even if timer read fails.
          plcTimerSec = null;
        }
      }

      if (currentState !== lastStateCode) {
        lastStateCode = currentState;
        stateStartTs = now;
      }

      const elapsedSec =
        typeof stateStartTs === "number" ? Math.max(0, (now - stateStartTs) / 1000) : null;

      engineState.data.system.sequence = {
        online: true,
        source: "modbus-tcp",
        code: currentState,
        name: stateName(currentState, cfg.states),
        timeInStateSec: elapsedSec,
        plcTimerSec: typeof plcTimerSec === "number" ? plcTimerSec : null,
        registerOffset: addrOffset,
        lastRead: now
      };

      const tankCfg = cfg.tankModel || {};
      if (tankCfg.enabled) {
        const prev = engineState.data.system.tank || {};
        let tareWeightLbf = prev.tareWeightLbf ?? null;
        let fullWeightLbf = prev.fullWeightLbf ?? null;

        const signed = tankCfg.signed !== false;
        const divisor = Math.max(1, Number(tankCfg.scaleDivisor) || 100);
        const maxMultiplier = Math.max(0.1, Number(tankCfg.maxMultiplier) || 1.2);

        if (typeof tankCfg.tareRegister === "number") {
          try {
            const regs = await readWithFallback(tankCfg.tareRegister, 1);
            const raw = regs?.[0];
            const normalized = typeof raw === "number" ? (signed ? toSigned16(raw) : raw) : null;
            tareWeightLbf = typeof normalized === "number" ? normalized / divisor : tareWeightLbf;
          } catch {
            // keep last known
          }
        }

        if (typeof tankCfg.fullRegister === "number") {
          try {
            const regs = await readWithFallback(tankCfg.fullRegister, 1);
            const raw = regs?.[0];
            const normalized = typeof raw === "number" ? (signed ? toSigned16(raw) : raw) : null;
            fullWeightLbf = typeof normalized === "number" ? normalized / divisor : fullWeightLbf;
          } catch {
            // keep last known
          }
        }

        const fluidBaseMax =
          typeof fullWeightLbf === "number" && typeof tareWeightLbf === "number"
            ? Math.max(0, fullWeightLbf - tareWeightLbf)
            : null;
        const fluidMaxLbf = typeof fluidBaseMax === "number" ? fluidBaseMax * maxMultiplier : prev.fluidMaxLbf ?? null;

        const totalLoad = engineState.data.weight?.loadCell2;
        const fluidWeightLbf =
          typeof totalLoad === "number" && typeof tareWeightLbf === "number"
            ? Math.max(0, totalLoad - tareWeightLbf)
            : prev.fluidWeightLbf ?? null;

        engineState.data.system.tank = {
          source: "modbus-tcp",
          tareWeightLbf,
          fullWeightLbf,
          fluidWeightLbf,
          fluidMaxLbf,
          lastRead: now
        };
      }

      const ignitorCfg = cfg.ignitorContinuity || {};
      if (ignitorCfg.enabled) {
        const prevIgnitors = engineState.data.system.ignitors || {};
        let ignitor1Connected = prevIgnitors.ignitor1Connected ?? null;
        let ignitor2Connected = prevIgnitors.ignitor2Connected ?? null;
        const trueMeansDisconnected = ignitorCfg.trueMeansDisconnected !== false;

        const toConnected = (rawRegisterValue) => {
          if (typeof rawRegisterValue !== "number") return null;
          const rawBool = (rawRegisterValue & 0xffff) !== 0;
          const disconnected = trueMeansDisconnected ? rawBool : !rawBool;
          return !disconnected;
        };

        if (typeof ignitorCfg.ignitor1Register === "number") {
          try {
            const bits = await readDiscreteInputsWithFallback(ignitorCfg.ignitor1Register, 1);
            ignitor1Connected = toConnected(bits?.[0] ? 1 : 0);
          } catch {
            // keep last known if optional read fails
          }
        }

        if (typeof ignitorCfg.ignitor2Register === "number") {
          try {
            const bits = await readDiscreteInputsWithFallback(ignitorCfg.ignitor2Register, 1);
            ignitor2Connected = toConnected(bits?.[0] ? 1 : 0);
          } catch {
            // keep last known if optional read fails
          }
        }

        engineState.data.system.ignitors = {
          source: "modbus-tcp",
          ignitor1Connected,
          ignitor2Connected,
          lastRead: now
        };

        const bothKnown =
          typeof ignitor1Connected === "boolean" && typeof ignitor2Connected === "boolean";
        engineState.data.system.cutdown = {
          ...(engineState.data.system.cutdown || {}),
          continuity: bothKnown ? ignitor1Connected && ignitor2Connected : null,
          lastUpdate: now
        };
      }
    } catch (err) {
      const now = Date.now();
      if (now - lastWarnTs > 5000) {
        console.warn(`[PLC] Sequence read failed: ${err.message}`);
        lastWarnTs = now;
      }
      engineState.data.system.sequence = {
        ...(engineState.data.system.sequence || {}),
        online: false,
        source: "modbus-tcp",
        lastError: err.message,
        lastRead: Date.now()
      };
    }
  };

  timer = setInterval(poll, Math.max(100, cfg.pollMs || 500));
  poll();
  console.log(`[PLC] Sequence poller started (${cfg.host}:${cfg.port || 502})`);

  return () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

module.exports = { startPlcSequencePoller };
