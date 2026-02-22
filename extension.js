// @ts-nocheck
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);
const isWindows = process.platform === 'win32';
const lineDelimiter = isWindows ? '\r\n' : '\n';
const officialJsDebugCommand = 'extension.js-debug.createDebuggerTerminal';
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
	activateJSDebugger()
	detectPlaywright();
	updateHeadlessContext();
	updateExecuteScriptContext()

	vscode.window.onDidChangeActiveTerminal(checkActiveTerminal);
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json

	const copyRelativePath = vscode.commands.registerCommand('copyRelativePath.Workspace', async function (arg1, arg2) {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		// vscode.window.showInformationMessage('Copied Relative Path');

		let relativePath = getRelativePath(arg1, arg2)
		if (relativePath) vscode.env.clipboard.writeText(relativePath);
		vscode.window.setStatusBarMessage('✅ Copied Relative Path', 3000);
	});

	const ExecutionScripts = vscode.commands.registerCommand('oneClickRun.ExecutionScripts', async function (arg1, arg2) {
		let { isUpdated, fileName } = updateEnvWithRelativePath(arg1, arg2)
		if (isUpdated) {
			await runCmdInTerminal('.\\executeScripts.sh')
			vscode.window.setStatusBarMessage(`✅ Running: ${fileName}`, 3000);
			// await updateGitBashContext();
		}
	});
	const ExecutionScriptsInDebug = vscode.commands.registerCommand('oneClickRun.ExecutionScriptsInDebug', async function (arg1, arg2) {
		let { isUpdated, fileName } = updateEnvWithRelativePath(arg1, arg2)
		if (isUpdated) {
			await openJsDebugTerminalWithCwd(`.\\executeScripts.sh`)
			vscode.window.setStatusBarMessage(`✅ (Debug) Running: ${fileName}`, 3000);
			// await updateGitBashContext();
		}
	});
	const runWithPlaywright = vscode.commands.registerCommand('oneClickRun.runWithPlaywright', async function (arg1, arg2) {
		let isPlaywright = checkPlaywright()
		if (isPlaywright) {
			let relativePath = getRelativePath(arg1, arg2)
			await runCmdInTerminal(`npx playwright test ${relativePath}`, "Playwright Terminal", false)
			vscode.window.setStatusBarMessage(`✅ Running: ${relativePath}`, 3000);
		}
	});

	const allureServe = vscode.commands.registerCommand('oneClickRun.allureServe', async function (arg1, arg2) {
		await runCmdInTerminal('allure serve allure-results', "Allure serve", false)
		vscode.window.setStatusBarMessage('✅ Opening allure report', 3000);
	});
	const allureGenerate = vscode.commands.registerCommand('oneClickRun.allureGenerate', async function (arg1, arg2) {
		await runCmdInTerminal('allure generate --single-file --clean', "Allure generate")
		vscode.window.setStatusBarMessage('✅ Generated allure report', 3000);
	});

	let setHeadlessTrue = vscode.commands.registerCommand('oneClickRun.setHeadlessTrue', async function () {
		await updateHeadlessValue()
	})
	let setHeadlessFalse = vscode.commands.registerCommand('oneClickRun.setHeadlessFalse', async function () {
		await updateHeadlessValue()
	})
	const runWithNode = vscode.commands.registerCommand('oneClickRun.runWithNode', async function (arg1, arg2) {
		let isJSFile = checkFileExtension("js")
		if (isJSFile) {
			3
			let relativePath = getRelativePath(arg1, arg2)
			await runCmdInTerminal(`node ${relativePath}`, "Node Terminal", false)
			vscode.window.setStatusBarMessage(`✅ Running: ${relativePath}`, 3000);
		}
	});
	const runWithNodeDebug = vscode.commands.registerCommand('oneClickRun.runWithNodeDebug', async function (arg1, arg2) {
		let isJSFile = checkFileExtension("js")
		if (isJSFile) {
			let relativePath = getRelativePath(arg1, arg2)
			await openJsDebugTerminalWithCwd(`node ${relativePath}`)
			vscode.window.setStatusBarMessage(`✅ (Debug) Running: ${relativePath}`, 3000);
		}
	});
	const closeAllGitBash = vscode.commands.registerCommand('oneClickRun.closeAllGitBash', async function (arg1, arg2) {
		await execAsync('taskkill /IM mintty.exe /F');
		// vscode.commands.executeCommand('setContext', 'oneClickRun.gitBashRunning', true);
		// await updateGitBashContext();
		vscode.window.setStatusBarMessage(`✅ (Debug) Running: ${relativePath}`, 3000);
	});

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
	context.subscriptions.push(runWithNode);
	context.subscriptions.push(runWithNodeDebug);
	context.subscriptions.push(closeAllGitBash);

	// await updateGitBashContext();
	// setInterval(updateGitBashContext, 3000);
	// vscode.window.showInformationMessage('OneClickRun Extension Activated');
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
	const envPath = path.join(workspaceRoot, '.env');

	let originalContent = '';

	if (fs.existsSync(envPath)) {
		originalContent = fs.readFileSync(envPath, 'utf8');
	}

	let updatedContent = originalContent;

	const testNameRegex = /^TESTNAME=.*$/m;

	if (testNameRegex.test(originalContent)) {
		// Replace existing TESTNAME line
		updatedContent = originalContent.replace(
			testNameRegex,
			`TESTNAME=${testPath}`
		);
	} else {
		// Append safely (preserve formatting)
		updatedContent =
			originalContent.trimEnd() +
			`\nTESTNAME=${testPath}\n`;
	}

	// 🔎 Validation: ensure nothing else changed
	const originalWithoutTestName = originalContent.replace(testNameRegex, '').trim();
	const updatedWithoutTestName = updatedContent.replace(/^TESTNAME=.*$/m, '').trim();

	if (originalWithoutTestName !== updatedWithoutTestName) {
		throw new Error('Unexpected modification detected in .env file');
	}
	else fs.writeFileSync(envPath, updatedContent, 'utf8');
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

