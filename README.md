# RunIt VS Code Extension

## Overview
RunIt is a Visual Studio Code extension that provides options to run test scripts (.js) via executeScripts & Playwright, handles Allure report generation and serving, and allows copying relative paths.

## Features
- Run test scripts using executionScripts.sh
- Debug test scripts
- Generate and serve Allure reports
- Run tests with Playwright
- Copy relative file paths
- Context menu and editor integration
- Keybindings for quick actions

## Commands
| Command | Description |
| ------- | ----------- |
| copyRelativePath.Workspace | Copy Relative Path (Workspace) |
| run.ExecutionScripts | Run via executionScripts.sh |
| run.ExecutionScriptsInDebug | Run via executionScripts.sh (Debug) |
| run.allureServe | (Allure) Serve Report |
| run.allureGenerate | (Allure) Generate Report |
| run.runWithPlaywright | Run with Playwright |

## Keybindings
| Keybinding | Command |
| ---------- | ------- |
| Shift+Alt+X | run.ExecutionScripts |
| Shift+Alt+D | run.ExecutionScriptsInDebug |
| Shift+Alt+C | copyRelativePath.Workspace |
| Shift+Alt+S | run.allureServe |
| Shift+Alt+G | run.allureGenerate |
| Shift+Alt+P | run.runWithPlaywright |

## Requirements
- VS Code ^1.100.1

## Images

![1770049717628](image/README/1770049717628.png)
![1770049826967](image/README/1770049826967.png)
![1770049886049](image/README/1770049886049.png)

## Pseudo Option

![1770049976869](image/README/1770049976869.png)

