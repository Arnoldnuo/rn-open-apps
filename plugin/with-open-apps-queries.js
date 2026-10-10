// Expo config plugin：把 rn-open-apps 清单里全部 Android 包名注入 <queries>。
//
// Android 11+ 包可见性：不在 <queries> 声明的包，getLaunchIntentForPackage
// 返回 null（像没装一样），按包名唤起会静默失败。宿主装了这个 plugin 就
// 自动获得完整可见性，不用手工维护 manifest。
//
// 用法（app.json）：
//   plugins: ["rn-open-apps/plugin/with-open-apps-queries"]
//
// 实现：CommonJS 动态 require 上游的 registry（dist 编译产物），插件与包
// 版本始终一致。require 路径基于本文件在发布包内的相对位置。
const { withAndroidManifest } = require('expo/config-plugins');

// registry 从 dist 引（构建后存在）；插件运行在宿主的 prebuild 阶段
function loadRegistry() {
  // 发布布局：<pkg>/plugin/with-open-apps-queries.js + <pkg>/dist/registry.js
  const path = require('path');
  const distPath = path.join(__dirname, '..', 'dist', 'registry.js');
  try {
    const mod = require(distPath);
    return mod.APP_REGISTRY;
  } catch {
    throw new Error(
      '[rn-open-apps] dist/registry.js not found. The package may need `npm run build`. ' +
        `Looked at: ${distPath}`,
    );
  }
}

const TAG = '<!-- rn-open-apps: queries -->';

const withOpenAppsQueries = (config) => {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults;
    if (JSON.stringify(manifest).includes('rn-open-apps: queries')) {
      return cfg; // 幂等
    }
    const registry = loadRegistry();
    const packages = registry
      .filter((a) => a && typeof a.androidPackage === 'string')
      .map((a) => a.androidPackage);
    if (packages.length === 0) return cfg;
    manifest.manifest.queries = [
      ...(manifest.manifest.queries ?? []),
      {
        $: { 'android:tag': TAG },
        package: packages.map((name) => ({ $: { 'android:name': name } })),
      },
    ];
    return cfg;
  });
};

module.exports = withOpenAppsQueries;
