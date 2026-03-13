import type { WorkspaceTreeNode } from "../types";

interface FileTreeProps {
  nodes: WorkspaceTreeNode[];
  depth?: number;
  expandedFolderIds: string[];
  selectedFileId: string;
  onToggleFolder: (folderId: string) => void;
  onSelectFile: (fileId: string) => void;
}

export function FileTree({
  nodes,
  depth = 0,
  expandedFolderIds,
  selectedFileId,
  onToggleFolder,
  onSelectFile,
}: FileTreeProps) {
  return (
    <div className="file-tree-group">
      {nodes.map((node) => {
        const indentStyle = { paddingInlineStart: `${12 + depth * 14}px` };

        if (node.type === "folder") {
          const isExpanded = expandedFolderIds.includes(node.id);

          return (
            <div className="file-tree-node" key={node.id}>
              <button
                aria-expanded={isExpanded}
                className="file-tree-row file-tree-folder"
                onClick={() => onToggleFolder(node.id)}
                style={indentStyle}
                type="button"
              >
                <span aria-hidden="true" className="file-tree-chevron">
                  {isExpanded ? "▾" : "▸"}
                </span>
                <span aria-hidden="true" className="file-tree-dot folder-dot" />
                <span className="file-tree-label">{node.name}</span>
              </button>

              {isExpanded ? (
                <div className="file-tree-children">
                  <FileTree
                    depth={depth + 1}
                    expandedFolderIds={expandedFolderIds}
                    nodes={node.children}
                    onSelectFile={onSelectFile}
                    onToggleFolder={onToggleFolder}
                    selectedFileId={selectedFileId}
                  />
                </div>
              ) : null}
            </div>
          );
        }

        const isSelected = node.fileId === selectedFileId;

        return (
          <div className="file-tree-node" key={node.id}>
            <button
              aria-current={isSelected ? "page" : undefined}
              className="file-tree-row file-tree-file"
              data-active={isSelected ? "true" : "false"}
              onClick={() => onSelectFile(node.fileId)}
              style={indentStyle}
              type="button"
            >
              <span aria-hidden="true" className="file-tree-spacer" />
              <span aria-hidden="true" className="file-tree-dot file-dot" />
              <span className="file-tree-label">{node.name}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
