import * as vscode from 'vscode';
import * as path from 'path';
import { LanguageClient, LanguageClientOptions, ServerOptions } from 'vscode-languageclient/node';

let client: LanguageClient;

export function activate(context: vscode.ExtensionContext) {
    console.log('Qi 语言扩展正在激活...');

    // 注册语言服务器客户端
    const languageServerDisposable = registerLanguageServer(context);
    context.subscriptions.push(languageServerDisposable);

    // 注册命令
    const restartCommand = vscode.commands.registerCommand('qi.restartLanguageServer', () => {
        restartLanguageServer();
    });
    context.subscriptions.push(restartCommand);

    const showOutputCommand = vscode.commands.registerCommand('qi.showLanguageServerOutput', () => {
        showLanguageServerOutput();
    });
    context.subscriptions.push(showOutputCommand);

    // 注册符号导航命令
    const showWorkspaceSymbolsCommand = vscode.commands.registerCommand('qi.showWorkspaceSymbols', () => {
        if (client) {
            vscode.commands.executeCommand('workbench.action.showAllSymbols');
        }
    });
    context.subscriptions.push(showWorkspaceSymbolsCommand);

    const renameSymbolCommand = vscode.commands.registerCommand('qi.renameSymbol', async () => {
        if (client) {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                await vscode.commands.executeCommand('editor.action.rename');
            }
        }
    });
    context.subscriptions.push(renameSymbolCommand);

    const findReferencesCommand = vscode.commands.registerCommand('qi.findReferences', async () => {
        if (client) {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                await vscode.commands.executeCommand('editor.action.findReferences');
            }
        }
    });
    context.subscriptions.push(findReferencesCommand);

    const goToDefinitionCommand = vscode.commands.registerCommand('qi.goToDefinition', async () => {
        if (client) {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                await vscode.commands.executeCommand('editor.action.goToDeclaration');
            }
        }
    });
    context.subscriptions.push(goToDefinitionCommand);

    console.log('Qi 语言扩展已激活');
}

export function deactivate(): Thenable<void> | undefined {
    if (!client) {
        return undefined;
    }
    return client.stop();
}

function registerLanguageServer(context: vscode.ExtensionContext): vscode.Disposable {
    // 获取配置
    const config = vscode.workspace.getConfiguration('qi.languageServer');

    if (!config.get('enabled')) {
        console.log('Qi 语言服务器已禁用');
        return new vscode.Disposable(() => {});
    }

    // 查找语言服务器可执行文件
    let serverPath = config.get<string>('path');
    if (!serverPath) {
        serverPath = findLanguageServerExecutable();
    }

    if (!serverPath) {
        vscode.window.showWarningMessage(
            '未找到 Qi 语言服务器。请安装 qi-lsp 或在设置中指定路径。'
        );
        return new vscode.Disposable(() => {});
    }

    // 服务器选项
    const serverOptions: ServerOptions = {
        command: serverPath,
        args: config.get('debug') ? ['--debug'] : [],
        options: {
            cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
            env: {
                ...process.env,
                RUST_LOG: config.get('debug') ? 'debug' : 'info',
                QI_LSP_DEBUG: config.get('debug') ? '1' : '0'
            }
        }
    };

    // 客户端选项
    const clientOptions: LanguageClientOptions = {
        documentSelector: [{ scheme: 'file', language: 'qi' }],
        synchronize: {
            configurationSection: 'qi.languageServer',
            fileEvents: vscode.workspace.createFileSystemWatcher('**/.qi')
        },
        progressOnInitialization: true,
        outputChannel: vscode.window.createOutputChannel('Qi Language Server'),
        // 启用中间件
        middleware: {
            provideCompletionItem: (document: any, position: any, token: any, next: any) => {
                if (!config.get('completion.enabled')) {
                    return [];
                }
                return next(document, position, token);
            },
            provideDiagnostics: (document: any, token: any, next: any) => {
                if (!config.get('diagnostics.enabled')) {
                    return [];
                }
                return next(document, token);
            },
            provideHover: (document: any, position: any, token: any, next: any) => {
                if (!config.get('hover.enabled')) {
                    return null;
                }
                return next(document, position, token);
            },
            provideSignatureHelp: (document: any, position: any, context: any, token: any, next: any) => {
                if (!config.get('signatureHelp.enabled')) {
                    return null;
                }
                return next(document, position, context, token);
            },
            provideDefinition: (document: any, position: any, token: any, next: any) => {
                if (!config.get('definition.enabled')) {
                    return null;
                }
                return next(document, position, token);
            },
            provideReferences: (document: any, position: any, context: any, token: any, next: any) => {
                if (!config.get('references.enabled')) {
                    return [];
                }
                return next(document, position, context, token);
            },
            provideDocumentSymbols: (document: any, token: any, next: any) => {
                if (!config.get('documentSymbols.enabled')) {
                    return [];
                }
                return next(document, token);
            },
            provideDocumentHighlights: (document: any, position: any, token: any, next: any) => {
                if (!config.get('documentHighlights.enabled')) {
                    return [];
                }
                return next(document, position, token);
            },
            provideCodeActions: (document: any, range: any, context: any, token: any, next: any) => {
                if (!config.get('codeActions.enabled')) {
                    return [];
                }
                return next(document, range, context, token);
            },
            provideWorkspaceSymbols: (query: any, token: any, next: any) => {
                if (!config.get('workspaceSymbols.enabled')) {
                    return [];
                }
                return next(query, token);
            }
        }
    };

    // 创建并启动语言客户端
    client = new LanguageClient(
        'qiLanguageServer',
        'Qi Language Server',
        serverOptions,
        clientOptions
    );

    // 启动客户端
    const disposable = client.start();

    return {
        dispose: () => client.stop()
    };
}

function findLanguageServerExecutable(): string | undefined {
    const platform = process.platform;
    const isWindows = platform === 'win32';
    const executableName = isWindows ? 'qi-lsp.exe' : 'qi-lsp';

    // 常见的安装路径
    const searchPaths = [
        // 系统路径
        executableName,
        // 用户本地安装
        path.join(process.env.HOME || '', '.local', 'bin', executableName),
        path.join(process.env.HOME || '', '.cargo', 'bin', executableName),
        // macOS Homebrew
        '/usr/local/bin/' + executableName,
        '/opt/homebrew/bin/' + executableName,
        // Linux
        '/usr/bin/' + executableName,
        '/usr/local/bin/' + executableName,
        // Windows
        'C:\\Program Files\\qi-lsp\\' + executableName,
        'C:\\Program Files (x86)\\qi-lsp\\' + executableName,
        // 工作空间本地
        path.join(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '', '..', 'qi-lsp', 'target', 'release', executableName),
        path.join(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '', '..', 'qi-lsp', 'target', 'debug', executableName),
    ];

    // 检查每个路径
    for (const searchPath of searchPaths) {
        try {
            const fs = require('fs');
            if (fs.existsSync(searchPath) && fs.statSync(searchPath).isFile()) {
                return searchPath;
            }
        } catch (error) {
            // 忽略错误，继续搜索
        }
    }

    return undefined;
}

async function restartLanguageServer() {
    if (client) {
        try {
            await client.stop();
            await client.start();
            vscode.window.showInformationMessage('Qi 语言服务器已重启');
        } catch (error) {
            vscode.window.showErrorMessage(`重启语言服务器失败: ${error}`);
        }
    }
}

function showLanguageServerOutput() {
    const outputChannel = vscode.window.createOutputChannel('Qi Language Server');
    outputChannel.show();
}