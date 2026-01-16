# Design Document: Dev Tools Manager

## Overview

Dev Tools Manager 是一个跨平台的桌面应用程序，用于检测、展示和管理系统中安装的开发工具、依赖包、环境配置和运行服务。该应用使用 Electron 框架构建，提供原生桌面体验，支持 Windows、macOS 和 Linux 平台。

### Technology Stack

- **Frontend**: React 18 + TypeScript
- **Desktop Framework**: Electron
- **UI Library**: Ant Design (antd) - 提供丰富的组件和良好的国际化支持
- **State Management**: Zustand - 轻量级状态管理
- **I18n**: i18next + react-i18next - 国际化解决方案
- **Process Management**: Node.js child_process - 执行系统命令
- **Styling**: Tailwind CSS + Ant Design

### Key Design Decisions

1. **Electron 架构**: 选择 Electron 是因为它提供了跨平台的桌面应用开发能力，可以使用 Web 技术栈，同时访问 Node.js API 执行系统命令。

2. **React + TypeScript**: 提供类型安全和组件化开发，提高代码质量和可维护性。

3. **Ant Design**: 提供完整的 UI 组件库，内置国际化支持，减少开发时间。

4. **主进程/渲染进程分离**: Electron 的主进程负责系统命令执行和文件系统访问，渲染进程负责 UI 展示，通过 IPC 通信。

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Electron Main Process                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Detection  │  │   Service    │  │   Command    │  │
│  │   Engine     │  │   Monitor    │  │   Executor   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│         │                  │                  │          │
│         └──────────────────┴──────────────────┘          │
│                           │                              │
│                      IPC Bridge                          │
│                           │                              │
└───────────────────────────┼──────────────────────────────┘
                            │
┌───────────────────────────┼──────────────────────────────┐
│                    Electron Renderer Process             │
│                           │                              │
│  ┌────────────────────────┴───────────────────────────┐ │
│  │              React Application                     │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │ │
│  │  │  Tools   │  │ Packages │  │    Services      │ │ │
│  │  │  View    │  │   View   │  │     View         │ │ │
│  │  └──────────┘  └──────────┘  └──────────────────┘ │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │ │
│  │  │   Env    │  │ Settings │  │   I18n System    │ │ │
│  │  │  View    │  │   View   │  │                  │ │ │
│  │  └──────────┘  └──────────┘  └──────────────────┘ │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

```
User Action → React Component → IPC Call → Main Process Handler
                                              ↓
                                    Execute System Command
                                              ↓
                                    Parse Command Output
                                              ↓
                                    Return Data via IPC
                                              ↓
React Component ← Update State ← IPC Response
```

## Components and Interfaces

### 1. Main Process Components

#### 1.1 Detection Engine

负责检测系统中安装的开发工具。

```typescript
interface ToolInfo {
  name: string;
  version: string | null;
  path: string | null;
  isInstalled: boolean;
  installMethod?: 'npm' | 'pip' | 'homebrew' | 'apt' | 'chocolatey' | 'manual';
}

interface DetectionEngine {
  detectAllTools(): Promise<ToolInfo[]>;
  detectTool(toolName: string): Promise<ToolInfo>;
  detectNodeJS(): Promise<ToolInfo>;
  detectPython(): Promise<ToolInfo>;
  detectPHP(): Promise<ToolInfo>;
  detectNpm(): Promise<ToolInfo>;
  detectPip(): Promise<ToolInfo>;
  detectComposer(): Promise<ToolInfo>;
  detectCustomTool(command: string): Promise<ToolInfo>;
}
```

**Implementation Strategy**:
- 使用 `child_process.exec()` 执行版本查询命令（如 `node --version`）
- 使用 `which` (Unix) 或 `where` (Windows) 查找工具路径
- 解析命令输出提取版本号
- 处理命令执行超时和错误

#### 1.2 Package Manager

负责检测和管理全局安装的包。

