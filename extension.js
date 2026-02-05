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

	// vscode.window.onDidChangeActiveTerminal(checkActiveTerminal);

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json

	const copyRelativePath = vscode.commands.registerCommand('copyRelativePath.Workspace', function (arg1, arg2) {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		// vscode.window.showInformationMessage('Copied Relative Path');
		vscode.window.setStatusBarMessage('✅ Copied Relative Path', 3000);

		let relativePath = getRelativePath(arg1, arg2)
		if (relativePath) vscode.env.clipboard.writeText(relativePath);
	});

	const ExecutionScripts = vscode.commands.registerCommand('oneClickRun.ExecutionScripts', function (arg1, arg2) {
		let { isUpdated, fileName } = updateEnvWithRelativePath(arg1, arg2)
		if (isUpdated) {
			vscode.window.setStatusBarMessage(`✅ Running: ${fileName}`, 3000);
			runCmdInTerminal('executeScripts.sh')
		}
	});
	const ExecutionScriptsInDebug = vscode.commands.registerCommand('oneClickRun.ExecutionScriptsInDebug', function (arg1, arg2) {
		let { isUpdated, fileName } = updateEnvWithRelativePath(arg1, arg2)
		if (isUpdated) {
			vscode.window.setStatusBarMessage(`✅ (Debug) Running: ${fileName}`, 3000);
			openJsDebugTerminalWithCwd()
		}
	});
	const allureServe = vscode.commands.registerCommand('oneClickRun.allureServe', function (arg1, arg2) {
		vscode.window.setStatusBarMessage('✅ Opening allure report', 3000);
		runCmdInTerminal('allure serve ./allure-results', "Allure serve", false)
	});
	const allureGenerate = vscode.commands.registerCommand('oneClickRun.allureGenerate', function (arg1, arg2) {
		vscode.window.setStatusBarMessage('✅ Generated allure report', 3000);
		runCmdInTerminal('allure generate --single-file --clean')
	});
	const runWithPlaywright = vscode.commands.registerCommand('oneClickRun.runWithPlaywright', function (arg1, arg2) {
		let isPlaywright = checkPlaywright()
		if (isPlaywright) {
			let relativePath = getRelativePath(arg1, arg2)
			runCmdInTerminal(`npx playwright test ${relativePath}`, "Playwright Terminal", false)
			vscode.window.setStatusBarMessage(`✅ Running: ${relativePath}`, 3000);
		}
	});

	updateHeadlessContext();

	let setHeadlessTrue = vscode.commands.registerCommand('oneClickRun.setHeadlessTrue', async function () {
		await updateHeadlessValue()
	})
	let setHeadlessFalse = vscode.commands.registerCommand('oneClickRun.setHeadlessFalse', async function () {
		await updateHeadlessValue()
	})

	vscode.workspace.onDidSaveTextDocument(doc => {
		if (doc.fileName.endsWith('.env')) {
			updateHeadlessContext();
		}
	});
	context.subscriptions.push(copyRelativePath);
	context.subscriptions.push(ExecutionScripts);
	context.subscriptions.push(ExecutionScriptsInDebug);
	context.subscriptions.push(allureServe);
	context.subscriptions.push(allureGenerate);
	context.subscriptions.push(runWithPlaywright);
	context.subscriptions.push(setHeadlessTrue);
	context.subscriptions.push(setHeadlessFalse);

	await openJsDebugTerminal()
	detectPlaywright();
	vscode.window.showInformationMessage('Run It Extension Activated');
}

function getRelativePath(arg1, arg2) {
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
	let relativePath = getRelativePath(arg1, arg2)

	// checking isDirectory
	relativePath = resolveRelativeTestPath(relativePath)

	let isUpdated = updateEnvFile(relativePath)
	const fileName = path.basename(relativePath);

	return { isUpdated, relativePath, fileName }
}

function runCmdInTerminal(cmd, terminalName = 'Execution Scripts', closeTerminal = true) {

	const name = vscode.window.activeTerminal?.name;
	let terminal;

	if (name !== terminalName) {
		terminal = vscode.window.createTerminal(terminalName);
	} else terminal = vscode.window.activeTerminal;

	terminal.show();

	// For Windows Git Bash / WSL users:
	if (isWindows) terminal.sendText(cmd);

	// If you're sure it's executable on Linux/macOS:
	else terminal.sendText(`./${cmd}`);
	if (closeTerminal) setTimeout(() => { terminal.dispose(); }, 1000); // 1 seconds
}

