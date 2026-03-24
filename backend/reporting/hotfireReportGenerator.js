const fs = require("fs");
const path = require("path");
const ExcelJS = require("exceljs");

const PSI_COLOR_PALETTE = [
  "#38bdf8",
  "#f97316",
  "#22c55e",
  "#eab308",
  "#a78bfa",
  "#ef4444",
  "#14b8a6",
  "#f43f5e"
];

const WEIGHT_COLOR_PALETTE = ["#f59e0b", "#fb7185", "#60a5fa", "#34d399"];
const THERMO_COLOR_PALETTE = ["#ef4444", "#fb923c", "#facc15", "#84cc16"];

const DEFAULT_STATE_COLORS = {
  0: "#64748b",
  100: "#22c55e",
  200: "#38bdf8",
  250: "#f59e0b",
  290: "#f97316",
  300: "#eab308",
  310: "#facc15",
  320: "#84cc16",
  350: "#10b981",
  400: "#ef4444",
  500: "#6b7280",
  800: "#525252",
  900: "#94a3b8"
};

const MASS_FLOW_COLOR_PALETTE = ["#06b6d4", "#8b5cf6"];
const MAX_REPORT_ROWS = 20000;
const LBM_PER_KG = 2.2046226218;

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function csvSplit(line) {
  return String(line).split(",");
}

function parseCsv(csvText) {
  const lines = String(csvText)
    .split(/\r?\n/)
    .filter((line) => line.length > 0);

  if (!lines.length) return { header: [], rows: [] };
  const header = csvSplit(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i += 1) {
    const parts = csvSplit(lines[i]);
    const row = {};
    for (let c = 0; c < header.length; c += 1) {
      row[header[c]] = parts[c] ?? "";
    }
    rows.push(row);
  }

  return { header, rows };
}

function classifyColumns(header) {
  const psiColumns = [];
  const weightColumns = [];
  const thermocoupleColumns = [];

  for (const col of header) {
    if (/^pt\d+/i.test(col) || /_psi$/i.test(col) || /pressure/i.test(col)) {
      psiColumns.push(col);
      continue;
    }
    if (/^tt\d+/i.test(col) || /temp/i.test(col) || /thermocouple/i.test(col)) {
      thermocoupleColumns.push(col);
      continue;
    }
    if (/(load[_ ]?cell|thrust|weight|tank_.*lbf|_lb$|_lbf$)/i.test(col)) {
      weightColumns.push(col);
    }
  }

  return { psiColumns, weightColumns, thermocoupleColumns };
}

function buildDataRows(rows, endTimestampMs) {
  const out = [];
  let t0 = null;

  for (const row of rows) {
    const ts =
      toNumber(row.timestamp_ms) ??
      (row.timestamp_iso ? Date.parse(row.timestamp_iso) : null) ??
      (row.timestamp_local ? Date.parse(row.timestamp_local) : null);

    if (typeof ts !== "number" || !Number.isFinite(ts)) continue;
    if (typeof endTimestampMs === "number" && ts > endTimestampMs) continue;

    if (t0 === null) t0 = ts;
    row.__timestamp_ms = ts;
    row.__t_sec = (ts - t0) / 1000;
    out.push(row);
  }

  return out;
}

function decimateRows(rows, maxRows = MAX_REPORT_ROWS) {
  if (!Array.isArray(rows) || rows.length <= maxRows) return rows;
  const step = Math.ceil(rows.length / maxRows);
  const out = [];
  for (let i = 0; i < rows.length; i += step) {
    out.push(rows[i]);
  }
  if (out[out.length - 1] !== rows[rows.length - 1]) {
    out.push(rows[rows.length - 1]);
  }
  return out;
}

function buildStateChangeEvents(dataRows) {
  const out = [];
  let prev = null;
  for (const row of dataRows) {
    const code = toNumber(row.sequence_code);
    if (code === null) continue;
    if (code !== prev) {
      out.push({
        code,
        tSec: row.__t_sec
      });
      prev = code;
    }
  }
  return out;
}

function getFluidWeightLbf(row) {
  const direct = toNumber(row.tank_fluid_lbf);
  if (direct !== null) return direct;

  const total = toNumber(row.load_cell2_tank_lb);
  const tare = toNumber(row.tank_tare_lbf);
  if (total !== null && tare !== null) {
    return total - tare;
  }
  return null;
}