```typescript
interface PackageInfo {
  name: string;
  version: string;
  location: string;
  manager: 'npm' | 'pip' | 'composer';
}

interface PackageManager {
  listNpmPackages(): Promise<PackageInfo[]>;
  listPipPackages(): Promise<PackageInfo[]>;
  listComposerPackages(): Promise<PackageInfo[]>;
  uninstallPackage(packageName: string, manager: string): Promise<boolean>;
}
```

**Implementation Strategy**:
- npm: 执行 `npm list -g --depth=0 --json`
- pip: 执行 `pip list --format=json`
- composer: 执行 `composer global show --format=json`

#### 1.3 Service Monitor

负责监控运行中的服务和进程。

```typescript
interface RunningService {
  pid: number;
  name: string;
  port?: number;
  command: string;
  cpu?: number;
  memory?: number;
}

interface ServiceMonitor {
  listRunningServices(): Promise<RunningService[]>;
  findServiceByPort(port: number): Promise<RunningService | null>;
  killService(pid: number): Promise<boolean>;
  startMonitoring(interval: number): void;
  stopMonitoring(): void;
}
```

**Implementation Strategy**:
- Windows: 使用 `netstat -ano` 和 `tasklist`
- Unix: 使用 `lsof -i` 和 `ps`
- 过滤常见开发服务端口（3000, 8080, 5000, 等）

#### 1.4 Environment Scanner

负责扫描系统环境变量。

```typescript
interface EnvironmentVariable {
  key: string;
  value: string;
  category: 'path' | 'java' | 'python' | 'node' | 'other';
}

interface EnvironmentScanner {
  getAllEnvironmentVariables(): EnvironmentVariable[];
  getPathEntries(): string[];
  findDuplicatePathEntries(): string[];
  getServiceRelatedVariables(): EnvironmentVariable[];
}
```

#### 1.5 Command Executor

负责执行系统命令的通用接口。

```typescript
interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  success: boolean;
}

interface CommandExecutor {
  execute(command: string, options?: ExecOptions): Promise<CommandResult>;
  executeSafe(command: string): Promise<CommandResult>;
  getPlatformCommand(command: string): string;
}
```

### 2. IPC Communication

主进程和渲染进程之间的通信接口。

```typescript
// Renderer → Main
interface IPCChannels {
  'tools:detect-all': () => Promise<ToolInfo[]>;
  'tools:detect-one': (toolName: string) => Promise<ToolInfo>;
  'packages:list-npm': () => Promise<PackageInfo[]>;
  'packages:list-pip': () => Promise<PackageInfo[]>;
  'packages:uninstall': (name: string, manager: string) => Promise<boolean>;
  'services:list': () => Promise<RunningService[]>;
  'services:kill': (pid: number) => Promise<boolean>;
  'env:get-all': () => Promise<EnvironmentVariable[]>;
  'env:get-path': () => Promise<string[]>;
  'settings:get-language': () => Promise<string>;
  'settings:set-language': (lang: string) => Promise<void>;
}

// Main → Renderer (Events)
interface IPCEvents {
  'services:updated': (services: RunningService[]) => void;
  'detection:progress': (progress: number) => void;
  'error': (error: string) => void;
}
```

### 3. Frontend Components

#### 3.1 State Management (Zustand)

```typescript
interface AppState {
  // Tools
  tools: ToolInfo[];
  toolsLoading: boolean;
  
  // Packages
  npmPackages: PackageInfo[];
  pipPackages: PackageInfo[];
  packagesLoading: boolean;
  
  // Services
  runningServices: RunningService[];
  servicesLoading: boolean;
  
  // Environment
  environmentVariables: EnvironmentVariable[];
  envLoading: boolean;
  
  // UI
  currentView: 'tools' | 'packages' | 'services' | 'environment';
  language: 'zh-CN' | 'en-US';
  
  // Actions
  loadTools: () => Promise<void>;
  loadPackages: (manager: string) => Promise<void>;
  loadServices: () => Promise<void>;
  loadEnvironment: () => Promise<void>;
  refreshAll: () => Promise<void>;
  setLanguage: (lang: string) => void;
}
```

#### 3.2 React Components Structure

