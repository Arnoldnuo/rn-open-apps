# rn-open-apps

React Native / Expo 包：**唤起常见第三方 App**（AI 对话类为主），带一份**真机实测验证过的**应用清单（包名 / URL scheme / 网页兜底），并解决 Android 11+ 包可见性这个隐坑。支持 Android / iOS / HarmonyOS。

[![CI](https://github.com/Arnoldnuo/rn-open-apps/actions/workflows/ci.yml/badge.svg)](https://github.com/Arnoldnuo/rn-open-apps/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/rn-open-apps.svg)](https://www.npmjs.com/package/rn-open-apps)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Why / 为什么造这个轮子

「从我的 App 跳到用户手机上的某个 AI App」看起来简单，实际坑一片：

1. **包名没有规范**：元宝的包名是 `com.tencent.hunyuan.app.chat`（由混元助手更名而来），智谱清言是 `com.zhipuai.qingyan`（「清言」拼音）——靠猜必错，只能真机 `dumpsys` 验证。
2. **scheme 各家自定**：DeepSeek 是 `dpsk://chat/new`，元宝要求 `hunyuan://chat`（必须带 authority，裸 `hunyuan://` 系统不 resolve）。
3. **Android 11+ 包可见性**：不在 manifest `<queries>` 里声明的包，`getLaunchIntentForPackage` 返回 null，按包名唤起**静默失败**——大量老库（2021 年前后停更）都栽在这里。
4. **iOS 没有「按包名唤起」**：只有 scheme 和 Universal Links，而各家 UL 只覆盖分享页，聊天首页不拉 App，scheme 是唯一通道。

现有开源包（react-native-app-link 等）在 2021 年前后停更，且没有任何一个内置 AI App 的真值数据。本包的核心资产就是这份**带可信度标注、真机实测过的清单**。

## Install

```bash
npm install rn-open-apps
```

Expo 宿主在 `app.json` 加插件（自动注入 `<queries>` 包可见性，Android 11+ 必需）：

```json
{
  "expo": {
    "plugins": ["rn-open-apps/plugin/with-open-apps-queries"]
  }
}
```

非 Expo 的裸 RN 宿主：把 `androidQueryPackages()` 的返回值手写进 `AndroidManifest.xml` 的 `<queries>`；iOS 把 `iosQuerySchemes()` 的返回值写进 `Info.plist` 的 `LSApplicationQueriesSchemes`。

## Usage

```tsx
import {
  APP_REGISTRY,
  createRnAdapter,
  findApp,
  launchApp,
  tryLaunchInOrder,
} from 'rn-open-apps';
import * as IntentLauncher from 'expo-intent-launcher';

// 初始化一次（模块级）
const adapter = createRnAdapter({
  // Android 按包名拉起（expo-intent-launcher）；非 Expo 宿主注入自己的实现
  openApplication: (pkg) => IntentLauncher.openApplication(pkg),
});

// ① 唤起指定 App（scheme → Android 包名 → 网页兜底）
const result = await launchApp(adapter, findApp('deepseek')!);
// result: { opened: true, via: 'scheme' | 'package' | 'web', appId: 'deepseek', attempts: [...] }

// ② 依次尝试，返回第一个真打开的 App（绝落不进浏览器）
const order = ['deepseek', 'doubao', 'qianwen', 'chatgpt']
  .map(findApp)
  .filter((a): a is NonNullable<typeof a> => Boolean(a));
const hit = await tryLaunchInOrder(adapter, order);
if (hit) {
  // hit.app / hit.via —— 打开的是哪个、走哪条通道
} else {
  // 全没装 → 你自己决定要不要提示/跳应用市场
}
```

### 不想要兜底开网页？

```ts
const strict = await launchApp(adapter, findApp('kimi')!, { fallbackToWeb: false });
// strict.opened === false 表示没装（scheme 和包名都失败），不会打开浏览器
```

### 只想要数据，逻辑自己写？

```ts
import { APP_REGISTRY, androidQueryPackages, iosQuerySchemes } from 'rn-open-apps';
// APP_REGISTRY: AppEntry[] —— 每条含 androidPackage / androidScheme / iosScheme / webUrl / verification
```

## Data credibility / 数据可信度

每条清单数据都带 `verification` 标注，**诚实分级**：

| level | 含义 |
|---|---|
| `tested` | 真机装了目标 App 后实测拉起成功（adb `am start` / `dumpsys`） |
| `official` | 官方文档 / 应用商店在售信息核对 |
| `unverified` | 社区资料或合理推测，未实测 |

目前 Android 侧主流 AI App（DeepSeek/豆包/千问/元宝/智谱清言）为真机 tested 级；iOS 侧 scheme 大多未真机验证（欢迎拿 iPhone 实测后提 PR，`tested` 数据是本包最欢迎的贡献）。

## API

### `APP_REGISTRY: AppEntry[]`

内置清单。`AppEntry` 字段：`id` / `name` / `androidPackage` / `androidScheme` / `iosScheme` / `harmonyScheme` / `webUrl` / `verification` / `category` / `intlAvailable`。

### `findApp(id): AppEntry | undefined`

### `launchApp(adapter, app, options?): Promise<LaunchResult>`

单 App 唤起。策略顺序：scheme → Android 包名（需可见）→ 网页（`fallbackToWeb` 默认 true）。`attempts` 记录全部尝试轨迹。

### `tryLaunchInOrder(adapter, apps): Promise<{ app, via, attempts } | null>`

依次尝试，命中第一个「真打开 App」的（scheme/包名成功）；全失败返回 null，**绝不落浏览器**。

### `createRnAdapter(options): PlatformAdapter`

RN/Expo 适配器。`openApplication` 接 expo-intent-launcher 或你的原生实现；不传则 Android 包名兜底自动禁用。

### `androidQueryPackages(): string[]` / `iosQuerySchemes(): string[]`

给 manifest / Info.plist 用的派生清单。

## Contributing / 贡献

最有价值的贡献是**真机实测数据**：

1. Android：`adb shell dumpsys package <pkg> | grep -A6 "Scheme:"` 读注册 scheme，`adb shell am start -a android.intent.action.VIEW -d "<scheme>://..."` 实测拉起。
2. iOS：Safari 地址栏输 scheme，弹「在 XX 中打开？」即真值。
3. 改 `src/registry.ts`，`verification.notes` 写清来源与日期，跑 `npm test`（结构校验会挡不合规条目），提 PR。

数据纪律：id 只加不改不删；`tested` 必须附实测记录；修错在 CHANGELOG 记旧值。

## Test

```bash
npm test        # vitest：数据完整性 + 编排逻辑全链路（mock adapter，24 用例）
npm run build   # tsc + esbuild
```

CI（GitHub Actions）在每次 push 跑 build + test。

## License

MIT
