import type { CSSProperties } from "react";
import type { TreeNode, WorkspaceData, WorkspaceSummary } from "../types";
import { ChevronIcon, FileIcon, FolderIcon } from "./Icons";

interface WorkspaceSidebarProps {
  workspace: WorkspaceData;
  workspaces: WorkspaceSummary[];
  expandedFolderIds: Set<string>;
  selectedFileId: string;
  onToggleFolder: (folderId: string) => void;
  onSelectFile: (fileId: string) => void;
  onWorkspaceChange: (workspaceId: string) => void;
}

interface TreeItemProps {
  node: TreeNode;
  depth: number;
  expandedFolderIds: Set<string>;
  selectedFileId: string;
  onToggleFolder: (folderId: string) => void;
  onSelectFile: (fileId: string) => void;
}

function TreeItem({
  node,
  depth,
  expandedFolderIds,
  selectedFileId,
  onToggleFolder,
  onSelectFile,
}: TreeItemProps) {
  const depthStyle = { "--depth": depth } as CSSProperties;

  if (node.kind === "folder") {
    const isExpanded = expandedFolderIds.has(node.id);

    return (
      <li className="tree-item" style={depthStyle}>
        <button
          className="tree-row tree-folder-row"
          type="button"
          aria-expanded={isExpanded}
          onClick={() => onToggleFolder(node.id)}
        >
          <ChevronIcon className="tree-chevron" data-expanded={isExpanded} width={16} height={16} />
          <FolderIcon className="tree-icon" width={16} height={16} />
          <span>{node.name}</span>
        </button>

        {isExpanded ? (
          <ul className="tree-list" role="group">
            {node.children.map((child) => (
              <TreeItem
                key={child.id}
                node={child}
                depth={depth + 1}
                expandedFolderIds={expandedFolderIds}
                selectedFileId={selectedFileId}
                onToggleFolder={onToggleFolder}
                onSelectFile={onSelectFile}
              />
            ))}
          </ul>
        ) : null}
      </li>
    );
  }

  const isSelected = node.fileId === selectedFileId;

  return (
    <li className="tree-item" style={depthStyle}>
      <button
        className="tree-row tree-file-row"
        type="button"
        data-selected={isSelected}
        onClick={() => onSelectFile(node.fileId)}
      >
        <span className="tree-chevron-spacer" />
        <FileIcon className="tree-icon" width={16} height={16} />
        <span>{node.name}</span>
      </button>
    </li>
  );
}

export function WorkspaceSidebar({
  workspace,
  workspaces,
  expandedFolderIds,
  selectedFileId,
  onToggleFolder,
  onSelectFile,
  onWorkspaceChange,
}: WorkspaceSidebarProps) {
  return (
    <aside className="pane pane-sidebar" aria-label="Workspace navigation">
      <div className="pane-scroll">
        <div className="sidebar-header">
          <span className="pane-eyebrow">Workspace</span>
          <h1>{workspace.name}</h1>
          <p>{workspace.description}</p>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-heading">
            <span>Vault</span>
            <span className="sidebar-count">{Object.keys(workspace.documents).length}</span>
          </div>

          <ul className="tree-list" role="tree" aria-label="Workspace file tree">
            {workspace.tree.map((node) => (
              <TreeItem
                key={node.id}
                node={node}
                depth={0}
                expandedFolderIds={expandedFolderIds}
                selectedFileId={selectedFileId}
                onToggleFolder={onToggleFolder}
                onSelectFile={onSelectFile}
              />
            ))}
          </ul>
        </div>
      </div>

      <div className="workspace-switcher">
        <label className="workspace-switcher-label" htmlFor="workspace-switcher-select">
          Active workspace
        </label>
        <div className="workspace-switcher-field">
          <span
            className="workspace-accent"
            style={{ backgroundColor: workspace.accent }}
            aria-hidden="true"
          />
          <select
            id="workspace-switcher-select"
            value={workspace.id}
            onChange={(event) => onWorkspaceChange(event.target.value)}
          >
            {workspaces.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </aside>
  );
}
