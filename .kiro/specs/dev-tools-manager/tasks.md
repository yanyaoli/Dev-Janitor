# Implementation Plan: Dev Tools Manager

## Overview

使用 Electron + React + TypeScript 构建开发工具管理面板，采用增量开发方式。

## Tasks

- [x] 1. 项目初始化
  - 使用 electron-vite 创建 Electron + React + TypeScript 项目
  - 配置 TypeScript、ESLint
  - 安装依赖：React 18、Ant Design、Zustand、i18next
  - 设置目录结构（src/main, src/renderer, src/shared）
  - _Requirements: 12.1, 12.2, 12.3_

- [x] 2. 命令执行器 + 工具检测引擎
  - 创建 CommandExecutor：执行命令、超时处理、平台检测
  - 创建 DetectionEngine：检测 Node.js、Python、PHP、npm、pip、Composer
  - 实现版本号解析和路径查找（which/where）
  - 实现 detectAllTools() 并行检测
  - _Requirements: 1.2-1.9, 12.4-12.6_

- [x] 3. 扩展检测 + 包管理器
  - PATH 扫描：解析 PATH、扫描可执行文件、识别安装方法
  - 多位置检测和卸载指令生成
  - PackageManager：listNpmPackages、listPipPackages、listComposerPackages
  - 包卸载功能
  - _Requirements: 3.1, 3.2, 4.1, 4.2, 9.1-9.7_

- [x] 4. 服务监控 + 环境扫描
  - ServiceMonitor：检测运行进程（Windows: netstat+tasklist, Unix: lsof+ps）
  - killService() 方法
  - EnvironmentScanner：读取环境变量、PATH 分析、重复检测
  - _Requirements: 10.1-10.6, 11.1-11.7_

- [x] 5. IPC 通信层
  - 主进程注册所有 IPC 处理器（tools、packages、services、env）
  - 创建 preload.js 暴露安全 API
  - 渲染进程 IPC 客户端
  - _Requirements: 1.1, 3.1, 4.1, 10.1, 11.1_

- [x] 6. 状态管理 + 国际化
  - Zustand store：tools、packages、services、environment 状态和 actions
  - 集成 IPC 调用到 store
  - 配置 i18next，创建 en-US.json 和 zh-CN.json
  - 语言检测和切换逻辑
  - _Requirements: 2.1, 7.3, 13.1-13.8_

- [x] 7. UI 布局 + 工具视图
  - Layout：Header（Logo、语言切换、刷新）、Sidebar、Content
  - ToolsView：工具列表、ToolCard（名称、版本、路径、状态）
  - 工具详情模态框
  - _Requirements: 2.1-2.6, 5.1, 5.4, 6.1-6.4, 7.1-7.4_

- [x] 8. 包/服务/环境视图
  - PackagesView：标签页（npm/pip/composer）、PackageTable、卸载功能
  - ServicesView：服务列表、停止按钮、刷新
  - EnvironmentView：环境变量表格、搜索过滤、PATH 分析器
  - _Requirements: 3.3, 4.3, 10.3-10.6, 11.3-11.7_

- [x] 9. 设置 + 错误处理 + 样式
  - SettingsView：语言选择、关于信息
  - 全局错误处理、ErrorBoundary、Toast 通知
  - 加载状态、Skeleton、空状态
  - 响应式布局优化
  - _Requirements: 5.1-5.6, 8.1-8.5, 13.3_

- [x] 10. 构建打包
  - 配置 electron-builder（Windows exe、macOS dmg、Linux AppImage）
  - 应用图标和元数据
  - 可选：自动更新（electron-updater）
  - _Requirements: 12.1-12.3_

- [x] 11. 文档
  - README.md（英文）+ README.zh-CN.md（中文）
  - 项目描述、安装说明、使用示例、截图
  - CHANGELOG.md、LICENSE
  - _Requirements: 14.1-14.11_

## Notes

- 先跑通核心流程，再逐步完善细节
- 遇到问题随时调整，不必严格按顺序
- 测试可以后补，先保证功能可用
