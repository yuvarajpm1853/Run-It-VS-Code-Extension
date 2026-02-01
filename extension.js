// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

const isWindows = process.platform === 'win32';
const lineDelimiter = isWindows ? '\r\n' : '\n';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	const copyRelativePath = vscode.commands.registerCommand('copyRelativePath.Workspace', function (arg1, arg2) {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Copied Relative Path');
		let relativePath = returnRelativePath(arg1, arg2)
		if (relativePath) vscode.env.clipboard.writeText(relativePath);
	});

	const ExecutionScripts = vscode.commands.registerCommand('run.ExecutionScripts', function (arg1, arg2) {
		let isUpdated = updateEnvWithRelativePath(arg1, arg2)
		if (isUpdated) {
			vscode.window.showInformationMessage('Updated .env & triggered executeScripts.sh');
			runExecutionScript()
		}
	});
	const ExecutionScriptsInDebug = vscode.commands.registerCommand('run.ExecutionScriptsInDebug', function (arg1, arg2) {
		let isUpdated = updateEnvWithRelativePath(arg1, arg2)
		if (isUpdated) {
			vscode.window.showInformationMessage('(Debug) Updated .env & triggered executeScripts.sh');
			openJsDebugTerminalWithCwd()
		}
	});

	context.subscriptions.push(copyRelativePath);
	context.subscriptions.push(ExecutionScripts);
	context.subscriptions.push(ExecutionScriptsInDebug);
}

function returnRelativePath(arg1, arg2) {
	let resources;
	if (Array.isArray(arg2)) {
		resources = arg2;
	} else if (arg1) {
		resources = [arg1];
	} else {
		if (vscode.window.activeTextEditor && vscode.window.activeTextEditor.document.uri) {
			resources = [vscode.window.activeTextEditor.document.uri];
		}
	}

	if (resources) {
		const relativePaths = [];
		for (const resource of resources) {
			const relativePath = vscode.workspace.asRelativePath(resource, false);
			if (relativePath) {
				relativePaths.push(isWindows ? relativePath.replace(/\\/g, '/') : relativePath);
			}
		}
		return relativePaths.join(lineDelimiter);
	}
	else return undefined
}

function updateEnvFile(testPath) {
	const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

	if (!workspaceRoot) {
		vscode.window.showErrorMessage('No workspace folder found');
		return false;
	}

	const envPath = path.join(workspaceRoot, '.env');

	let content = '';

	if (fs.existsSync(envPath)) {
		content = fs.readFileSync(envPath, 'utf8');
	}

	const lines = content.split(/\r?\n/);
	let found = false;

	const updatedLines = lines.map(line => {
		if (line.startsWith('TESTNAME=')) {
			found = true;
			return `TESTNAME=${testPath}`;
		}
		return line;
	});

	if (!found) {
		updatedLines.push(`TESTNAME=${testPath}`);
	}

	fs.writeFileSync(envPath, updatedLines.join('\n'), 'utf8');
	return true;
}

function updateEnvWithRelativePath(arg1, arg2) {
	let relativePath = returnRelativePath(arg1, arg2)
	let isUpdated = updateEnvFile(relativePath)
	return isUpdated
}

function runExecutionScript() {
	const terminal = vscode.window.createTerminal('Execution Scripts');
	//   terminal.show();

	// For Windows Git Bash / WSL users:
	if (isWindows) terminal.sendText('executeScripts.sh');

	// If you're sure it's executable on Linux/macOS:
	else terminal.sendText('./executionScripts.sh');
	setTimeout(() => { terminal.dispose(); }, 1000); // 1 seconds
}

// async function openJsDebugTerminalWithCwd(cwdUri, command = "executionScripts.sh") {
async function openJsDebugTerminalWithCwd() {
	// The official command provided by VS Code's built-in JavaScript Debugger
	const officialJsDebugCommand = 'extension.js-debug.createDebuggerTerminal';

	try {
		// Pre-step: Ensure JavaScript Debugger extension is activated
		// This is crucial because the extension is lazy-loaded and may not be available initially

		const jsDebugExtension = vscode.extensions.getExtension('ms-vscode.js-debug');
		if (jsDebugExtension && !jsDebugExtension.isActive) {
			console.log('[Debug Terminal] Activating JavaScript Debugger extension directly...');
			await jsDebugExtension.activate();
			
			// Give it a moment to fully initialize
			// await new Promise(resolve => setTimeout(resolve, 5000));
		}

		console.log('[Debug Terminal] Attempting to use official JS Debug command...');

		// Strategy 1: Try to use the official JS Debug command
		// This is the most reliable method when available

		// Get all available commands to check if the JS Debug command exists
		const availableCommands = await vscode.commands.getCommands(true);

		if (availableCommands.includes(officialJsDebugCommand)) {
			console.log('[Debug Terminal] Official JS Debug command found, using it...');

			// Execute the command with the current working directory
			await vscode.commands.executeCommand(officialJsDebugCommand);

			console.log('[Debug Terminal] Successfully opened using official command');
			const terminal = vscode.window.activeTerminal;
			if (terminal) {
				terminal.sendText(`executeScripts.sh`);
				setTimeout(() => { terminal.dispose(); }, 1000); // 5 seconds
			}

			return; // Success! Exit early
		} else {
			console.log('[Debug Terminal] Official JS Debug command not available');
		}
	} catch (error) {
		console.log('[Debug Terminal] Failed to use official command:', error);
		// Continue to next strategy
	}
}

// function runExecInDebug(filePath, isDebug = false) {

// // opens debug terminal but cant run executeScripts.sh
// 	vscode.debug.startDebugging(undefined, {
// 		type: 'node',
// 		name: 'Run executeScripts.sh (Debug)',
// 		request: 'launch',
// 		program: "executeScripts.sh",
// 		console: 'integratedTerminal'
// 	});

// 	//   terminal.show();

// 	// For Windows Git Bash / WSL users:
// 	// terminal.sendText('executeScripts.sh');

// 	// If you're sure it's executable on Linux/macOS:
// 	// terminal.sendText('executionScripts.sh');
// }

// This method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
