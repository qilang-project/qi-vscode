import * as vscode from 'vscode';
import * as path from 'path';
import { LanguageClient, LanguageClientOptions, ServerOptions } from 'vscode-languageclient/node';

let client: LanguageClient;
let outputChannel: vscode.OutputChannel;

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

    const buildCommand = vscode.commands.registerCommand('qi.build', async () => {
        await buildCurrentFile();
    });
    context.subscriptions.push(buildCommand);

    // 监听 Qi 文件打开事件，确保 LSP 启动
    const onOpenQiFile = vscode.workspace.onDidOpenTextDocument((document) => {
        if (document.languageId === 'qi' && !client) {
            console.log('检测到 Qi 文件打开，启动语言服务器...');
            const languageServerDisposable = registerLanguageServer(context);
            context.subscriptions.push(languageServerDisposable);
        }
    });
    context.subscriptions.push(onOpenQiFile);

    // 如果当前已经有打开的 Qi 文件，立即启动 LSP
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor && activeEditor.document.languageId === 'qi' && !client) {
        console.log('检测到当前是 Qi 文件，启动语言服务器...');
        const languageServerDisposable = registerLanguageServer(context);
        context.subscriptions.push(languageServerDisposable);
    }

    // 监听配置变更
    const configChangeDisposable = vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration('qi.languageServer.enabled')) {
            const config = vscode.workspace.getConfiguration('qi.languageServer');
            if (config.get('enabled')) {
                if (!client) {
                    console.log('LSP 配置已启用，启动语言服务器...');
                    const languageServerDisposable = registerLanguageServer(context);
                    context.subscriptions.push(languageServerDisposable);
                }
            } else {
                if (client) {
                    console.log('LSP 配置已禁用，停止语言服务器...');
                    client.stop().then(() => {
                        (client as any) = undefined;
                    });
                }
            }
        }
    });
    context.subscriptions.push(configChangeDisposable);

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

    // 确保输出 channel 已创建（只创建一次）
    if (!outputChannel) {
        outputChannel = vscode.window.createOutputChannel('Qi Language Server');
    }

    // 查找语言服务器可执行文件
    let serverPath = config.get<string>('path');
    if (!serverPath) {
        serverPath = findLanguageServerExecutable();
    }

    // 如果自动查找失败，尝试相对路径
    if (!serverPath) {
        const possiblePaths = [
            path.join(__dirname, '..', '..', 'qi-lsp', 'target', 'release', 'qi-lsp'),
            path.join(__dirname, '..', 'qi-lsp', 'target', 'release', 'qi-lsp'),
            path.join(process.cwd(), 'qi-lsp', 'target', 'release', 'qi-lsp'),
        ];

        for (const possiblePath of possiblePaths) {
            console.log('尝试路径:', possiblePath);
            try {
                const fs = require('fs');
                if (fs.existsSync(possiblePath) && fs.statSync(possiblePath).isFile()) {
                    serverPath = possiblePath;
                    console.log('✅ 找到 LSP 服务器:', serverPath);
                    break;
                }
            } catch (error) {
                console.log('路径无效:', possiblePath, error);
            }
        }
    }

    if (!serverPath) {
        vscode.window.showWarningMessage(
            '未找到 Qi 语言服务器。请安装 qi-lsp 或在设置中指定路径。查看开发者控制台了解详细信息。'
        );
        return new vscode.Disposable(() => {});
    }

    console.log('找到 Qi 语言服务器: ' + serverPath);

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
            fileEvents: vscode.workspace.createFileSystemWatcher('**/*.qi')
        },
        progressOnInitialization: true,
        outputChannel: outputChannel,
        // 启用中间件
        middleware: {
            provideCompletionItem: (document: any, position: any, token: any, next: any) => {
                if (!config.get('completion.enabled')) {
                    return [];
                }
                return next(document, position, token);
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
    console.log('创建语言客户端...');
    client = new LanguageClient(
        'qiLanguageServer',
        'Qi Language Server',
        serverOptions,
        clientOptions
    );

    console.log('启动语言客户端...');
    // 启动客户端
    const disposable = client.start();
    console.log('语言客户端已启动');

    return {
        dispose: () => client.stop()
    };
}

function findLanguageServerExecutable(): string | undefined {
    const platform = process.platform;
    const isWindows = platform === 'win32';
    const executableName = isWindows ? 'qi-lsp.exe' : 'qi-lsp';

    console.log('搜索 Qi 语言服务器: ' + executableName);

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
        // 工作空间本地 - 多种可能的相对路径
        path.join(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '', 'qi-lsp', 'target', 'release', executableName),
        path.join(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '', 'qi-lsp', 'target', 'debug', executableName),
        path.join(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '', '..', 'qi-lsp', 'target', 'release', executableName),
        path.join(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '', '..', 'qi-lsp', 'target', 'debug', executableName),
        // 如果扩展在 qi-vscode 目录，尝试相邻的 qi-lsp 目录
        path.join(__dirname, '..', '..', 'qi-lsp', 'target', 'release', executableName),
        path.join(__dirname, '..', 'qi-lsp', 'target', 'release', executableName),
    ];

    // 检查每个路径
    console.log('检查以下路径:');
    for (const searchPath of searchPaths) {
        console.log('  - ' + searchPath);
        try {
            const fs = require('fs');
            if (fs.existsSync(searchPath) && fs.statSync(searchPath).isFile()) {
                console.log('✅ 找到: ' + searchPath);
                return searchPath;
            }
        } catch (error) {
            console.log('  ❌ 错误: ' + error);
        }
    }

    console.log('❌ 未找到 Qi 语言服务器');
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
    if (outputChannel) {
        outputChannel.show();
    } else {
        vscode.window.showInformationMessage('Qi 语言服务器输出尚未初始化');
    }
}

async function buildCurrentFile() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage('没有打开的文件');
        return;
    }

    if (editor.document.languageId !== 'qi') {
        vscode.window.showWarningMessage('当前文件不是 Qi 源文件');
        return;
    }

    if (!client) {
        vscode.window.showErrorMessage('Qi 语言服务器未启动');
        return;
    }

    // 保存文件
    await editor.document.save();

    const uri = editor.document.uri.toString();
    const config = vscode.workspace.getConfiguration('qi.build');
    const mode = config.get<string>('mode', 'debug');

    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: '正在构建 Qi 文件...',
        cancellable: false
    }, async () => {
        try {
            const result = await client.sendRequest('qi/build', {
                uri: uri,
                mode: mode
            });

            const buildResult = result as any;

            if (buildResult.success) {
                const executablePath = buildResult.executable_path;
                const duration = buildResult.duration_ms;

                let message = `✅ 构建成功! (${duration}ms)`;
                if (buildResult.warnings && buildResult.warnings.length > 0) {
                    message += `\n⚠️ ${buildResult.warnings.length} 个警告`;
                }

                const action = await vscode.window.showInformationMessage(
                    message,
                    '打开可执行文件位置',
                    '运行'
                );

                if (action === '打开可执行文件位置') {
                    const executableUri = vscode.Uri.file(executablePath);
                    await vscode.commands.executeCommand('revealFileInOS', executableUri);
                } else if (action === '运行') {
                    const terminal = vscode.window.createTerminal('Qi 程序');
                    terminal.show();
                    terminal.sendText(executablePath);
                }
            } else {
                const error = buildResult.error || '未知错误';
                vscode.window.showErrorMessage(`❌ 构建失败: ${error}`);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`构建出错: ${error}`);
        }
    });
}