function findMassFlowStartTimeSec(dataRows) {
  const tareRow = dataRows.find((row) => toNumber(row.sequence_code) === 290);
  return tareRow ? tareRow.__t_sec : null;
}

function deriveMassFlowRows(dataRows, windowSec = 0.25) {
  if (!Array.isArray(dataRows) || dataRows.length < 3) return [];
  const startTimeSec = findMassFlowStartTimeSec(dataRows);

  return dataRows.map((row, index) => {
    if (typeof startTimeSec === "number" && row.__t_sec < startTimeSec) {
      return {
        t_sec: Number(row.__t_sec.toFixed(3)),
        tank_fluid_lbf: null,
        mass_flow_lbm_per_s: null,
        mass_flow_kg_per_s: null
      };
    }

    const currentWeight = getFluidWeightLbf(row);
    if (currentWeight === null) {
      return {
        t_sec: Number(row.__t_sec.toFixed(3)),
        tank_fluid_lbf: null,
        mass_flow_lbm_per_s: null,
        mass_flow_kg_per_s: null
      };
    }

    let left = index;
    while (left > 0 && row.__t_sec - dataRows[left].__t_sec < windowSec) {
      left -= 1;
    }

    let right = index;
    while (right < dataRows.length - 1 && dataRows[right].__t_sec - row.__t_sec < windowSec) {
      right += 1;
    }

    const leftWeight = getFluidWeightLbf(dataRows[left]);
    const rightWeight = getFluidWeightLbf(dataRows[right]);
    const dt = dataRows[right].__t_sec - dataRows[left].__t_sec;
    const lbmPerSec =
      leftWeight !== null &&
      rightWeight !== null &&
      dt > 0 &&
      (typeof startTimeSec !== "number" || dataRows[left].__t_sec >= startTimeSec)
        ? Number((((rightWeight - leftWeight) / dt)).toFixed(4))
        : null;

    return {
      t_sec: Number(row.__t_sec.toFixed(3)),
      tank_fluid_lbf: Number(currentWeight.toFixed(4)),
      mass_flow_lbm_per_s: lbmPerSec,
      mass_flow_kg_per_s: lbmPerSec !== null ? Number((lbmPerSec / LBM_PER_KG).toFixed(4)) : null
    };
  });
}

function summarizeMassFlow(derivedRows) {
  const values = derivedRows
    .map((row) => row.mass_flow_lbm_per_s)
    .filter((value) => typeof value === "number" && Number.isFinite(value));

  if (!values.length) {
    return {
      samples: 0,
      minLbmPerSec: null,
      maxLbmPerSec: null,
      peakAbsLbmPerSec: null,
      avgLbmPerSec: null
    };
  }

  let min = values[0];
  let max = values[0];
  let sum = 0;
  let peakAbs = values[0];

  for (const value of values) {
    if (value < min) min = value;
    if (value > max) max = value;
    if (Math.abs(value) > Math.abs(peakAbs)) peakAbs = value;
    sum += value;
  }

  const avg = sum / values.length;

  return {
    samples: values.length,
    minLbmPerSec: Number(min.toFixed(4)),
    maxLbmPerSec: Number(max.toFixed(4)),
    peakAbsLbmPerSec: Number(peakAbs.toFixed(4)),
    avgLbmPerSec: Number(avg.toFixed(4))
  };
}

function makeTrace(tValues, yValues, name, yaxis, color) {
  return {
    x: tValues,
    y: yValues,
    mode: "lines",
    name,
    line: { color, width: 2 },
    yaxis
  };
}

