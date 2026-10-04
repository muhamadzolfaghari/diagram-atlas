import { createContext, useContext, useEffect, useRef, useState } from "react";
import { loadWorkspace, saveWorkspace } from "../lib/workspace.js";
const WorkspaceContext = createContext(null);
export function WorkspaceProvider({ children }) {
  const [workspace, setWorkspace] = useState(loadWorkspace),
    [saveStatus, setSaveStatus] = useState("Saved locally");
  const latest = useRef(workspace);
  latest.current = workspace;
  useEffect(() => {
    const flush = () => {
      try {
        saveWorkspace(latest.current);
      } catch {}
    };
    window.addEventListener("pagehide", flush);
    return () => {
      flush();
      window.removeEventListener("pagehide", flush);
    };
  }, []);
  useEffect(() => {
    setSaveStatus("Saving…");
    const timer = setTimeout(() => {
      try {
        saveWorkspace(workspace);
        setSaveStatus("Saved locally");
      } catch {
        setSaveStatus("Storage full · download a project backup");
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [workspace]);
  const project =
    workspace.projects.find((p) => p.id === workspace.activeProjectId) ||
    workspace.projects[0];
  const updateProject = (update) =>
    setWorkspace((w) => ({
      ...w,
      projects: w.projects.map((p) =>
        p.id === w.activeProjectId
          ? {
              ...(typeof update === "function"
                ? update(p)
                : { ...p, ...update }),
              updatedAt: new Date().toISOString(),
            }
          : p,
      ),
    }));
  const addProject = (newProject) =>
    setWorkspace((w) => ({
      ...w,
      activeProjectId: newProject.id,
      projects: [newProject, ...w.projects],
    }));
  return (
    <WorkspaceContext.Provider
      value={{
        workspace,
        project,
        saveStatus,
        updateProject,
        addProject,
        setWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}
export function useWorkspace(projectId) {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error("WorkspaceProvider is required.");
  useEffect(() => {
    if (projectId)
      context.setWorkspace((w) =>
        w.projects.some((p) => p.id === projectId) &&
        w.activeProjectId !== projectId
          ? { ...w, activeProjectId: projectId }
          : w,
      );
  }, [projectId]);
  return context;
}
