/**
 * 应用真值清单——本包的核心资产。
 *
 * 纪律（贡献者必读）：
 * 1. 只追加与修错，不做破坏性删除（id 是公开 API，宿主在持久化存储里引用它）。
 * 2. 每条 verification 必须诚实：tested 才能写 tested，来源+日期写进 notes。
 * 3. scheme 真值只能来自真机实测或官方文档，禁止「看起来像」的推测。
 * 4. 修错（如包名变更）在 CHANGELOG 里记录，旧值写进 notes 供考古。
 */
import type { AppEntry } from './types';

export const APP_REGISTRY: AppEntry[] = [
  // ---------- AI 对话类 ----------
  {
    id: 'deepseek',
    name: 'DeepSeek',
    androidPackage: 'com.deepseek.chat',
    androidScheme: 'dpsk://chat/new',
    iosScheme: 'dpsk://',
    harmonyScheme: 'dpsk://',
    webUrl: 'https://chat.deepseek.com/',
    category: 'ai',
    intlAvailable: false,
    verification: {
      level: 'tested',
      notes: {
        android:
          '2026-10 Xiaomi 2203121C 真机：pm list packages 实测包名 com.deepseek.chat（曾误传 com.deepseek.ai）；scheme dpsk://chat/new 实测拉起。queries 可见性已验。',
        ios: 'dpsk:// 来自社区资料与 Android 同源推测，未真机验证。',
      },
    },
  },
  {
    id: 'doubao',
    name: 'Doubao (豆包)',
    androidPackage: 'com.larus.nova',
    androidScheme: 'doubao://',
    iosScheme: 'doubao://',
    webUrl: 'https://www.doubao.com/chat/',
    category: 'ai',
    intlAvailable: false,
    verification: {
      level: 'tested',
      notes: {
        android: '2026-10 真机 am start 实测 doubao:// 拉起；包名 com.larus.nova（字节系内部代号）。',
        ios: 'AASA 文件存在（com.bot.doubao）但 UL 路径仅 /share；scheme doubao:// 未真机验证。',
      },
    },
  },
  {
    id: 'qianwen',
    name: 'Qwen (通义千问)',
    androidPackage: 'com.aliyun.tongyi',
    androidScheme: 'tongyi://',
    iosScheme: 'tongyi://',
    webUrl: 'https://www.tongyi.com/',
    category: 'ai',
    intlAvailable: true,
    verification: {
      level: 'tested',
      notes: {
        android: '2026-10 真机实测 tongyi:// 拉起，包名 com.aliyun.tongyi 真机 pm list 确认。',
        ios: 'AASA 显示 iOS 包名 com.aliyun.ios.tongyi，UL 仅 /app/*；scheme 未真机验证。',
      },
    },
  },
  {
    id: 'yuanbao',
    name: 'Tencent Yuanbao (腾讯元宝)',
    androidPackage: 'com.tencent.hunyuan.app.chat',
    androidScheme: 'hunyuan://chat',
    iosScheme: 'hunyuan://',
    webUrl: 'https://yuanbao.tencent.com/chat',
    category: 'ai',
    intlAvailable: false,
    verification: {
      level: 'tested',
      notes: {
        android:
          '2026-10 Xiaomi 2203121C 真机实测：包名 com.tencent.hunyuan.app.chat（元宝由混元助手更名，包名继承）；scheme filter 要求 authority=chat，hunyuan://chat 实测拉起登录页，裸 hunyuan:// 无法 resolve。旧值 com.tencent.yuanbao / yuanbao:// 均错误。',
        ios: '官网无 AASA；hunyuan:// 为推测，未真机验证。',
      },
    },
  },
  {
    id: 'kimi',
    name: 'Kimi',
    androidPackage: 'com.moonshot.kimichat',
    androidScheme: 'kimi://',
    iosScheme: 'kimi://',
    webUrl: 'https://www.kimi.com/',
    category: 'ai',
    intlAvailable: true,
    verification: {
      level: 'official',
      notes: {
        android: '包名 com.moonshot.kimichat（应用宝在售核对）；scheme kimi:// 未真机实测拉起。',
        ios: 'AASA 存在（com.moonshot.kimichat）但 UL 仅 /wxShare/*、/app/*；scheme kimi:// 未真机验证。',
      },
    },
  },
  {
    id: 'zhipu',
    name: 'Zhipu Qingyan (智谱清言)',
    androidPackage: 'com.zhipuai.qingyan',
    androidScheme: 'zhipuai://',
    iosScheme: 'zhipuai://',
    webUrl: 'https://chatglm.cn/',
    category: 'ai',
    intlAvailable: false,
    verification: {
      level: 'tested',
      notes: {
        android:
          '2026-10 Xiaomi 2203121C 真机实测：包名 com.zhipuai.qingyan（「清言」拼音），dumpsys 显示注册 qingyan:// 与 zhipuai:// 两个 scheme，zhipuai:// 实测拉起。旧值 com.zhipu.chatglm / chatglm:// 均错误。',
        ios: '官网无 AASA；zhipuai:// 为 Android 同源推测，未真机验证。',
      },
    },
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    androidPackage: 'com.openai.chatgpt',
    androidScheme: 'openai://',
    iosScheme: 'openai://',
    webUrl: 'https://chatgpt.com/',
    category: 'ai',
    intlAvailable: true,
    verification: {
      level: 'official',
      notes: {
        android: '包名 com.openai.chatgpt（Play Store 官方）；scheme openai:// 官方文档支持。',
        ios: 'scheme openai:// 为 OpenAI 官方公开支持的 custom scheme（官方文档）。',
      },
    },
  },
  {
    id: 'claude',
    name: 'Claude',
    androidPackage: 'com.anthropic.claude',
    androidScheme: 'claude://',
    iosScheme: 'claude://',
    webUrl: 'https://claude.ai/',
    category: 'ai',
    intlAvailable: true,
    verification: {
      level: 'official',
      notes: {
        android: '包名 com.anthropic.claude（Play Store 官方）；scheme claude://。',
        ios: 'scheme claude:// Anthropic 官方支持；AASA appID com.anthropic.claude。',
      },
    },
  },
  {
    id: 'grok',
    name: 'Grok',
    androidPackage: 'ai.x.grok',
    androidScheme: 'grok://',
    iosScheme: 'grok://',
    webUrl: 'https://grok.com/',
    category: 'ai',
    intlAvailable: true,
    verification: {
      level: 'official',
      notes: {
        android: '包名 ai.x.grok（Play Store 网页版核对，开发者 x.ai；曾误传 com.x.grok）。',
        ios: 'AASA appID ai.x.GrokApp 存在；scheme grok:// 未真机验证。',
      },
    },
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    androidPackage: 'com.google.android.apps.bard',
    androidScheme: 'gemini://',
    iosScheme: 'gemini://',
    webUrl: 'https://gemini.google.com/app',
    category: 'ai',
    intlAvailable: true,
    verification: {
      level: 'unverified',
      notes: {
        android: '包名 com.google.android.apps.bard（Play Store 官方，历史代号 bard）。',
        ios: 'Google 惯例不用 custom scheme；iOS 大概率只能走网页。未真机验证。',
      },
    },
  },
];

/** 按 id 查询 */
export function findApp(id: string): AppEntry | undefined {
  return APP_REGISTRY.find((a) => a.id === id);
}

/**
 * 生成 Android 11+ <queries> 包可见性清单（全部已知包名）。
 * Expo 宿主用 plugin/with-open-apps-queries.js 自动注入；
 * 裸 RN 宿主把返回值写进自己的 AndroidManifest。
 */
export function androidQueryPackages(): string[] {
  return APP_REGISTRY.filter((a) => a.androidPackage).map((a) => a.androidPackage as string);
}

/**
 * 生成 iOS LSApplicationQueriesSchemes 白名单（全部可能尝试的 scheme，
 * 含每个 App 的候补 scheme）。Info.plist 里声明后 canOpenURL 才可用。
 */
export function iosQuerySchemes(): string[] {
  const schemes = new Set<string>();
  for (const a of APP_REGISTRY) {
    const all = [a.iosScheme, ...(a.iosQuerySchemes ?? [])].filter(Boolean) as string[];
    for (const s of all) schemes.add(s.replace(/:\/\/$/, '').replace(/:.*$/, ''));
  }
  return [...schemes];
}