function buildPlotPayload(dataRows, columns, stateEvents, derivedRows = []) {
  const tValues = dataRows.map((r) => Number(r.__t_sec.toFixed(3)));

  const psiTraces = columns.psiColumns
    .map((col, i) => {
      const y = dataRows.map((r) => toNumber(r[col]));
      const hasAny = y.some((v) => typeof v === "number");
      if (!hasAny) return null;
      return makeTrace(tValues, y, col, "y", PSI_COLOR_PALETTE[i % PSI_COLOR_PALETTE.length]);
    })
    .filter(Boolean);

  const weightTraces = columns.weightColumns
    .map((col, i) => {
      const y = dataRows.map((r) => toNumber(r[col]));
      const hasAny = y.some((v) => typeof v === "number");
      if (!hasAny) return null;
      return makeTrace(tValues, y, col, "y2", WEIGHT_COLOR_PALETTE[i % WEIGHT_COLOR_PALETTE.length]);
    })
    .filter(Boolean);

  const thermoTraces = columns.thermocoupleColumns
    .map((col, i) => {
      const y = dataRows.map((r) => toNumber(r[col]));
      const hasAny = y.some((v) => typeof v === "number");
      if (!hasAny) return null;
      return makeTrace(tValues, y, col, "y", THERMO_COLOR_PALETTE[i % THERMO_COLOR_PALETTE.length]);
    })
    .filter(Boolean);

  const massFlowTraces = [
    {
      column: "mass_flow_lbm_per_s",
      name: "Mass Flow (lbm/s)",
      yaxis: "y",
      color: MASS_FLOW_COLOR_PALETTE[0]
    },
    {
      column: "mass_flow_kg_per_s",
      name: "Mass Flow (kg/s)",
      yaxis: "y2",
      color: MASS_FLOW_COLOR_PALETTE[1]
    }
  ]
    .map((trace) => {
      const y = derivedRows.map((row) => toNumber(row[trace.column]));
      const hasAny = y.some((v) => typeof v === "number");
      if (!hasAny) return null;
      return makeTrace(tValues, y, trace.name, trace.yaxis, trace.color);
    })
    .filter(Boolean);

  const stateShapes = stateEvents.map((ev) => ({
    type: "line",
    xref: "x",
    yref: "paper",
    x0: ev.tSec,
    x1: ev.tSec,
    y0: 0,
    y1: 1,
    line: {
      color: DEFAULT_STATE_COLORS[ev.code] || "#9ca3af",
      width: 1,
      dash: "dot"
    }
  }));

  const stateAnnotations = stateEvents.map((ev) => ({
    xref: "x",
    yref: "paper",
    x: ev.tSec,
    y: 1.02,
    text: `S${ev.code}`,
    showarrow: false,
    font: { size: 10, color: DEFAULT_STATE_COLORS[ev.code] || "#9ca3af" }
  }));

  return {
    masterTraces: [...psiTraces, ...weightTraces],
    thermoTraces,
    massFlowTraces,
    stateShapes,
    stateAnnotations
  };
}

