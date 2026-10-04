import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { WorkspaceProvider } from "./hooks/useWorkspace.jsx";
import { TooltipProvider } from "./components/ui.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <WorkspaceProvider>
      <TooltipProvider>
        <App />
      </TooltipProvider>
    </WorkspaceProvider>
  </React.StrictMode>,
);
