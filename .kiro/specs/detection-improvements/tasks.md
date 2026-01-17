# Implementation Plan: Detection Improvements

## Overview

本实现计划将检测功能改进分解为可执行的编码任务。实现语言为 TypeScript，测试框架使用 Vitest + fast-check。

## Tasks

- [x] Task 1: 改进 CommandExecutor 超时配置 ✅ (2026-01-17)
  - 在 `commandExecutor.ts` 中添加 TimeoutPreset 枚举：QUICK(10s)、NORMAL(30s)、SLOW(60s)、EXTENDED(120s)
  - 将默认超时从 5000ms 改为 30000ms
  - 扩展 ExecutorOptions 接口，添加 retryCount、fallbackCommands、logOnError 选项
  - 添加 ExtendedCommandResult 接口包含 executionTime 和 commandUsed
  - 实现 getTimeoutForCommand() 函数，为 `npm list`、`pip list` 等慢命令自动使用 SLOW 超时
  - Requirements: 1.1, 1.2, 1.4, 6.1

- [x] Task 2: 改进 Windows 命令兼容性 ✅ (2026-01-17)
  - 创建 PlatformCommands 配置，定义每个工具在不同平台的命令变体列表
  - Windows Python: ['py', 'python', 'python3']
  - Windows pip: ['py -m pip', 'pip3', 'pip']
  - 添加 WindowsFallbackPaths 配置，实现 searchWindowsPaths() 函数检查 Program Files、AppData 等
  - 更新 DetectionEngine，修改 detectPython()、detectPip() 使用 PlatformCommands
  - 实现 tryCommandsInOrder() 方法
  - Requirements: 2.1, 2.2, 2.3, 2.4, 2.5

- [x] Task 3: Checkpoint - 运行测试 ✅ (2026-01-17)
  - 运行 `npm test`，确保所有测试通过
  - 如有问题请询问用户

- [x] Task 4: 改进 npm 输出解析 ✅ (2026-01-17)
  - 添加 parseNpmTextWindows() 处理 ASCII 树字符 (`+--`, `\--`)
  - 添加 parseNpmTextUnix() 处理 Unicode 树字符 (`├──`, `└──`)
  - 更新 parseNpmOutput：先尝试 JSON 解析，失败时根据平台选择文本解析器
  - 返回 ParseResult 包含解析方法信息
  - Requirements: 3.1, 3.2, 3.3, 3.4

- [x] Task 5: 改进 pip 命令处理 ✅ (2026-01-17)
  - 添加 PipCommandCache 接口，实现 getWorkingPipCommand() 缓存成功的命令
  - 更新 pip 命令优先级：Windows ['py -m pip', 'pip3', 'pip']，Unix ['pip3', 'pip']
  - 使用缓存的命令（如果可用）
  - Requirements: 4.1, 4.2, 4.3

- [x] Task 6: 扩展工具检测列表 - 运行时 ✅ (2026-01-17)
  - Deno: `deno --version`
  - Bun: `bun --version`
  - Perl: `perl --version`
  - Lua: `lua -v`
  - Requirements: 5.1

- [x] Task 7: 扩展工具检测列表 - 包管理器 ✅ (2026-01-17)
  - Homebrew: `brew --version`
  - Chocolatey: `choco --version`
  - Scoop: `scoop --version`
  - winget: `winget --version`
  - Requirements: 5.2

- [x] Task 8: 扩展工具检测列表 - 云工具 ✅ (2026-01-17)
  - AWS CLI: `aws --version`
  - Azure CLI: `az --version`
  - gcloud: `gcloud --version`
  - Helm: `helm version`
  - Ansible: `ansible --version`
  - Requirements: 5.3

- [x] Task 9: 扩展工具检测列表 - 版本管理器 ✅ (2026-01-17)
  - nvm: `nvm --version`
  - pyenv: `pyenv --version`
  - rbenv: `rbenv --version`
  - sdkman: `sdk version`
  - Requirements: 5.4

- [x] Task 10: Checkpoint - 运行测试 ✅ (2026-01-17)
  - 运行 `npm test`，确保所有测试通过
  - 如有问题请询问用户

- [x] Task 11: 改进错误处理和日志 ✅ (2026-01-17)
  - 扩展 CommandResult 添加 executionTime、commandUsed 字段
  - 扩展 ToolInfo 添加 errorReason、detectionMethod、detectionTime 字段
  - 添加 DetectionSummary 接口，在 detectAllToolsWithSummary() 返回摘要信息
  - 解析失败时记录原始输出，回退命令成功时记录使用的命令
  - Requirements: 6.1, 6.2, 6.3, 6.4, 6.5

- [x] Task 12: 实现检测结果缓存 ✅ (2026-01-17)
  - 创建 DetectionCache 类，实现 get、set、invalidate、invalidateAll 方法
  - 支持可配置的 TTL（默认 5 分钟）
  - 集成缓存到 DetectionEngine，检测前检查缓存，检测后更新缓存
  - 添加 forceRefresh 参数绕过缓存
  - 添加 invalidateCache() 方法清除所有缓存条目
  - Requirements: 7.1, 7.2, 7.3, 7.4

- [x] Task 13: Final Checkpoint ✅ (2026-01-17)
  - 运行 `npm test`，确保所有测试通过
  - 运行 `npm run build`，确保构建成功
  - 如有问题请询问用户

## Notes

- 每个任务引用具体的需求以便追溯
- Checkpoint 任务确保增量验证
