/**
 * rn-open-apps 类型定义。
 *
 * 设计原则：核心逻辑（launcher.ts）不直接 import react-native，
 * 而是通过 PlatformAdapter 注入平台能力——单测可完全 mock，
 * 包本身保持纯 JS/TS、零原生代码，永不吃 RN 新架构兼容性的亏。
 */

/** 一个第三方应用在三端的唤起信息 */
export interface AppEntry {
  /** 稳定 id（如 'deepseek'），语义化、跨版本不变 */
  id: string;
  /** 显示名（英文或品牌官方名） */
  name: string;
  /** Android 包名（也用于生成 <queries> 可见性清单） */
  androidPackage?: string;
  /** Android scheme（真值以实测为准；部分 filter 要求 authority/path） */
  androidScheme?: string;
  /** iOS URL scheme（含 ://；iOS 唯一可靠通道，需真机逐个验证） */
  iosScheme?: string;
  /** iOS 上 canOpenURL 白名单需要声明所有可能尝试的 scheme（LSApplicationQueriesSchemes） */
  iosQuerySchemes?: string[];
  /** 鸿蒙 scheme（ohos 的 deeplink，形如 app://xxx） */
  harmonyScheme?: string;
  /** 网页版兜底（三端通用；也是 HarmonyOS 目前的主要通道） */
  webUrl: string;
  /** 数据可信度标注 */
  verification: Verification;
  /** 分类标签，宿主可按需筛选（如 'ai'、'browser'） */
  category?: string;
  /** 非中国大陆可用（影响默认排序建议） */
  intlAvailable?: boolean;
}

/**
 * 数据可信度——这个包的核心价值是「真值」，必须诚实标注来源：
 * - tested: 真机装了目标 App 后实测拉起成功（最高可信）
 * - official: 官方文档/公开声明里引用的 scheme
 * - unverified: 社区资料或推测，未实测（宿主应做好兜底）
 */
export type VerificationLevel = 'tested' | 'official' | 'unverified';

export interface Verification {
  level: VerificationLevel;
  /** 各平台真值来源与日期（如 'android: 2026-10 Xiaomi 2203121C dumpsys + am start'） */
  notes?: Partial<Record<'android' | 'ios' | 'harmony', string>>;
}

/** 平台标识 */
export type PlatformId = 'android' | 'ios' | 'harmony' | 'web' | 'unknown';

/**
 * 平台能力注入（宿主 App 在初始化时提供）。
 * launcher 逻辑完全不依赖 react-native import，测试传 mock 即可全链路覆盖。
 */
export interface PlatformAdapter {
  /** 当前平台 */
  os: PlatformId;
  /**
   * 打开 URL/scheme。resolve = 系统接受了（已拉起或系统弹选择框）；
   * reject = 无法处理（未注册/未安装）。
   */
  openURL(url: string): Promise<void>;
  /**
   * （仅 Android）按包名拉起。未安装应 reject。
   * 宿主用 expo-intent-launcher 的 openApplication 或自写原生模块实现。
   */
  openApplication?(androidPackage: string): Promise<void>;
  /**
   * （仅 Android 11+ 包可见性）查询包是否「可见」。
   * 未实现时 launcher 视为可见（返回 undefined），走 openApplication 尝试。
   */
  canOpenPackage?(androidPackage: string): Promise<boolean | undefined>;
}

/** 唤起一次尝试的结果 */
export interface LaunchResult {
  /** 最终是否成功打开了某个目标 */
  opened: boolean;
  /** 成功打开的途径 */
  via?: 'scheme' | 'package' | 'web';
  /** 成功打开的应用 id */
  appId?: string;
  /** 全部尝试轨迹（调试用；不成功时知道试过什么） */
  attempts: LaunchAttempt[];
}

export interface LaunchAttempt {
  appId: string;
  strategy: 'scheme' | 'package' | 'web';
  url?: string;
  ok: boolean;
  /** 失败原因（reject 的 error 字符串化） */
  error?: string;
}