```
App
├── Layout
│   ├── Header (Logo, Language Switcher, Refresh Button)
│   ├── Sidebar (Navigation Menu)
│   └── Content
│       ├── ToolsView
│       │   ├── ToolCard (for each tool)
│       │   └── ToolDetailModal
│       ├── PackagesView
│       │   ├── PackageManagerTabs (npm, pip, composer)
│       │   ├── PackageTable
│       │   └── PackageActionMenu
│       ├── ServicesView
│       │   ├── ServiceTable
│       │   └── ServiceActionButtons
│       ├── EnvironmentView
│       │   ├── EnvironmentTable
│       │   └── PathAnalyzer
│       └── SettingsView
│           ├── LanguageSelector
│           └── AboutSection
```

#### 3.3 Key Component Interfaces

```typescript
// ToolCard Component
interface ToolCardProps {
  tool: ToolInfo;
  onRefresh: () => void;
  onViewDetails: () => void;
}

// PackageTable Component
interface PackageTableProps {
  packages: PackageInfo[];
  loading: boolean;
  onUninstall: (packageName: string) => void;
  onRefresh: () => void;
}

// ServiceTable Component
interface ServiceTableProps {
  services: RunningService[];
  loading: boolean;
  onKill: (pid: number) => void;
  autoRefresh: boolean;
}
```

## Data Models

### Tool Information Model

```typescript
interface ToolInfo {
  name: string;              // Tool name (e.g., "Node.js", "Python")
  displayName: string;       // Localized display name
  version: string | null;    // Version string (e.g., "v18.17.0")
  path: string | null;       // Installation path
  isInstalled: boolean;      // Installation status
  installMethod?: string;    // How it was installed
  icon?: string;             // Icon identifier
  category: 'runtime' | 'package-manager' | 'tool' | 'other';
}
```

### Package Information Model

```typescript
interface PackageInfo {
  name: string;              // Package name
  version: string;           // Version string
  location: string;          // Installation location
  manager: 'npm' | 'pip' | 'composer';
  description?: string;      // Package description
  homepage?: string;         // Package homepage URL
}
```

### Running Service Model

```typescript
interface RunningService {
  pid: number;               // Process ID
  name: string;              // Process name
  port?: number;             // Port number (if applicable)
  command: string;           // Full command
  cpu?: number;              // CPU usage percentage
  memory?: number;           // Memory usage in MB
  startTime?: Date;          // Process start time
}
```

### Environment Variable Model

