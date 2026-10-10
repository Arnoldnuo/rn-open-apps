# Changelog

本包的数据条目遵循「只追加与修错」：id 是公开 API 永不删除；包名/scheme 修正必须在此记录旧值。

## 0.1.0 (2026-10-10)

首发。

- 应用清单（10 个 AI App）：DeepSeek、豆包、通义千问、腾讯元宝、Kimi、智谱清言、ChatGPT、Claude、Grok、Gemini
- Android 侧真值来自 Xiaomi 2203121C 真机实测（dumpsys + am start）：
  - 元宝 `com.tencent.hunyuan.app.chat`，scheme `hunyuan://chat`（更正流传的错误值 `com.tencent.yuanbao` / `yuanbao://`）
  - 智谱清言 `com.zhipuai.qingyan`，scheme `zhipuai://`（更正错误值 `com.zhipu.chatglm` / `chatglm://`）
  - DeepSeek `com.deepseek.chat`（更正错误值 `com.deepseek.ai`）
  - Grok `ai.x.grok`（更正错误值 `com.x.grok`）
- 唤起编排：`launchApp`（scheme → 包名 → 网页兜底）、`tryLaunchInOrder`（依次尝试，不落浏览器）
- Expo config plugin：`rn-open-apps/plugin/with-open-apps-queries` 自动注入 Android 11+ `<queries>`
- 24 个单测：数据完整性校验 + mock adapter 全链路编排测试
