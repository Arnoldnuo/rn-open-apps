/**
 * 唤起编排：依次尝试 scheme → Android 包名 → 网页兜底。
 *
 * 与平台解耦：所有平台能力经 PlatformAdapter 注入（见 types.ts）。
 * 宿主初始化一次 adapter（把 react-native 的 Linking / expo-intent-launcher
 * 接进来），之后所有调用都是纯逻辑——单测无需模拟整个 RN 环境。
 */
import type { AppEntry, LaunchAttempt, LaunchResult, PlatformAdapter } from './types';

/** 唤起单个 App 的选项 */
export interface LaunchOneOptions {
  /** 失败后允许网页兜底（默认 true；「依次尝试」场景传 false，绝不落浏览器） */
  fallbackToWeb?: boolean;
}

/**
 * 唤起单个应用。策略：
 * 1. scheme（当前平台的，未定义则跳过）
 * 2. Android：包可见则按包名拉起
 * 3. fallbackToWeb 时开网页版
 * 返回的 LaunchResult 描述实际走了哪条路。
 */
export async function launchApp(
  adapter: PlatformAdapter,
  app: AppEntry,
  options: LaunchOneOptions = {},
): Promise<LaunchResult> {
  const { fallbackToWeb = true } = options;
  const attempts: LaunchAttempt[] = [];

  // ① scheme
  const scheme = schemeFor(app, adapter.os);
  if (scheme) {
    try {
      await adapter.openURL(scheme);
      attempts.push({ appId: app.id, strategy: 'scheme', url: scheme, ok: true });
      return { opened: true, via: 'scheme', appId: app.id, attempts };
    } catch (e) {
      attempts.push({
        appId: app.id,
        strategy: 'scheme',
        url: scheme,
        ok: false,
        error: String(e),
      });
    }
  }

  // ② Android 按包名（包可见性由宿主 <queries> 保证；canOpenPackage 未实现时直接尝试）
  if (adapter.os === 'android' && app.androidPackage && adapter.openApplication) {
    try {
      const visible = adapter.canOpenPackage
        ? await adapter.canOpenPackage(app.androidPackage)
        : undefined;
      if (visible !== false) {
        await adapter.openApplication(app.androidPackage);
        attempts.push({ appId: app.id, strategy: 'package', ok: true });
        return { opened: true, via: 'package', appId: app.id, attempts };
      }
      attempts.push({
        appId: app.id,
        strategy: 'package',
        ok: false,
        error: 'package not visible (queries?)',
      });
    } catch (e) {
      attempts.push({
        appId: app.id,
        strategy: 'package',
        ok: false,
        error: String(e),
      });
    }
  }

  // ③ 网页兜底
  if (fallbackToWeb && app.webUrl) {
    try {
      await adapter.openURL(app.webUrl);
      attempts.push({ appId: app.id, strategy: 'web', url: app.webUrl, ok: true });
      return { opened: true, via: 'web', appId: app.id, attempts };
    } catch (e) {
      attempts.push({ appId: app.id, strategy: 'web', url: app.webUrl, ok: false, error: String(e) });
    }
  }

  return { opened: false, attempts };
}

/**
 * 依次尝试唤起一组应用，返回第一个「真打开了 App」的（scheme 或包名成功）。
 * 全部失败返回 null——绝不落浏览器（那是 fallbackToWeb 的职责，由宿主决定）。
 */
export async function tryLaunchInOrder(
  adapter: PlatformAdapter,
  apps: AppEntry[],
): Promise<{ app: AppEntry; via: 'scheme' | 'package'; attempts: LaunchAttempt[] } | null> {
  const all: LaunchAttempt[] = [];
  for (const app of apps) {
    const r = await launchApp(adapter, app, { fallbackToWeb: false });
    all.push(...r.attempts);
    if (r.opened && (r.via === 'scheme' || r.via === 'package')) {
      return { app, via: r.via, attempts: all };
    }
  }
  return null;
}

/** 平台对应的 scheme */
export function schemeFor(app: AppEntry, os: PlatformAdapter['os']): string | undefined {
  switch (os) {
    case 'android':
      return app.androidScheme;
    case 'ios':
      return app.iosScheme;
    case 'harmony':
      return app.harmonyScheme ?? app.iosScheme; // 鸿蒙 App 常与 iOS 同源声明
    default:
      return undefined;
  }
}
