import { useState } from 'react';
import { render, Box, Text, useApp, useInput } from 'ink';

type ServiceNode = {
  name: string;
  checked: boolean;
  children?: ServiceNode[];
};

type FlatService = {
  name: string;
  level: number;
  path: number[];
  isParent: boolean;
  expanded: boolean;
};

/**
 * Flatten nested services into a list of names.
 * If a parent is checked, all children are included.
 */
function flattenServices(services: ServiceNode[]): string[] {
  const result: string[] = [];

  function traverse(node: ServiceNode, parentChecked: boolean) {
    const effectiveChecked = parentChecked || node.checked;

    if (effectiveChecked) {
      result.push(node.name);
    }

    if (node.children) {
      for (const child of node.children) {
        traverse(child, effectiveChecked);
      }
    }
  }

  for (const svc of services) {
    traverse(svc, false);
  }

  return result;
}

/**
 * Convert nested services to flat list for display
 */
function servicesToFlatList(services: ServiceNode[], expandedPaths: Set<string>): FlatService[] {
  const result: FlatService[] = [];

  function traverse(nodes: ServiceNode[], level: number, parentPath: number[]) {
    nodes.forEach((node, index) => {
      const currentPath = [...parentPath, index];
      const pathKey = currentPath.join('-');
      const isParent = Boolean(node.children && node.children.length > 0);
      const expanded = expandedPaths.has(pathKey);

      result.push({
        name: node.name,
        level,
        path: currentPath,
        isParent,
        expanded,
      });

      if (isParent && expanded && node.children) {
        traverse(node.children, level + 1, currentPath);
      }
    });
  }

  traverse(services, 0, []);
  return result;
}

const initialServices: ServiceNode[] = [
  {
    name: 'backend',
    checked: false,
    children: [
      { name: 'auth', checked: true },
      { name: 'billing', checked: false },
      { name: 'notifications', checked: false },
    ],
  },
  {
    name: 'frontend',
    checked: true, // selecting frontend should include all its children
    children: [
      { name: 'dashboard', checked: false },
      { name: 'settings', checked: false },
    ],
  },
];

function ServiceTreeTUI() {
  const { exit } = useApp();
  const [services, setServices] = useState<ServiceNode[]>(initialServices);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['0', '1'])); // Expand root items by default
  const [selectedIndex, setSelectedIndex] = useState(0);

  const flatList = servicesToFlatList(services, expandedPaths);

  // Helper function to update service by path
  const updateServiceByPath = (path: number[], updater: (service: ServiceNode) => ServiceNode): ServiceNode[] => {
    const updateRecursive = (nodes: ServiceNode[], currentPath: number[]): ServiceNode[] => {
      if (currentPath.length === 0) return nodes;

      return nodes.map((node, index) => {
        if (index === currentPath[0]) {
          if (currentPath.length === 1) {
            return updater(node);
          } else {
            return {
              ...node,
              children: node.children ? updateRecursive(node.children, currentPath.slice(1)) : undefined,
            };
          }
        }
        return node;
      });
    };

    return updateRecursive(services, path);
  };

  // Toggle expansion of a node
  const toggleExpansion = (path: number[]) => {
    const pathKey = path.join('-');
    const newExpanded = new Set(expandedPaths);
    if (newExpanded.has(pathKey)) {
      newExpanded.delete(pathKey);
    } else {
      newExpanded.add(pathKey);
    }
    setExpandedPaths(newExpanded);
  };

  // Toggle checked state of a node
  const toggleChecked = (path: number[]) => {
    const newServices = updateServiceByPath(path, (service) => ({
      ...service,
      checked: !service.checked,
    }));
    setServices(newServices);
  };

  // Handle quit with JSON output
  const handleQuit = () => {
    const flattened = flattenServices(services);
    exit();
    // Print JSON after UI has cleared
    setTimeout(() => {
      console.log(JSON.stringify(flattened, null, 2));
    }, 100);
  };

  useInput((input: string, key: Record<string, boolean>) => {
    if (key.upArrow) {
      setSelectedIndex(Math.max(0, selectedIndex - 1));
    } else if (key.downArrow) {
      setSelectedIndex(Math.min(flatList.length - 1, selectedIndex + 1));
    } else if (key.rightArrow) {
      const selectedItem = flatList[selectedIndex];
      if (selectedItem.isParent && !selectedItem.expanded) {
        toggleExpansion(selectedItem.path);
      }
    } else if (key.leftArrow) {
      const selectedItem = flatList[selectedIndex];
      if (selectedItem.isParent && selectedItem.expanded) {
        toggleExpansion(selectedItem.path);
      }
    } else if (input === ' ' || key.return) {
      const selectedItem = flatList[selectedIndex];
      toggleChecked(selectedItem.path);
    } else if (input === 'f') {
      handleQuit();
    } else if (input === 'q' || key.escape) {
      handleQuit();
    }
  });

  // Check if a service is effectively checked (either directly or through parent)
  const isEffectivelyChecked = (path: number[]): boolean => {
    let current: ServiceNode[] = services;
    let parentChecked = false;

    for (let i = 0; i < path.length; i++) {
      const index = path[i];
      if (!current[index]) return false;

      const node = current[index];
      parentChecked = parentChecked || node.checked;

      if (i === path.length - 1) {
        return parentChecked;
      }

      current = node.children || [];
    }

    return false;
  };

  return (
    <Box flexDirection="column">
      <Text color="blue" bold>
        Service Tree Navigator
      </Text>
      <Text color="gray">
        ↑↓ Navigate | → Expand | ← Collapse | SPACE/ENTER Toggle | F Export & Quit | Q Quit
      </Text>
      <Text> </Text>
      {flatList.map((item, index) => {
        const isSelected = index === selectedIndex;
        const isChecked = isEffectivelyChecked(item.path);
        const indent = '  '.repeat(item.level);

        let prefix = '';
        if (item.isParent) {
          prefix = item.expanded ? '▼ ' : '▶ ';
        } else {
          prefix = '  ';
        }

        const checkbox = isChecked ? '[✓]' : '[ ]';
        const color = isSelected ? 'cyan' : isChecked ? 'green' : 'white';
        const backgroundColor = isSelected ? 'gray' : undefined;

        return (
          <Text key={item.path.join('-')} color={color} backgroundColor={backgroundColor}>
            {indent}{prefix}{checkbox} {item.name}
          </Text>
        );
      })}
    </Box>
  );
}

// Render the TUI
render(<ServiceTreeTUI />);
