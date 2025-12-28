'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, CheckSquare, Square, Eye } from 'lucide-react';

interface JSONFieldSelectorProps {
  jsonData: any;
  onFieldsSelected: (fields: string[]) => void;
  selectedFields?: string[];
}

interface TreeNode {
  key: string;
  value: any;
  path: string;
  isExpanded: boolean;
  isSelected: boolean;
  type: string;
}

export default function JSONFieldSelector({
  jsonData,
  onFieldsSelected,
  selectedFields = [],
}: JSONFieldSelectorProps) {
  const [nodes, setNodes] = useState<Map<string, TreeNode>>(new Map());
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedFields));

  useEffect(() => {
    if (jsonData) {
      const nodeMap = new Map<string, TreeNode>();
      buildTree(jsonData, '', nodeMap);
      setNodes(nodeMap);
    }
  }, [jsonData]);

  useEffect(() => {
    setSelected(new Set(selectedFields));
  }, [selectedFields]);

  const buildTree = (obj: any, path: string, nodeMap: Map<string, TreeNode>) => {
    if (obj === null || obj === undefined) return;

    if (typeof obj === 'object' && !Array.isArray(obj)) {
      Object.entries(obj).forEach(([key, value]) => {
        const currentPath = path ? `${path}.${key}` : key;
        const type = Array.isArray(value) ? 'array' : typeof value === 'object' && value !== null ? 'object' : typeof value;
        
        nodeMap.set(currentPath, {
          key,
          value,
          path: currentPath,
          isExpanded: false,
          isSelected: selectedFields.includes(currentPath),
          type,
        });

        if (typeof value === 'object' && value !== null) {
          buildTree(value, currentPath, nodeMap);
        }
      });
    } else if (Array.isArray(obj) && obj.length > 0) {
      // Show first item in array as example
      buildTree(obj[0], `${path}[0]`, nodeMap);
    }
  };

  const toggleExpand = (path: string) => {
    const node = nodes.get(path);
    if (node) {
      node.isExpanded = !node.isExpanded;
      setNodes(new Map(nodes));
    }
  };

  const toggleSelect = (path: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(path)) {
      newSelected.delete(path);
    } else {
      newSelected.add(path);
    }
    setSelected(newSelected);
    onFieldsSelected(Array.from(newSelected));
  };

  const renderValue = (value: any, type: string) => {
    if (type === 'object' || type === 'array') return null;
    
    const valueStr = String(value);
    const truncated = valueStr.length > 50 ? valueStr.slice(0, 50) + '...' : valueStr;
    
    return (
      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
        = {truncated}
      </span>
    );
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'string':
        return 'text-green-600 dark:text-green-400';
      case 'number':
        return 'text-blue-600 dark:text-blue-400';
      case 'boolean':
        return 'text-purple-600 dark:text-purple-400';
      case 'object':
        return 'text-orange-600 dark:text-orange-400';
      case 'array':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const renderNode = (path: string, depth: number = 0) => {
    const node = nodes.get(path);
    if (!node) return null;

    const isExpandable = node.type === 'object' || node.type === 'array';
    const isSelectable = node.type !== 'object' && node.type !== 'array';

    return (
      <div key={path}>
        <div
          className="flex items-center gap-2 py-1.5 px-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded group"
          style={{ paddingLeft: `${depth * 20 + 8}px` }}
        >
          {/* Expand/Collapse Button */}
          {isExpandable ? (
            <button
              onClick={() => toggleExpand(path)}
              className="flex-shrink-0"
            >
              {node.isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </button>
          ) : (
            <div className="w-4" />
          )}

          {/* Select Checkbox (only for leaf nodes) */}
          {isSelectable ? (
            <button
              onClick={() => toggleSelect(path)}
              className="flex-shrink-0"
            >
              {selected.has(path) ? (
                <CheckSquare className="w-4 h-4 text-blue-500" />
              ) : (
                <Square className="w-4 h-4 text-gray-400" />
              )}
            </button>
          ) : (
            <div className="w-4" />
          )}

          {/* Key Name */}
          <span className="font-mono text-sm text-gray-800 dark:text-gray-200">
            {node.key}
          </span>

          {/* Type Badge */}
          <span
            className={`text-xs font-semibold px-1.5 py-0.5 rounded ${getTypeColor(
              node.type
            )}`}
          >
            {node.type}
          </span>

          {/* Value Preview */}
          {renderValue(node.value, node.type)}
        </div>

        {/* Children */}
        {node.isExpanded &&
          Array.from(nodes.entries())
            .filter(([childPath]) => {
              const parentPath = childPath.substring(0, childPath.lastIndexOf('.'));
              return parentPath === path;
            })
            .map(([childPath]) => renderNode(childPath, depth + 1))}
      </div>
    );
  };

  if (!jsonData) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No data to display. Connect to an API to see the response structure.
      </div>
    );
  }

  const rootPaths = Array.from(nodes.keys()).filter((path) => !path.includes('.') && !path.includes('['));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Select Fields to Display
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {selected.size} field{selected.size !== 1 ? 's' : ''} selected
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const allLeafs = Array.from(nodes.values())
                .filter((n) => n.type !== 'object' && n.type !== 'array')
                .map((n) => n.path);
              setSelected(new Set(allLeafs));
              onFieldsSelected(allLeafs);
            }}
            className="text-xs px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50"
          >
            Select All
          </button>
          <button
            onClick={() => {
              setSelected(new Set());
              onFieldsSelected([]);
            }}
            className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* JSON Tree */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 max-h-96 overflow-y-auto">
        <div className="p-2">
          {rootPaths.map((path) => renderNode(path, 0))}
        </div>
      </div>

      {/* Selected Fields Preview */}
      {selected.size > 0 && (
        <div className="border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
              Selected Fields Preview
            </h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.from(selected).map((field) => (
              <span
                key={field}
                className="inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 rounded text-xs font-mono text-gray-700 dark:text-gray-300"
              >
                {field}
                <button
                  onClick={() => toggleSelect(field)}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
