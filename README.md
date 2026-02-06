# OneClickRun VS Code Extension

## Overview
OneClickRun is a Visual Studio Code extension that streamlines running test scripts (.js) via executeScripts & Playwright, manages Allure report generation and serving, and enables quick copying of relative paths.

## Why?
In day-to-day development and test automation, we often repeat the same manual steps just to run a script or test:

1. Copy the workspace-relative path of a file
2. Paste it into the .env file under the TESTNAME key
3. Open a terminal and manually run executeScripts.sh

These steps are simple — but repetitive, time-consuming, and error-prone.

One Click Run replaces this entire workflow with a single UI command.
With a right-click action, it automatically updates the .env file and triggers the required script execution, letting you focus on writing and debugging code instead of repeating setup steps.

## Features
- Instantly run or debug test scripts using executionScripts.sh
- Generate and serve Allure reports with one click
- Run tests with Playwright (auto-detects Playwright in your workspace)
- Copy relative file paths directly from the context menu
- Context menu and editor integration for quick access
- Customizable keybindings for all major actions
- Conditional menu options (e.g., Playwright actions only appear for `spec.js` files and when Playwright is present)
- Status messages for script execution and reporting
- Keybindings/Shortcut Keys for quick actions

## Keybindings
| Keybinding | Action |
| ---------- | ------ |
| Shift+Alt+X | Run via executionScripts.sh |
| Shift+Alt+D | Run via executionScripts.sh (Debug) |
| Shift+Alt+C | Copy relative path |
| Shift+Alt+S | Serve Allure report |
| Shift+Alt+G | Generate Allure report |
| Shift+Alt+P | Run with Playwright |
| Shift+Alt+B | Set headless to true/false |
| Shift+Alt+N | Run with Node.js |

### Images

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

