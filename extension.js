// @ts-nocheck
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
async function activate(context) {

	await openJsDebugTerminal()
	// vscode.window.onDidChangeActiveTerminal(checkActiveTerminal);

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
			runCmdInTerminal('executeScripts.sh')
		}
	});
	const ExecutionScriptsInDebug = vscode.commands.registerCommand('run.ExecutionScriptsInDebug', function (arg1, arg2) {
		let isUpdated = updateEnvWithRelativePath(arg1, arg2)
		if (isUpdated) {
			vscode.window.showInformationMessage('(Debug) Updated .env & triggered executeScripts.sh');
			openJsDebugTerminalWithCwd()
		}
	});
	const allureServe = vscode.commands.registerCommand('run.allureServe', function (arg1, arg2) {
		vscode.window.showInformationMessage('Triggered Allure serve');
		runCmdInTerminal('allure serve ./allure-results',"Allure serve", false)
	});
	const allureGenerate = vscode.commands.registerCommand('run.allureGenerate', function (arg1, arg2) {
		vscode.window.showInformationMessage('Triggered Allure generate');
		runCmdInTerminal('allure generate --single-file --clean')
	});

	context.subscriptions.push(copyRelativePath);
	context.subscriptions.push(ExecutionScripts);
	context.subscriptions.push(ExecutionScriptsInDebug);
	context.subscriptions.push(allureServe);
	context.subscriptions.push(allureGenerate);
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

function runCmdInTerminal(cmd, terminalName = 'Execution Scripts', closeTerminal = true) {
	const terminal = vscode.window.createTerminal(terminalName);
	//   terminal.show();

	// For Windows Git Bash / WSL users:
	if (isWindows) terminal.sendText(cmd);


	// If you're sure it's executable on Linux/macOS:
	else terminal.sendText(`./${cmd}`);
	if (closeTerminal) setTimeout(() => { terminal.dispose(); }, 1000); // 1 seconds
}

