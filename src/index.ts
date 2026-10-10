/**
 * rn-open-apps —— 唤起常见第三方 App 的 RN/Expo 包。
 *
 * 快速上手：
 *   import { APP_REGISTRY, createRnAdapter, launchApp, tryLaunchInOrder } from 'rn-open-apps';
 *
 *   const adapter = createRnAdapter({
 *     openApplication: (pkg) => IntentLauncher.openApplication(pkg), // expo-intent-launcher
 *   });
 *   await launchApp(adapter, findApp('deepseek')!);
 *   const hit = await tryLaunchInOrder(adapter, [deepseek, doubao, chatgpt]);
 *
 * Expo 宿主在 app.json 里加 plugin 保证 Android 11+ 包可见性：
 *   plugins: ["rn-open-apps/plugin/with-open-apps-queries"]
 */
export * from './types';
export * from './registry';
export * from './launcher';
export * from './react-native';
