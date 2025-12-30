import React from "react";

/**
 * Compact glass navbar (tabs only, minimal width per tab),
 * sits directly under the centered MISSION CONTROL title.
 * Tab text color matches panel content color via base CSS.
 */
export default function NavBar({ active="overview", onChange=()=>{} }){
  const tabs = [
    { key:"overview",  label:"Overview"  },
    { key:"connections", label:"Connections/Battery Status" },
    { key:"graphs",    label:"Graphs"    },
    { key:"telemetry", label:"Telemetry" },
    { key:"cameras",   label:"Cameras"   },
    { key:"checklist", label:"Checklist" },
    { key:"logs",      label:"Logs"      },
    { key:"settings",  label:"Settings"  },
  ];

  return (
    <div className="navbar">
      <div className="nav-tabs">
        {tabs.map(t => (
          <button
            key={t.key}
            className={`nav-tab ${active===t.key ? "active":""}`}
            onClick={()=>onChange(t.key)}
            aria-pressed={active===t.key}
            aria-label={`Show ${t.label}`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