// async function openJsDebugTerminalWithCwd12(cwdUri, command = "executionScripts.sh") {
async function openJsDebugTerminalWithCwd() {

	try {
		await openJsDebugTerminal()
		const name3 = vscode.window.activeTerminal?.name;
		const terminal = vscode.window.activeTerminal;
		if (terminal) {
			terminal.sendText(`executeScripts.sh`);

			// cant dispose debug terminal - show available until execution close
			// setTimeout(() => { terminal.dispose(); }, 30000); // 5 seconds
		}
	} catch (error) {
		console.log('[Debug Terminal] Failed to use official command:', error);
	}
}
async function openJsDebugTerminal() {
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
			await new Promise(resolve => setTimeout(resolve, 5000));
		}

		console.log('[Debug Terminal] Attempting to use official JS Debug command...');

		// Strategy 1: Try to use the official JS Debug command
		// This is the most reliable method when available

		const name = await vscode.window.activeTerminal?.name;
		if (name !== "JavaScript Debug Terminal") {
			// Get all available commands to check if the JS Debug command exists
			const availableCommands = await vscode.commands.getCommands(true);

			if (availableCommands.includes(officialJsDebugCommand)) {
				console.log('[Debug Terminal] Official JS Debug command found, using it...');

				// Execute the command with the current working directory
				await vscode.commands.executeCommand(officialJsDebugCommand);

				console.log('[Debug Terminal] Successfully opened using official command');
				await vscode.window.onDidChangeActiveTerminal(checkActiveTerminal);
				return; // Success! Exit early
			} else {
				console.log('[Debug Terminal] Official JS Debug command not available');
			}
		}
	} catch (error) {
		console.log('[Debug Terminal] Failed to use official command:', error);
		// Continue to next strategy
	}
}
function checkActiveTerminal() {
	const { activeTerminal } = vscode.window;
	console.log("activeTerminal: " + (activeTerminal ? activeTerminal.name : "<none>"));
}
async function openJsDebugTerminalWithCwd2(cwdUri, command = "executionScripts.sh") {
	// The official command provided by VS Code's built-in JavaScript Debugger
	const officialJsDebugCommand = 'extension.js-debug.createDebuggerTerminal';

	// Pre-step: Ensure JavaScript Debugger extension is activated
	// This is crucial because the extension is lazy-loaded and may not be available initially
	try {
		console.log('[Debug Terminal] Ensuring JavaScript Debugger extension is activated...');

		// Method 1: Try to get and activate the JS Debug extension directly
		const jsDebugExtension = vscode.extensions.getExtension('ms-vscode.js-debug');

		if (jsDebugExtension && !jsDebugExtension.isActive) {
			console.log('[Debug Terminal] Activating JavaScript Debugger extension directly...');
			await jsDebugExtension.activate();

			// Give it a moment to fully initialize
			await new Promise(resolve => setTimeout(resolve, 1000));
		}

		// Method 2: Alternative activation by trying to access terminal profiles
		// This can trigger the debugger extension to load if it hasn't already
		try {
			await vscode.commands.executeCommand('workbench.action.terminal.showProfiles');
			await new Promise(resolve => setTimeout(resolve, 500));
		} catch {
			// Ignore - this is just an attempt to trigger activation
		}

	} catch (error) {
		console.log('[Debug Terminal] Could not activate JS Debug extension:', error);
		// Continue anyway - might still work
	}

	// Strategy 1: Try to use the official JS Debug command
	// This is the most reliable method when available
	try {
		console.log('[Debug Terminal] Attempting to use official JS Debug command...');

		// Get all available commands to check if the JS Debug command exists
		const availableCommands = await vscode.commands.getCommands(true);

		if (availableCommands.includes(officialJsDebugCommand)) {
			console.log('[Debug Terminal] Official JS Debug command found, using it...');

			// Execute the command with the current working directory
			await vscode.commands.executeCommand(officialJsDebugCommand, {
				cwd: cwdUri?.fsPath ?? undefined
			});

			console.log('[Debug Terminal] Successfully opened using official command');
			const terminal = vscode.window.activeTerminal;
			if (terminal) {
				terminal.sendText(`executeScripts.sh`);
				// vscode.window.showInformationMessage(`Running: npm run ${scriptName}`);
			}

			return; // Success! Exit early
		} else {
			console.log('[Debug Terminal] Official JS Debug command not available');
		}
	} catch (error) {
		console.log('[Debug Terminal] Failed to use official command:', error);
		// Continue to next strategy
	}

	// Strategy 2: Try to create a terminal using the JavaScript Debug Terminal profile
	// This profile is usually available if the JavaScript Debugger extension is active
	try {
		console.log('[Debug Terminal] Attempting to use JavaScript Debug Terminal profile...');

		await vscode.commands.executeCommand('workbench.action.terminal.newWithProfile', {
			profileName: 'JavaScript Debug Terminal',
			cwd: cwdUri?.fsPath ?? undefined
		});

		console.log('[Debug Terminal] Successfully opened using terminal profile');
		// Send the npm run command to the terminal
		return; // Success! Exit early
	} catch (error) {
		console.log('[Debug Terminal] Failed to use terminal profile:', error);
		// Continue to final fallback
	}

	// Strategy 3: Final fallback - create a regular integrated terminal
	// This always works but doesn't have debug capabilities
	console.log('[Debug Terminal] Using fallback: creating regular terminal...');

	const terminal = vscode.window.createTerminal({
		name: 'JavaScript Debug Terminal (Fallback)',
		cwd: cwdUri // VS Code handles URI to path conversion automatically
	});

	// Show the terminal to the user
	terminal.show();

	console.log('[Debug Terminal] Successfully created fallback terminal');

	// If a command was provided, send it to the terminal
	if (command) {
		terminal.sendText(command);
	}

	// Inform user about the fallback
	vscode.window.showInformationMessage(
		'Opened regular terminal (JavaScript Debug features not available)'
	);
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
