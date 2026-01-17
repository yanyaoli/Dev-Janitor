# Requirements Document

## Introduction

本文档定义了 Dev-Janitor 项目检测功能改进的需求。主要解决用户报告的依赖包和工具检测遗漏、无法识别的问题，包括命令执行超时、Windows 命令兼容性、输出解析、错误处理等方面的改进。

## Glossary

- **Command_Executor**: 负责执行系统命令并返回结果的模块
- **Detection_Engine**: 负责检测已安装开发工具的模块
- **Package_Manager**: 负责列出和管理各包管理器安装的包的模块
- **Environment_Scanner**: 负责扫描和分析系统环境变量的模块
- **Timeout**: 命令执行的最大等待时间
- **Fallback_Command**: 当主命令失败时尝试的备选命令
- **Platform**: 操作系统平台（win32、darwin、linux）

## Requirements

### Requirement 1: 命令执行超时配置

**User Story:** As a user, I want the command executor to have configurable and appropriate timeouts, so that slow commands on Windows can complete successfully.

#### Acceptance Criteria

1. THE Command_Executor SHALL support configurable timeout values with a default of 30 seconds
2. WHEN executing package listing commands (npm list, pip list), THE Command_Executor SHALL use an extended timeout of 60 seconds
3. WHEN a command times out, THE Command_Executor SHALL log the timeout event with command details
4. THE Command_Executor SHALL provide timeout presets for different command categories (quick: 10s, normal: 30s, slow: 60s)

### Requirement 2: Windows 命令兼容性改进

**User Story:** As a Windows user, I want the tool detection to work reliably, so that all my installed tools are correctly identified.

#### Acceptance Criteria

1. WHEN detecting tools on Windows, THE Detection_Engine SHALL try multiple command variants in priority order
2. WHEN the `where` command fails on Windows, THE Detection_Engine SHALL fallback to checking common installation paths
3. WHEN detecting Python on Windows, THE Detection_Engine SHALL prioritize `py` (Python Launcher) over `python`
4. WHEN detecting pip on Windows, THE Detection_Engine SHALL prioritize `py -m pip` over `pip`
5. THE Detection_Engine SHALL check Windows-specific paths including Program Files, AppData, and user profile directories

### Requirement 3: npm 输出解析改进

**User Story:** As a user, I want npm package detection to work correctly on all platforms, so that I can see all my globally installed npm packages.

#### Acceptance Criteria

1. WHEN parsing npm list output, THE Package_Manager SHALL first attempt JSON parsing
2. IF JSON parsing fails, THEN THE Package_Manager SHALL use a platform-aware text parser
3. WHEN parsing text output on Windows, THE Package_Manager SHALL handle both Unicode tree characters and ASCII alternatives
4. THE Package_Manager SHALL extract package name and version from all valid npm output formats

### Requirement 4: pip 命令优先级改进

**User Story:** As a Windows user, I want pip commands to work reliably, so that I can manage my Python packages.

#### Acceptance Criteria

1. WHEN executing pip commands on Windows, THE Package_Manager SHALL try commands in order: `py -m pip`, `pip3`, `pip`
2. WHEN executing pip commands on Unix, THE Package_Manager SHALL try commands in order: `pip3`, `pip`
3. WHEN a pip command succeeds, THE Package_Manager SHALL cache the working command for subsequent operations
4. IF all pip commands fail, THEN THE Package_Manager SHALL log detailed error information

### Requirement 5: 工具检测列表扩展

**User Story:** As a developer, I want the tool detection to cover more common development tools, so that I have a complete view of my development environment.

#### Acceptance Criteria

1. THE Detection_Engine SHALL detect the following additional runtimes: Deno, Bun, Perl, Lua
2. THE Detection_Engine SHALL detect the following additional package managers: Homebrew, Chocolatey, Scoop, winget
3. THE Detection_Engine SHALL detect the following additional tools: AWS CLI, Azure CLI, gcloud, Helm, Ansible
4. THE Detection_Engine SHALL detect the following additional version managers: nvm, pyenv, rbenv, sdkman
5. WHEN detecting a tool, THE Detection_Engine SHALL use the appropriate version flag for each tool

### Requirement 6: 错误处理和日志改进

**User Story:** As a user, I want better error messages and logging, so that I can understand why certain tools or packages are not detected.

#### Acceptance Criteria

1. WHEN a command fails, THE Command_Executor SHALL log the command, exit code, stderr, and execution time
2. WHEN a tool detection fails, THE Detection_Engine SHALL record the failure reason in the tool info
3. THE Detection_Engine SHALL provide a detection summary with success/failure counts
4. WHEN parsing output fails, THE Package_Manager SHALL log the raw output for debugging
5. IF a fallback command is used, THEN THE system SHALL log which fallback was successful

### Requirement 7: 检测结果缓存

**User Story:** As a user, I want faster subsequent scans, so that I don't have to wait for full detection every time.

#### Acceptance Criteria

1. THE Detection_Engine SHALL cache detection results with a configurable TTL (default: 5 minutes)
2. WHEN a cached result exists and is not expired, THE Detection_Engine SHALL return the cached result
3. THE Detection_Engine SHALL provide a method to force refresh and bypass cache
4. WHEN the cache is invalidated, THE Detection_Engine SHALL clear all cached results