async function runCmdInTerminal(cmd, terminalName = 'Execution Scripts', closeTerminal = true) {

	const name = vscode.window.activeTerminal?.name;
	let terminal;

	if (name !== terminalName) {
		terminal = vscode.window.createTerminal(terminalName);
	} else terminal = vscode.window.activeTerminal;

	await terminal.show(true);

	await terminal.sendText(cmd);

	if (closeTerminal) await setTimeout(() => { terminal.dispose(); }, 15000);
}

async function openJsDebugTerminalWithCwd(cmd) {

	try {
		await openJsDebugTerminal()
		const name = await vscode.window.activeTerminal?.name;
		if (name !== "JavaScript Debug Terminal") await openJsDebugTerminal()

		let terminal = vscode.window.activeTerminal;
		terminal.sendText(cmd);
	} catch (error) {
		console.log('[Debug Terminal] Failed to use official command:', error);
	}
}
async function openJsDebugTerminal() {
	try {
		let res = await activateJSDebugger()
		const name = await vscode.window.activeTerminal?.name;

		if (res && name !== "JavaScript Debug Terminal") {

			// Execute the command with the current working directory
			const cwdUri = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
			// await vscode.commands.executeCommand(officialJsDebugCommand);

			await vscode.commands.executeCommand(officialJsDebugCommand, {
				cwd: cwdUri ?? undefined
			});

		}
	} catch (error) {
		console.log('[Debug Terminal] Failed :', error);
	}
}
function checkActiveTerminal() {
	const { activeTerminal } = vscode.window;
	console.log("activeTerminal: " + (activeTerminal ? activeTerminal.name : "<none>"));
}
async function activateJSDebugger() {
	// The official comman	d provided by VS Code's built-in JavaScript Debugger
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

		// Get all available commands to check if the JS Debug command exists
		const availableCommands = await vscode.commands.getCommands(true);

		if (availableCommands.includes(officialJsDebugCommand)) {
			console.log('[Debug Terminal] Official JS Debug command found, using it...');
			return true
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

function resolveRelativeTestPath(relativePath) {
	const workspace = vscode.workspace.workspaceFolders?.[0];
	const absolutePath = path.join(workspace.uri.fsPath, relativePath);
	const stat = fs.statSync(absolutePath);

	// // ✅ File → use directly
	// if (stat.isFile()) {
	// 	return relativePath.replace(/\\/g, '/');
	// }

	// // 📁 Directory → convert to glob
	// if (stat.isDirectory()) {
	// 	return path
	// 		.join(relativePath.replace(/\/$/, ''), '**/*.js')
	// 		.replace(/\\/g, '/');
	// }
	return relativePath.replace(/\\/g, '/');

}

function checkPlaywright() {
	let isPlaywrightFile = checkFileExtension("spec.js")

	if (!isPlaywrightFile) return;

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
function checkFileExtension(ext) {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showWarningMessage('No active file');
		return;
	}

	const filePath = editor.document.uri.fsPath;
	const fileName = path.basename(filePath);

	// 1️⃣ Check spec.js
	if (!fileName.endsWith(ext)) {
		vscode.window.showInformationMessage(`Not a ${ext} file`);
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

	vscode.window.setStatusBarMessage(`✅ Headless set to ${next}`, 3000);
}

async function updateGitBashContext() {
	if (process.platform !== 'win32') return;

	try {
		const { stdout } = await execAsync(
			'tasklist /FI "IMAGENAME eq mintty.exe"'
		);

		const isRunning = stdout.toLowerCase().includes('mintty.exe');

		await vscode.commands.executeCommand(
			'setContext',
			'oneClickRun.gitBashRunning',
			isRunning
		);

		console.log("Git Bash running:", isRunning);

	} catch (err) {
		console.error(err);
	}
}

async function updateExecuteScriptContext() {
	const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
	if (!workspaceFolder) {
		await vscode.commands.executeCommand(
			'setContext',
			'oneClickRun.hasExecuteScript',
			false
		);
		return;
	}

	const workspaceRoot = workspaceFolder.uri.fsPath;
	const scriptPath = path.join(workspaceRoot, 'executeScripts.sh');

	const exists = fs.existsSync(scriptPath);

	await vscode.commands.executeCommand(
		'setContext',
		'oneClickRun.hasExecuteScript',
		exists
	);
}
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
