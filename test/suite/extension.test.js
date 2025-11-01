"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("assert"));
const vscode = __importStar(require("vscode"));
const mocha_1 = require("mocha");
suite('Extension Test Suite', () => {
    (0, mocha_1.before)(() => {
        vscode.window.showInformationMessage('Start all tests.');
    });
    (0, mocha_1.after)(() => {
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
        }
        else {
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
//# sourceMappingURL=extension.test.js.map