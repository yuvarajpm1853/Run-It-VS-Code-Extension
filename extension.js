// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const isWindows = process.platform === 'win32';
const lineDelimiter = isWindows ? '\r\n' : '\n';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "helloWorld" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('copyRelativePath.Workspace', function (arg1, arg2) {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Copied Relative Path');
		let relativePaths = returnRelativePath(arg1, arg2)
		if (relativePaths.length > 0) {
			vscode.env.clipboard.writeText(relativePaths.join(lineDelimiter));
		}
	});
	const disposable1 = vscode.commands.registerCommand('run.ExecutionScripts', function (arg1, arg2) {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		// vscode.window.showInformationMessage('');

		let relativePaths = returnRelativePath(arg1, arg2)
		let i = relativePaths.join(lineDelimiter)
		console.log(i);


	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(disposable1);
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
		return relativePaths;
	}
	else return undefined
}
// This method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
