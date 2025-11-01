import * as assert from 'assert';
import * as vscode from 'vscode';
import { after, before } from 'mocha';

suite('Extension Test Suite', () => {
    before(() => {
        vscode.window.showInformationMessage('Start all tests.');
    });

    after(() => {
        vscode.window.showInformationMessage('All tests done!');
    });

    test('Extension should be present', () => {
        assert.ok(vscode.extensions.getExtension('qi-language.qi-language'));
    });

    test('Extension should activate', async () => {
        const extension = vscode.extensions.getExtension('qi-language.qi-language');
        if (extension) {
            await extension.activate();
            assert.ok(true);
        } else {
            assert.fail('Extension not found');
        }
    });

    test('Extension should register commands', async () => {
        const commands = await vscode.commands.getCommands();
        const restartCommand = commands.includes('qi.restartLanguageServer');
        const showOutputCommand = commands.includes('qi.showLanguageServerOutput');

        assert.ok(restartCommand, 'Restart language server command should be registered');
        assert.ok(showOutputCommand, 'Show language server output command should be registered');
    });

    test('Extension should provide Qi language configuration', () => {
        const qiConfig = vscode.workspace.getConfiguration('qi');
        assert.ok(qiConfig, 'Qi configuration should be available');

        const languageServerConfig = qiConfig.get('languageServer');
        assert.ok(languageServerConfig, 'Language server configuration should be available');
    });
});