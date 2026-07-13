# Visual Feedback Bridge

**选择网页元素 → 添加批注 → 为 Code Agent 导出结构化上下文**

这是一个 Chrome/Edge 扩展，可让你在任意网页上标记开发反馈，并导出机器可读文件，供 Claude Code、Cursor、Codex 或 Aider 等工具根据反馈完成修改。

---

## 项目概述

前端评审意见通常比较模糊，并且分散在 Figma 评论、Slack 消息或便签中。Code Agent 需要 CSS Selector、计算样式、边界框和 HTML 片段等结构化上下文，才能定位正确的组件并进行精确修改。

Visual Feedback Bridge 会在你添加批注时自动采集这些上下文，并将其导出为适合 AI 辅助代码编辑的格式。

---

## MVP 功能

- **元素选择** — 鼠标悬停时高亮元素并显示元素信息；单击后锁定目标
- **批注输入** — 为选中的元素填写自然语言修改要求
- **上下文采集** — 采集 CSS Selector、XPath、边界框、计算样式、属性、outerHTML 和视口信息
- **编号标记** — 在已批注元素上方持续显示编号徽标，并在滚动或调整窗口大小时更新位置
- **批注面板** — 在侧边面板中查看列表、按状态筛选、编辑、删除和定位批注
- **状态管理** — 将批注标记为已解决；使用不同样式区分已解决和失效的批注
- **持久化存储** — 通过 `chrome.storage.local` 保存批注，刷新页面后仍可使用
- **JSON 导出** — 导出机器可读的结构化文件
- **Markdown 导出** — 导出可直接复制给 Code Agent 的文件
- **截图** — 可为每条批注附加当前视口截图
- **键盘快捷键** — `Alt+A`、`Alt+S`、`Escape`、`Alt+L`
- **Shadow DOM 隔离** — 扩展 UI 的样式不会影响宿主网页
- **扩展弹窗** — 显示批注数量，并提供启用、停用、导出和清空操作

---

## 安装

```bash
npm install
npm run build
```

然后在 Chrome 或 Edge 中加载未打包的扩展程序：

1. 打开 `chrome://extensions`（Edge 请打开 `edge://extensions`）
2. 开启右上角的**开发者模式**
3. 点击**加载已解压的扩展程序**
4. 选择本项目中的 `dist/` 文件夹

---

## 使用方法

### 启动批注模式

点击浏览器工具栏中的扩展图标，打开扩展弹窗。  
点击 **Enable Annotation Mode**，页面右下角将出现悬浮工具栏。

也可以在任意网页上按 `Alt + A`。

### 为元素添加批注

1. 点击悬浮工具栏中的**光标图标**，或按 `Alt + S`
2. 移动鼠标，蓝色高亮框会跟随当前元素
3. 点击目标元素
4. 在对话框中输入修改要求
5. 点击 **Save annotation**，或按 `Ctrl + Enter`

保存后，目标元素旁会显示一个编号徽标。

### 管理批注

- 点击编号徽标，可在侧边面板中打开对应批注
- 按 `Alt + L` 可显示或隐藏完整批注列表
- **Locate** — 滚动到目标元素，并短暂高亮显示
- **Edit** — 直接编辑批注内容
- **Resolve / Reopen** — 切换批注状态；已解决的批注显示为绿色
- **Delete** — 删除批注及其编号徽标

### 导出

点击悬浮工具栏或扩展弹窗中的 **Export JSON** 或 **Export Markdown**。

文件会以带日期的名称保存到浏览器下载文件夹，例如：

```
visual-feedback-dashboard-2026-07-10.json
visual-feedback-dashboard-2026-07-10.md
```

---

## 导出格式

### JSON

结构化数据包含完整 DOM 上下文、Selector、边界框、计算样式和可选的截图 Data URL。  
适用于 Code Agent 或自定义工具进行程序化处理。

### Markdown

面向用户和 Code Agent 的可读文档。  
包含页面元数据、通用处理要求，以及每条批注对应的元素摘要、Selector、样式和 HTML 片段。  
可以直接粘贴到 Claude、Codex、Cursor 对话或其他 AI 辅助编辑工具中。

---

## 键盘快捷键

| 快捷键 | 操作 |
|----------|--------|
| `Alt + A` | 启用或停用批注模式 |
| `Alt + S` | 进入元素选择模式 |
| `Escape` | 取消当前选择 |
| `Alt + L` | 显示或隐藏批注列表 |
| `Ctrl + Enter` | 在对话框中保存批注 |

---

## Demo 页面

在 Chrome 中打开 `demo/index.html` 并加载扩展，可测试以下场景：

- 嵌套元素
- 多个相似按钮
- 表格和表单输入框
- 可滚动区域
- 响应式布局
- DOM 发生变化后的 Selector 稳定性

建议通过本地服务器运行，以避免 `file://` 协议限制：

```bash
npx serve demo
```

---

## 已知限制

- **无法自动定位源文件** — 扩展不会将批注自动映射到 React/Vue 组件文件
- **不会自动修改代码** — 需要手动将导出文件交给 Code Agent
- **DOM 变化可能导致元素定位失败** — 如果页面在添加批注后重新渲染，保存的 CSS Selector 可能无法继续指向同一元素；批注会被保留，但标记为可能失效
- **不支持浏览器内部页面** — 无法批注 `chrome://`、`edge://` 和 Chrome 应用商店等页面
- **截图中的跨域资源可能缺失** — `html2canvas` 可能无法捕获 iframe 或跨域图片中的内容
- **不支持多人协作** — 批注仅保存在当前浏览器中
- **不支持云端同步** — 数据只存储在 `chrome.storage.local` 中

---

## Roadmap

- [ ] MCP Server — 以工具调用的形式向 AI Agent 提供批注
- [ ] Vite 插件 — 在构建时向元素注入源文件位置
- [ ] React DevTools 集成 — 将批注定位到组件文件
- [ ] Vue DevTools 集成 — 为 Vue 提供同等能力
- [ ] 自动调用 Code Agent — 提供一键调用 API 的“Fix this”功能
- [ ] 修改前后截图对比
- [ ] 附加 Git diff
- [ ] 在不同标签页之间同步批注状态
- [ ] 导出为 Figma 批注

---

## 工程脚本

```bash
npm run dev          # 监听文件变化并重新构建
npm run build        # 类型检查并执行生产构建
npm run typecheck    # 仅执行 tsc --noEmit
npm run lint         # 执行 ESLint
```