function buildHtml({ title, payload }) {
  const json = JSON.stringify(payload);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <script src="https://cdn.plot.ly/plotly-2.35.2.min.js"></script>
  <style>
    body { margin: 0; font-family: Segoe UI, Arial, sans-serif; background: #0b1020; color: #e5e7eb; }
    .wrap { padding: 12px; display: grid; gap: 12px; }
    .card { background: #111827; border: 1px solid #1f2937; border-radius: 10px; padding: 8px; }
    .title { font-size: 14px; letter-spacing: 0.06em; text-transform: uppercase; color: #93c5fd; margin: 6px 8px; }
    #masterPlot, #thermoPlot, #massFlowPlot { width: 100%; height: 520px; }
    #thermoPlot { height: 320px; }
    #massFlowPlot { height: 320px; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="title">Master Graph (PSI + Pounds)</div>
      <div id="masterPlot"></div>
    </div>
    <div class="card">
      <div class="title">Thermocouples</div>
      <div id="thermoPlot"></div>
    </div>
    <div class="card">
      <div class="title">Derived Mass Flow Rate</div>
      <div id="massFlowPlot"></div>
    </div>
  </div>
  <script>
    const payload = ${json};
    const masterLayout = {
      paper_bgcolor: "#111827",
      plot_bgcolor: "#111827",
      font: { color: "#e5e7eb" },
      hovermode: "x unified",
      legend: { orientation: "h", y: 1.12 },
      margin: { t: 50, r: 70, b: 50, l: 70 },
      xaxis: { title: "Time (s)", gridcolor: "#1f2937", zeroline: false },
      yaxis: { title: "Pressure (PSI)", gridcolor: "#1f2937", zeroline: false },
      yaxis2: { title: "Pounds (lbf/lb)", overlaying: "y", side: "right", zeroline: false },
      shapes: payload.stateShapes,
      annotations: payload.stateAnnotations
    };
    Plotly.newPlot("masterPlot", payload.masterTraces, masterLayout, { responsive: true, displaylogo: false });

    const thermoLayout = {
      paper_bgcolor: "#111827",
      plot_bgcolor: "#111827",
      font: { color: "#e5e7eb" },
      hovermode: "x unified",
      margin: { t: 25, r: 40, b: 50, l: 70 },
      xaxis: { title: "Time (s)", gridcolor: "#1f2937", zeroline: false },
      yaxis: { title: "Temperature", gridcolor: "#1f2937", zeroline: false }
    };
    Plotly.newPlot("thermoPlot", payload.thermoTraces, thermoLayout, { responsive: true, displaylogo: false });

    const massFlowLayout = {
      paper_bgcolor: "#111827",
      plot_bgcolor: "#111827",
      font: { color: "#e5e7eb" },
      hovermode: "x unified",
      legend: { orientation: "h", y: 1.12 },
      margin: { t: 25, r: 70, b: 50, l: 70 },
      xaxis: { title: "Time (s)", gridcolor: "#1f2937", zeroline: false },
      yaxis: { title: "Mass Flow (lbm/s)", gridcolor: "#1f2937", zeroline: false },
      yaxis2: { title: "Mass Flow (kg/s)", overlaying: "y", side: "right", zeroline: false },
      shapes: payload.stateShapes,
      annotations: payload.stateAnnotations
    };
    Plotly.newPlot("massFlowPlot", payload.massFlowTraces, massFlowLayout, { responsive: true, displaylogo: false });
  </script>
</body>
</html>`;
}

function safeSheetName(name) {
  return String(name || "Sheet")
    .replace(/[\\/*?:\[\]]/g, "_")
    .slice(0, 31);
}

function addWorksheetFromRows(workbook, name, rows, columns) {
  const ws = workbook.addWorksheet(safeSheetName(name));
  ws.columns = columns.map((col) => ({ header: col, key: col, width: Math.min(40, Math.max(12, col.length + 2)) }));
  for (const row of rows) {
    const out = {};
    for (const col of columns) {
      out[col] = row[col] ?? "";
    }
    ws.addRow(out);
  }
  ws.views = [{ state: "frozen", ySplit: 1 }];
}

function pickAvailable(rows, candidates) {
  return candidates.filter((c) => rows.some((r) => r[c] !== undefined));
}

function formatRunFolderName(runTimestampMs, csvPath) {
  const d = new Date(runTimestampMs);
  const pad = (n) => String(n).padStart(2, "0");
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  const base = path.basename(csvPath, path.extname(csvPath));
  return `${stamp}_${base}`;
}

async function generateHotfireReport({
  csvPath,
  graphsDirectory,
  endTimestampMs = null,
  runTimestampMs = Date.now()
}) {
  const csvText = await fs.promises.readFile(csvPath, "utf8");
  const parsed = parseCsv(csvText);
  const dataRows = buildDataRows(parsed.rows, endTimestampMs);
  if (!dataRows.length) {
    throw new Error("No timestamped telemetry rows available for report generation.");
  }

  const columns = classifyColumns(parsed.header);
  const reportRows = decimateRows(dataRows, MAX_REPORT_ROWS);
  const stateEvents = buildStateChangeEvents(dataRows);
  const derivedRows = deriveMassFlowRows(reportRows);
  const plotPayload = buildPlotPayload(reportRows, columns, stateEvents, derivedRows);
  const massFlowSummary = summarizeMassFlow(derivedRows);

  const runFolder = formatRunFolderName(runTimestampMs, csvPath);
  const outputDir = path.join(graphsDirectory, runFolder);
  await fs.promises.mkdir(outputDir, { recursive: true });

  const html = buildHtml({
    title: `Hotfire Report ${runFolder}`,
    payload: plotPayload
  });
  await fs.promises.writeFile(path.join(outputDir, "master_graph.html"), html, "utf8");

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Engine Control Console";
  workbook.created = new Date();

  const rawColumns = parsed.header;
  addWorksheetFromRows(workbook, "Report Data", reportRows, rawColumns);

  const masterColumns = [
    "t_sec",
    ...pickAvailable(reportRows, columns.psiColumns),
    ...pickAvailable(reportRows, columns.weightColumns),
    ...pickAvailable(reportRows, columns.thermocoupleColumns),
    "tank_fluid_lbf",
    "mass_flow_lbm_per_s",
    "mass_flow_kg_per_s",
    "sequence_code",
    "sequence_name"
  ];
  const derivedByTime = new Map(derivedRows.map((row) => [row.t_sec, row]));
  const masterRows = reportRows.map((row) => {
    const derived = derivedByTime.get(Number(row.__t_sec.toFixed(3))) || {};
    const out = {
      t_sec: Number(row.__t_sec.toFixed(3)),
      tank_fluid_lbf: derived.tank_fluid_lbf ?? "",
      mass_flow_lbm_per_s: derived.mass_flow_lbm_per_s ?? "",
      mass_flow_kg_per_s: derived.mass_flow_kg_per_s ?? ""
    };
    for (const col of masterColumns) {
      if (col === "t_sec" || col === "tank_fluid_lbf" || col === "mass_flow_lbm_per_s" || col === "mass_flow_kg_per_s") continue;
      out[col] = row[col] ?? "";
    }
    return out;
  });
  addWorksheetFromRows(workbook, "Master Data", masterRows, masterColumns);

  for (const ptCol of columns.psiColumns.filter((c) => /^pt\d+/i.test(c))) {
    const rows = reportRows.map((row) => ({
      t_sec: Number(row.__t_sec.toFixed(3)),
      [ptCol]: row[ptCol] ?? ""
    }));
    addWorksheetFromRows(workbook, ptCol.toUpperCase(), rows, ["t_sec", ptCol]);
  }

  const weightCols = pickAvailable(reportRows, columns.weightColumns);
  if (weightCols.length) {
    const rows = reportRows.map((row) => {
      const out = { t_sec: Number(row.__t_sec.toFixed(3)) };
      for (const col of weightCols) out[col] = row[col] ?? "";
      return out;
    });
    addWorksheetFromRows(workbook, "Weights", rows, ["t_sec", ...weightCols]);
  }

  const thermoCols = pickAvailable(reportRows, columns.thermocoupleColumns);
  if (thermoCols.length) {
    const rows = reportRows.map((row) => {
      const out = { t_sec: Number(row.__t_sec.toFixed(3)) };
      for (const col of thermoCols) out[col] = row[col] ?? "";
      return out;
    });
    addWorksheetFromRows(workbook, "Thermocouples", rows, ["t_sec", ...thermoCols]);
  }

  const derivedColumns = ["t_sec", "tank_fluid_lbf", "mass_flow_lbm_per_s", "mass_flow_kg_per_s"];
  if (derivedRows.some((row) => row.mass_flow_lbm_per_s !== null || row.tank_fluid_lbf !== null)) {
    addWorksheetFromRows(workbook, "Derived", derivedRows, derivedColumns);
  }

  const sequenceRows = reportRows
    .map((row) => ({
      t_sec: Number(row.__t_sec.toFixed(3)),
      sequence_code: row.sequence_code ?? "",
      sequence_name: row.sequence_name ?? "",
      sequence_time_in_state_sec: row.sequence_time_in_state_sec ?? "",
      sequence_plc_timer_sec: row.sequence_plc_timer_sec ?? ""
    }))
    .filter((row) => row.sequence_code !== "" || row.sequence_name !== "");
  if (sequenceRows.length) {
    addWorksheetFromRows(workbook, "PLC Sequence", sequenceRows, [
      "t_sec",
      "sequence_code",
      "sequence_name",
      "sequence_time_in_state_sec",
      "sequence_plc_timer_sec"
    ]);
  }

  await workbook.xlsx.writeFile(path.join(outputDir, "data.xlsx"));

  const summary = {
    sourceCsv: csvPath,
    generatedAt: new Date().toISOString(),
    runTimestampMs,
    endTimestampMs,
    rowCount: dataRows.length,
    reportRowCount: reportRows.length,
    reportDecimated: reportRows.length !== dataRows.length,
    stateTransitions: stateEvents,
    massFlow: massFlowSummary
  };
  await fs.promises.writeFile(path.join(outputDir, "summary.json"), JSON.stringify(summary, null, 2), "utf8");

  return {
    outputDir,
    rowCount: dataRows.length
  };
}

module.exports = {
  generateHotfireReport
};
