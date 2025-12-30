import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";          // global + glass variables
import "./App.css";            // layout + component styles
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

