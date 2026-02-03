# OneClickRun VS Code Extension

## Overview
OneClickRun is a Visual Studio Code extension that provides options to run test scripts (.js) via executeScripts & Playwright, handles Allure report generation and serving, and allows copying relative paths.

## Why?
In day-to-day development and test automation, we often repeat the same manual steps just to run a script or test:

1. Copy the workspace-relative path of a file
2. Paste it into the .env file under the TESTNAME key
3. Open a terminal and manually run executeScripts.sh

These steps are simple — but repetitive, time-consuming, and error-prone.

One Click Run replaces this entire workflow with a single UI command.
With a right-click action, it automatically updates the .env file and triggers the required script execution, letting you focus on writing and debugging code instead of repeating setup steps.

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

## Conditional Option

This option is enabled only when:
- The selected file ends with `spec.js`
- Playwright is present in the workspace `package.json`

![1770049976869](image/README/1770049976869.png)

## Status Message
![status Message](image/README/1770092798432.png)
<img alt="image" src="https://github.com/user-attachments/assets/19612c69-a736-4ea3-b1c0-ec04273e324b" />

