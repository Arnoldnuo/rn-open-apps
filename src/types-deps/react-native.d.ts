/**
 * react-native 的最小类型 stub（仅本包用到的 API 面）。
 *
 * 为什么存在：本包把 react-native 声明为 peerDependency（宿主提供真实实现与
 * 类型），独立构建/CI 环境不装 RN。宿主侧 TS 解析 node_modules/react-native
 * 的真实类型优先于本声明（模块名相同、宿主 node_modules 在前），因此不影响
 * 宿主的类型检查；仅让本包的 CI 与 tsc 独立可跑。
 * 只声明 Linking.openURL 与 Platform.OS——adapter 代码的全部依赖面。
 */
declare module 'react-native' {
  export interface LinkingStatic {
    openURL(url: string): Promise<void>;
  }
  export interface PlatformStatic {
    readonly OS: string;
  }
  export const Linking: LinkingStatic;
  export const Platform: PlatformStatic;
}
