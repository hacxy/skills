# README Template

## English (README.md)

```markdown
<div align="center">

# Project Name

[![Version](https://img.shields.io/npm/v/package-name)](https://www.npmjs.com/package/package-name)
[![License](https://img.shields.io/npm/l/package-name)](LICENSE)
[![Build Status](https://github.com/user/repo/actions/workflows/ci.yml/badge.svg)](https://github.com/user/repo/actions)

> One-line description of what this project does and why it exists.

</div>

## Quick Start

```bash
# Install
npm install package-name

# Use
import { something } from 'package-name'

const result = something()
console.log(result)
```

## Features

- **Feature 1** — Brief description
- **Feature 2** — Brief description
- **Feature 3** — Brief description

## Installation

```bash
# npm
npm install package-name

# yarn
yarn add package-name

# pnpm
pnpm add package-name
```

## Usage

```javascript
// Example code that demonstrates core functionality
import { something } from 'package-name'

// Step 1: Do this
const config = { key: 'value' }

// Step 2: Do that
const result = something(config)

// Step 3: Get result
console.log(result)
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE)

```

## 中文 (README_ZH.md)

```markdown
<div align="center">

# 项目名称

[![Version](https://img.shields.io/npm/v/package-name)](https://www.npmjs.com/package/package-name)
[![License](https://img.shields.io/npm/l/package-name)](LICENSE)
[![Build Status](https://github.com/user/repo/actions/workflows/ci.yml/badge.svg)](https://github.com/user/repo/actions)

> 一句话描述这个项目做什么以及为什么存在。

</div>

## 快速开始

```bash
# 安装
npm install package-name

# 使用
import { something } from 'package-name'

const result = something()
console.log(result)
```

## 特性

- **特性 1** — 简要描述
- **特性 2** — 简要描述
- **特性 3** — 简要描述

## 安装

```bash
# npm
npm install package-name

# yarn
yarn add package-name

# pnpm
pnpm add package-name
```

## 用法

```javascript
// 展示核心功能的示例代码
import { something } from 'package-name'

// 步骤 1: 做这个
const config = { key: 'value' }

// 步骤 2: 做那个
const result = something(config)

// 步骤 3: 获取结果
console.log(result)
```

## 贡献

参见 [CONTRIBUTING.md](CONTRIBUTING.md) 了解贡献指南。

## 许可证

[MIT](LICENSE)

```

## 暗/亮模式 Logo 示例

```html
<div align="center">
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./assets/logo-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="./assets/logo-light.svg">
  <img alt="Project Logo" src="./assets/logo-light.svg" width="200">
</picture>
</div>
```

## 徽章推荐组合

| 类型 | 示例 | 用途 |
| ------ | ------ | ------ |
| 版本 | `npm/v/package-name` | 显示当前版本 |
| CI | `github/actions/workflow/status` | 构建状态 |
| 许可证 | `npm/l/package-name` | 法律合规 |
| 下载量 | `npm/dm/package-name` | 项目热度 |
| 覆盖率 | `codecov/c/branch` | 代码质量（可选） |