```typescript
interface EnvironmentVariable {
  key: string;               // Variable name
  value: string;             // Variable value
  category: 'path' | 'java' | 'python' | 'node' | 'other';
  isSystemVariable: boolean; // System vs User variable
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Tool Detection Consistency

*For any* supported development tool (Node.js, Python, PHP, npm, pip, Composer), when the tool is installed on the system, the Detection Engine should successfully detect it and return both version number and installation path.

**Validates: Requirements 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8**

### Property 2: Unavailable Tool Handling

*For any* tool that is not installed on the system, the Detection Engine should mark it as unavailable (isInstalled: false) without throwing errors.

**Validates: Requirements 1.9**

### Property 3: Complete Tool Information Display

*For any* detected tool, the UI rendering function should include the tool's name, version number, and installation path in the output.

**Validates: Requirements 2.2, 2.3, 2.4**

### Property 4: All Tools Display

*For any* list of detected tools, the UI Panel should render all tools from the list without omitting any.

**Validates: Requirements 2.1**

### Property 5: Package Information Completeness

*For any* package detected by npm or pip, the package information should include both package name and version.

**Validates: Requirements 3.2, 4.2**

### Property 6: Package List Parsing

*For any* valid JSON output from package managers (npm list, pip list), the parser should extract all packages without data loss.

**Validates: Requirements 3.1, 4.1**

### Property 7: Tool Categorization

*For any* list of tools, when organized by category, all tools should be assigned to exactly one category and no tools should be lost.

**Validates: Requirements 5.2**

### Property 8: Action Menu Completeness

*For any* installed tool, the action menu should include all applicable options (view details, update if updatable, uninstall if uninstallable).

**Validates: Requirements 6.2, 6.3, 6.4**

### Property 9: Error Logging Consistency

*For any* command execution that fails, the system should log the error details including command, error message, and timestamp.

**Validates: Requirements 8.1**

### Property 10: Error Display

*For any* command execution failure, the system should display a user-friendly error message to the user.

**Validates: Requirements 8.2**

### Property 11: Partial Failure Resilience

*For any* set of tool detection operations, if some detections fail, the system should still return results for successful detections and continue operating normally.

**Validates: Requirements 8.5**

### Property 12: PATH Scanning Completeness

*For any* system PATH environment variable, the Detection Engine should scan all directories in the PATH and identify all executable tools.

**Validates: Requirements 9.1**

### Property 13: Multiple Installation Locations

*For any* tool that exists in multiple locations, the system should return all installation locations in the results.

**Validates: Requirements 9.6**

### Property 14: Uninstall Instructions Generation

*For any* detected tool, the system should provide uninstallation instructions or commands appropriate for its installation method.

**Validates: Requirements 9.5**

### Property 15: Environment Variable Completeness

*For any* system environment, the Detection Engine should retrieve all environment variables without omission.

**Validates: Requirements 10.1**

### Property 16: Environment Variable Display

*For any* environment variable, the UI should display both the variable name and its value.

**Validates: Requirements 10.3**

### Property 17: Environment Variable Filtering

*For any* category filter applied to environment variables, the filtered results should only include variables matching that category.

**Validates: Requirements 10.5**

### Property 18: Duplicate PATH Detection

*For any* PATH environment variable, the system should identify all duplicate entries.

**Validates: Requirements 10.6**

### Property 19: Running Service Information

*For any* running service detected, the system should provide process name, PID, and port number (if applicable).

**Validates: Requirements 11.3**

### Property 20: Service Stop Action Availability

*For any* running service displayed in the UI, a stop/kill action should be available.

**Validates: Requirements 11.5**

### Property 21: Platform-Specific Command Selection

*For any* operation requiring system commands (tool detection, process management), the system should select the appropriate command for the current platform (Windows, macOS, Linux).

**Validates: Requirements 12.4, 12.6**

### Property 22: Platform-Specific Path Handling

*For any* file path returned by system commands, the system should correctly parse it according to the platform's path format (Windows backslashes vs Unix forward slashes).

**Validates: Requirements 12.5**

### Property 23: Language Preference Persistence

*For any* language selection made by the user, the system should save the preference and restore it on next launch.

**Validates: Requirements 13.5**

### Property 24: I18n System Coverage

*For any* user-facing text in the application, it should be loaded through the i18n system with appropriate translation keys for both Chinese and English.

**Validates: Requirements 13.7, 13.8**

## Error Handling

### Error Categories

1. **Command Execution Errors**
   - Command not found
   - Command timeout
   - Permission denied
   - Invalid output format

2. **Parsing Errors**
   - Invalid JSON from package managers
   - Unexpected version string format
   - Missing required fields

3. **System Errors**
   - File system access errors
   - Process management errors
   - IPC communication errors

### Error Handling Strategy

```typescript
interface ErrorHandler {
  handleCommandError(error: Error, command: string): CommandResult;
  handleParsingError(error: Error, data: string): void;
  handleSystemError(error: Error): void;
  logError(error: Error, context: string): void;
  displayUserError(message: string, details?: string): void;
}
```

**Implementation Principles**:

1. **Graceful Degradation**: If one tool detection fails, continue with others
2. **User-Friendly Messages**: Convert technical errors to understandable messages
3. **Detailed Logging**: Log full error details for debugging
4. **Timeout Handling**: Set reasonable timeouts for all command executions (5 seconds default)
5. **Retry Logic**: Retry failed operations once before reporting error

### Error Recovery

- **Detection Failures**: Mark tool as "Detection Failed" but continue
- **Package List Failures**: Show empty list with error message
- **Service Monitor Failures**: Stop auto-refresh, show last known state
- **IPC Failures**: Retry once, then show error dialog

## Testing Strategy

### Dual Testing Approach

This project will use both **unit tests** and **property-based tests** to ensure comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs
- Together they provide comprehensive coverage: unit tests catch concrete bugs, property tests verify general correctness

### Property-Based Testing

We will use **fast-check** (for TypeScript/JavaScript) to implement property-based testing.

**Configuration**:
- Minimum 100 iterations per property test
- Each property test must reference its design document property
- Tag format: `// Feature: dev-tools-manager, Property {number}: {property_text}`

