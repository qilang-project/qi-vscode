# Qi Language VSCode Extension

Qi 编程语言的 Visual Studio Code 扩展，提供语法高亮、代码片段和语言服务器集成。

## 功能特性

### 🎨 语法高亮
- **中文关键字支持**: 完整支持 Qi 语言的中文关键字
- **类型系统高亮**: 区分基本类型、集合类型和自定义类型
- **函数和方法**: 特殊高亮函数声明和调用
- **注释和字符串**: 支持单行、多行注释和字符串字面量
- **数字和操作符**: 区分不同数字类型和操作符

### 🧩 代码片段
- **常用代码模板**: 快速插入函数、循环、条件语句等
- **中文触发词**: 使用中文关键字触发代码片段
- **智能占位符**: 支持变量名和类型的快速替换

### 🔧 语言服务器集成
- **自动发现**: 自动查找系统中的 qi-lsp 可执行文件
- **智能补全**: 代码补全和参数提示
- **语义诊断**: 实时错误检查和类型验证
- **跳转定义**: 快速跳转到符号定义
- **查找引用**: 查找符号的所有引用

### 🎭 主题支持
- **Qi Dark**: 专为 Qi 语言设计的深色主题
- **Qi Light**: 专为 Qi 语言设计的浅色主题
- **中文优化**: 针对中文字符优化的颜色方案

## 安装

### 从 VSCode Marketplace 安装
1. 打开 VSCode
2. 按 `Ctrl+Shift+X` (Windows/Linux) 或 `Cmd+Shift+X` (macOS) 打开扩展面板
3. 搜索 "Qi Language"
4. 点击安装

### 手动安装
1. 下载 `.vsix` 文件
2. 在 VSCode 中按 `Ctrl+Shift+P` (Windows/Linux) 或 `Cmd+Shift+P` (macOS)
3. 输入 "Extensions: Install from VSIX"
4. 选择下载的 `.vsix` 文件

## 配置

### 语言服务器设置
在 VSCode 设置中搜索 "Qi Language" 来配置以下选项：

```json
{
  "qi.languageServer.enabled": true,        // 启用语言服务器
  "qi.languageServer.path": "",             // 语言服务器路径（留空自动查找）
  "qi.languageServer.debug": false,          // 启用调试模式
  "qi.formatting.enabled": true,             // 启用代码格式化
  "qi.formatting.indentSize": 4,             // 格式化缩进大小
  "qi.completion.enabled": true,             // 启用代码补全
  "qi.diagnostics.enabled": true             // 启用语义诊断
}
```

### 代码片段
支持以下代码片段（使用中文触发词）：

| 触发词 | 描述 |
|--------|------|
| `包` | 包声明 |
| `函数` | 函数声明 |
| `异步函数` | 异步函数声明 |
| `变量` | 变量声明 |
| `如果` | 条件语句 |
| `当` | while 循环 |
| `对于` | for 循环 |
| `循环` | 无限循环 |
| `返回` | 返回语句 |
| `结构体` | 结构体声明 |
| `枚举` | 枚举声明 |
| `导入` | 导入语句 |
| `打印` | 打印语句 |
| `等待` | 等待表达式 |

### 主题设置
1. 按 `Ctrl+Shift+P` (Windows/Linux) 或 `Cmd+Shift+P` (macOS)
2. 输入 "Preferences: Color Theme"
3. 选择 "Qi Dark" 或 "Qi Light"

## 开发

### 环境要求
- Node.js 18.x 或更高版本
- npm 或 yarn
- Visual Studio Code

### 安装依赖
```bash
npm install
```

### 编译
```bash
npm run compile
```

### 测试
```bash
npm test
```

### 代码检查
```bash
npm run lint
```

### 打包
```bash
npm run package
```

### 调试
1. 按 `F5` 启动调试会话
2. 在新的 VSCode 窗口中打开 `.qi` 文件测试扩展

### 项目结构
```
qi-vscode/
├── src/                    # 源代码
│   └── extension.ts       # 主扩展文件
├── syntaxes/               # 语法文件
│   └── qi.tmLanguage.json # TextMate 语法
├── snippets/               # 代码片段
│   └── qi.code-snippets   # Qi 代码片段
├── themes/                 # 主题文件
│   ├── qi-dark.json      # 深色主题
│   └── qi-light.json     # 浅色主题
├── test/                   # 测试文件
├── package.json           # 扩展清单
├── tsconfig.json          # TypeScript 配置
└── README.md             # 说明文档
```

## 语言服务器集成

扩展会自动查找系统中的 `qi-lsp` 可执行文件，搜索路径包括：
- 系统 PATH
- `~/.local/bin`
- `~/.cargo/bin`
- `/usr/local/bin` (macOS/Linux)
- `/opt/homebrew/bin` (macOS Apple Silicon)

### 自定义语言服务器路径
如果自动查找失败，可以在设置中指定路径：

```json
{
  "qi.languageServer.path": "/path/to/qi-lsp"
}
```

## 故障排除

### 语言服务器未启动
1. 确认已安装 `qi-lsp`
2. 检查设置中的语言服务器路径
3. 查看输出面板的 "Qi Language Server" 频道

### 语法高亮不工作
1. 确认文件扩展名为 `.qi`
2. 检查 VSCode 右下角的语言模式是否显示为 "Qi"
3. 尝试重新加载窗口 (`Ctrl+R` 或 `Cmd+R`)

### 代码片段不工作
1. 确认已启用扩展
2. 检查是否在其他语言的文件中尝试使用 Qi 片段
3. 尝试重启 VSCode

## 贡献

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 相关链接

- [Qi 语言官网](https://qi-lang.org)
- [Qi 编译器](https://github.com/qi-lang/qi-compiler)
- [Qi 语言服务器](https://github.com/qi-lang/qi-lsp)
- [VSCode 扩展开发指南](https://code.visualstudio.com/api)

## 更新日志

### v0.1.0
- 初始版本发布
- 基础语法高亮支持
- 代码片段支持
- 语言服务器集成
- Qi 主题支持