async function openJsDebugTerminalWithCwd() {

	try {
		await openJsDebugTerminal()
		// const name3 = vscode.window.activeTerminal?.name;
		let terminal = vscode.window.activeTerminal;
		if (terminal?.name !== "JavaScript Debug Terminal") await openJsDebugTerminal();
		else terminal.sendText('');          // New line

		// terminal.show();
		terminal = vscode.window.activeTerminal;
		const name3 = vscode.window.activeTerminal?.name;
		terminal.sendText(`executeScripts.sh`);

		// cant dispose debug terminal - show available until execution close
		// setTimeout(() => { terminal.dispose(); }, 30000); // 5 seconds

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
	}
}
async function detectPlaywright() {
	const folders = vscode.workspace.workspaceFolders;
	if (!folders) return;

	const pkgPath = path.join(folders[0].uri.fsPath, 'package.json');
	if (!fs.existsSync(pkgPath)) return;

	const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
	const deps = {
		...pkg.dependencies,
		...pkg.devDependencies
	};

	const hasPlaywright =
		deps?.['@playwright/test'] || deps?.['playwright'];

	await vscode.commands.executeCommand(
		'setContext',
		'workspace.hasPlaywright',
		!!hasPlaywright
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
async function detectPlaywright() {
	const folders = vscode.workspace.workspaceFolders;
	if (!folders) return;

	const pkgPath = path.join(folders[0].uri.fsPath, 'package.json');
	if (!fs.existsSync(pkgPath)) return;

	const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
	const deps = {
		...pkg.dependencies,
		...pkg.devDependencies
	};

	const hasPlaywright =
		deps?.['@playwright/test'] || deps?.['playwright'];

	await vscode.commands.executeCommand(
		'setContext',
		'workspace.hasPlaywright',
		!!hasPlaywright
	);
}

function resolveRelativeTestPath(relativePath) {
	const workspace = vscode.workspace.workspaceFolders?.[0];
	const absolutePath = path.join(workspace.uri.fsPath, relativePath);
	const stat = fs.statSync(absolutePath);

	// ✅ File → use directly
	if (stat.isFile()) {
		return relativePath.replace(/\\/g, '/');
	}

	// 📁 Directory → convert to glob
	if (stat.isDirectory()) {
		return path
			.join(relativePath.replace(/\/$/, ''), '**/*.js')
			.replace(/\\/g, '/');
	}
}

function checkPlaywright() {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showWarningMessage('No active file');
		return;
	}

	const filePath = editor.document.uri.fsPath;
	const fileName = path.basename(filePath);

	// 1️⃣ Check spec.js
	if (!fileName.endsWith('spec.js')) {
		vscode.window.showInformationMessage('Not a spec.js file');
		return;
	}

	// 2️⃣ Locate package.json
	const workspaceFolders = vscode.workspace.workspaceFolders;
	if (!workspaceFolders) {
		vscode.window.showErrorMessage('No workspace opened');
		return;
	}

	const rootPath = workspaceFolders[0].uri.fsPath;
	const packageJsonPath = path.join(rootPath, 'package.json');

	if (!fs.existsSync(packageJsonPath)) {
		vscode.window.showErrorMessage('package.json not found');
		return;
	}

	// 3️⃣ Read package.json
	let pkg;
	try {
		pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
	} catch (e) {
		vscode.window.showErrorMessage('Invalid package.json');
		return;
	}

	// 4️⃣ Check for Playwright
	const deps = {
		...pkg.dependencies,
		...pkg.devDependencies
	};

	const hasPlaywright =
		deps?.['@playwright/test'] || deps?.['playwright'];

	if (!hasPlaywright) {
		vscode.window.showInformationMessage('Playwright not detected');
		return;
	}
	return true
}
function readHeadlessFromEnv() {
	const workspace = vscode.workspace.workspaceFolders?.[0];
	if (!workspace) return null;

	const envPath = path.join(workspace.uri.fsPath, '.env');
	if (!fs.existsSync(envPath)) return null;

	const content = fs.readFileSync(envPath, 'utf8');

	const match = content.match(/^HEADLESS\s*=\s*(true|false)/mi);
	if (!match) return null;

	return match[1].toLowerCase() === 'true';
}
async function updateHeadlessContext() {
	const headless = readHeadlessFromEnv();

	await vscode.commands.executeCommand(
		'setContext',
		'oneClickRun.hasHeadless',
		headless !== null
	);

	await vscode.commands.executeCommand(
		'setContext',
		'oneClickRun.headlessValue',
		headless
	);
}

async function updateHeadlessValue(value) {
	const workspace = vscode.workspace.workspaceFolders?.[0];
	if (!workspace) return;

	const envPath = path.join(workspace.uri.fsPath, '.env');
	if (!fs.existsSync(envPath)) return;

	let content = fs.readFileSync(envPath, 'utf8');

	const current = readHeadlessFromEnv();
	const next = !current;

	content = content.replace(
		/^HEADLESS\s*=\s*(true|false)/mi,
		`HEADLESS=${next}`
	);

	fs.writeFileSync(envPath, content);
	await updateHeadlessContext();

	vscode.window.setStatusBarMessage(
		`✅ headless set to ${next}`
	);
}

function deactivate() { }

module.exports = {
	activate,
	deactivate
}
