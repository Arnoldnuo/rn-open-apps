/**
 * 开箱即用的 React Native / Expo 平台适配器。
 *
 * 核心包（registry + launcher）零依赖；这个文件是唯一接触 react-native 的地方，
 * 且只做依赖注入，不含业务逻辑。宿主也可以不用它，自己实现 PlatformAdapter。
 */
import { Linking, Platform } from 'react-native';
import type { LaunchAttempt, PlatformAdapter, PlatformId } from './types';

type OpenApplication = (packageName: string) => Promise<void> | void;

/** expo-intent-launcher 的 openApplication；非 Expo 宿主注入自己的实现 */
export interface RnAdapterOptions {
  /** Android 按包名拉起实现（如 expo-intent-launcher 的 openApplication） */
  openApplication?: OpenApplication;
  /** Android 11+ 包可见性查询实现（如 expo-intent-launcher 的 canOpenURL 或原生封装） */
  canOpenPackage?: (pkg: string) => Promise<boolean | undefined>;
}

/**
 * 构建 React Native 平台适配器。
 * openApplication 未提供时，Android 按包名的兜底自动禁用（scheme 和网页仍然可用）。
 */
export function createRnAdapter(options: RnAdapterOptions = {}): PlatformAdapter {
  // Platform.OS 的类型由各 RN 宿主扩展（鸿蒙补丁会加 'harmony'）；
  // 这里用运行时判断 + 收窄到包内 PlatformId，不依赖 @types/react-native。
  const raw = Platform.OS as string;
  const os: PlatformId =
    raw === 'android' || raw === 'ios' || raw === 'harmony' ? raw : 'unknown';
  return {
    os,
    openURL: (url) => Linking.openURL(url),
    openApplication: options.openApplication
      ? (pkg: string) => Promise.resolve(options.openApplication!(pkg))
      : undefined,
    canOpenPackage: options.canOpenPackage,
  };
}

export type { LaunchAttempt };
