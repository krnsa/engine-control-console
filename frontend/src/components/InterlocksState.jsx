import React from "react";

const ORDER = ["IDLE","FILL","CHILL","IGNITE","ABORT"];

/**
 * If inline=true, renders minimal chips (no card/panel).
 * Otherwise falls back to the previous card-style block.
 */
export default function InterlocksState() {
  // Interlocks UI removed per user request: render nothing.
  return null;
}