**Example Property Test**:

```typescript
import fc from 'fast-check';

// Feature: dev-tools-manager, Property 2: Unavailable Tool Handling
test('unavailable tools are marked as not installed', () => {
  fc.assert(
    fc.property(
      fc.string(), // tool name
      async (toolName) => {
        // Mock command execution to simulate tool not found
        const result = await detectTool(toolName, () => {
          throw new Error('Command not found');
        });
        
        expect(result.isInstalled).toBe(false);
        expect(result.version).toBeNull();
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Testing

**Focus Areas**:
- Command output parsing with specific examples
- Error handling for known error cases
- UI component rendering with specific props
- IPC communication with mock data
- Platform-specific logic with mocked platform

**Testing Framework**: Jest + React Testing Library

**Example Unit Test**:

```typescript
describe('DetectionEngine', () => {
  it('should parse Node.js version correctly', async () => {
    const mockExec = jest.fn().mockResolvedValue({
      stdout: 'v18.17.0\n',
      stderr: '',
      exitCode: 0
    });
    
    const result = await detectNodeJS(mockExec);
    
    expect(result.isInstalled).toBe(true);
    expect(result.version).toBe('18.17.0');
  });
  
  it('should handle timeout errors', async () => {
    const mockExec = jest.fn().mockRejectedValue(
      new Error('Command timeout')
    );
    
    const result = await detectNodeJS(mockExec);
    
    expect(result.isInstalled).toBe(false);
  });
});
```

### Integration Testing

- Test IPC communication between main and renderer processes
- Test full detection flow from command execution to UI display
- Test service monitoring with real process data
- Test language switching end-to-end

### Test Coverage Goals

- Unit test coverage: > 80%
- Property test coverage: All 24 properties implemented
- Integration test coverage: All major user flows

## Implementation Notes

### Platform-Specific Considerations

**Windows**:
- Use `where` command instead of `which`
- Use `tasklist` and `netstat -ano` for process management
- Handle Windows path format (backslashes, drive letters)
- Use PowerShell for some operations

**macOS/Linux**:
- Use `which` command for tool location
- Use `ps` and `lsof` for process management
- Handle Unix path format (forward slashes)
- Consider Homebrew installation paths on macOS

### Security Considerations

1. **Command Injection Prevention**: Sanitize all user inputs before executing commands
2. **Privilege Escalation**: Never require admin/root privileges for detection
3. **Process Termination**: Confirm before killing processes, prevent killing system processes
4. **Path Traversal**: Validate all file paths before access

### Performance Optimization

1. **Parallel Detection**: Run tool detections in parallel using Promise.all()
2. **Caching**: Cache detection results for 30 seconds to avoid repeated scans
3. **Lazy Loading**: Load package lists only when user navigates to packages view
4. **Debouncing**: Debounce refresh button to prevent rapid repeated scans
5. **Virtual Scrolling**: Use virtual scrolling for large package lists

### Internationalization Implementation

**File Structure**:
```
locales/
├── en-US.json
└── zh-CN.json
```

**Translation Keys Structure**:
```json
{
  "common": {
    "refresh": "Refresh",
    "loading": "Loading...",
    "error": "Error"
  },
  "tools": {
    "title": "Development Tools",
    "installed": "Installed",
    "notInstalled": "Not Installed"
  },
  "packages": {
    "title": "Packages",
    "npm": "NPM Packages",
    "pip": "Python Packages"
  }
}
```

### Build and Distribution

**Build Tools**:
- electron-builder for packaging
- Support for Windows (exe, msi), macOS (dmg, app), Linux (AppImage, deb)

**Auto-Update**:
- Implement auto-update using electron-updater
- Check for updates on startup
- Notify user when updates are available

**Code Signing**:
- Sign Windows executables
- Sign macOS applications
- Provide checksums for Linux packages
