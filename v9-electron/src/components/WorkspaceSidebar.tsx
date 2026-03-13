import { FileTree } from "./FileTree";
import type { Workspace, WorkspaceTreeNode } from "../types";

interface WorkspaceSidebarProps {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  activeWorkspaceName: string;
  activeWorkspaceDescription: string;
  tree: WorkspaceTreeNode[];
  selectedFileId: string;
  expandedFolderIds: string[];
  desktopMeta: {
    appVersion: string;
    electronVersion: string;
    platform: string;
  };
  onWorkspaceChange: (workspaceId: string) => void;
  onToggleFolder: (folderId: string) => void;
  onSelectFile: (fileId: string) => void;
}

export function WorkspaceSidebar({
  workspaces,
  activeWorkspaceId,
  activeWorkspaceName,
  activeWorkspaceDescription,
  tree,
  selectedFileId,
  expandedFolderIds,
  desktopMeta,
  onWorkspaceChange,
  onToggleFolder,
  onSelectFile,
}: WorkspaceSidebarProps) {
  return (
    <aside
      aria-label="Workspace navigation"
      className="sidebar sidebar-left"
    >
      <div className="sidebar-header-block">
        <p className="sidebar-kicker">Mohio v9</p>
        <h1>{activeWorkspaceName}</h1>
        <p className="sidebar-copy">{activeWorkspaceDescription}</p>
      </div>

      <div className="sidebar-tree-block">
        <div className="sidebar-section-heading">
          <span>Workspace tree</span>
          <span className="sidebar-section-meta">Mock data</span>
        </div>

        <FileTree
          expandedFolderIds={expandedFolderIds}
          nodes={tree}
          onSelectFile={onSelectFile}
          onToggleFolder={onToggleFolder}
          selectedFileId={selectedFileId}
        />
      </div>

      <div className="sidebar-footer">
        <label className="sidebar-select-label" htmlFor="workspace-select">
          Workspace
        </label>
        <select
          className="workspace-select"
          id="workspace-select"
          onChange={(event) => onWorkspaceChange(event.target.value)}
          value={activeWorkspaceId}
        >
          {workspaces.map((workspace) => (
            <option key={workspace.id} value={workspace.id}>
              {workspace.name}
            </option>
          ))}
        </select>

        <p className="sidebar-meta">
          Electron {desktopMeta.electronVersion} on {desktopMeta.platform}
        </p>
      </div>
    </aside>
  );
}
