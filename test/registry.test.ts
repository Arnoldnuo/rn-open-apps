/**
 * 数据层测试：清单的结构完整性。
 * 这些规则是「真值资产」的质量门槛——CI 挡住不合规的条目。
 */
import { describe, expect, it } from 'vitest';
import { APP_REGISTRY, androidQueryPackages, findApp, iosQuerySchemes } from '../src/registry';

describe('APP_REGISTRY 数据完整性', () => {
  it('id 全局唯一', () => {
    const ids = APP_REGISTRY.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('每个条目有必要字段：id/name/webUrl/verification', () => {
    for (const a of APP_REGISTRY) {
      expect(a.id, `${a.id}.id`).toBeTruthy();
      expect(a.name, `${a.id}.name`).toBeTruthy();
      expect(a.webUrl, `${a.id}.webUrl`).toMatch(/^https:\/\//);
      expect(a.verification, `${a.id}.verification`).toBeDefined();
    }
  });

  it('verification.level 只允许三个枚举值', () => {
    for (const a of APP_REGISTRY) {
      expect(['tested', 'official', 'unverified'], `${a.id}`).toContain(a.verification.level);
    }
  });

  it('tested 级别的条目必须写明 notes（真值必须可溯源）', () => {
    for (const a of APP_REGISTRY.filter((x) => x.verification.level === 'tested')) {
      expect(Object.keys(a.verification.notes ?? {}), `${a.id} tested 但无 notes`).not.toHaveLength(0);
    }
  });

  it('scheme 格式合法（以 :// 结尾或含路径）', () => {
    const check = (s: string | undefined, label: string) => {
      if (!s) return;
      expect(s, label).toMatch(/^[a-z][a-z0-9+.-]*:\/\/[a-zA-Z0-9/.-]*$/);
    };
    for (const a of APP_REGISTRY) {
      check(a.androidScheme, `${a.id}.androidScheme`);
      check(a.iosScheme, `${a.id}.iosScheme`);
      check(a.harmonyScheme, `${a.id}.harmonyScheme`);
    }
  });

  it('Android 包名格式合法（至少三段）', () => {
    for (const a of APP_REGISTRY) {
      if (!a.androidPackage) continue;
      expect(a.androidPackage, `${a.id}.androidPackage`).toMatch(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){2,}$/);
    }
  });

  it('本次真机实测过的包名在清单中（防意外回退）', () => {
    // 2026-10 Xiaomi 2203121C dumpsys 实测真值——回退检测
    expect(findApp('yuanbao')?.androidPackage).toBe('com.tencent.hunyuan.app.chat');
    expect(findApp('zhipu')?.androidPackage).toBe('com.zhipuai.qingyan');
    expect(findApp('deepseek')?.androidPackage).toBe('com.deepseek.chat');
  });

  it('已知的历史错误值不再出现（考古防线）', () => {
    const pkgs = APP_REGISTRY.map((a) => a.androidPackage).filter(Boolean);
    expect(pkgs).not.toContain('com.tencent.yuanbao');
    expect(pkgs).not.toContain('com.zhipu.chatglm');
    expect(pkgs).not.toContain('com.deepseek.ai');
    expect(pkgs).not.toContain('com.x.grok');
  });
});

describe('派生清单', () => {
  it('androidQueryPackages：去重、非空', () => {
    const pkgs = androidQueryPackages();
    expect(new Set(pkgs).size).toBe(pkgs.length);
    expect(pkgs.length).toBeGreaterThan(5);
  });

  it('iosQuerySchemes：剥离 :// 与路径，只留 scheme 名', () => {
    for (const s of iosQuerySchemes()) {
      expect(s).toMatch(/^[a-z][a-z0-9+.-]*$/);
      expect(s).not.toContain('://');
    }
    // dpsk://chat/new 应产出 'dpsk'
    expect(iosQuerySchemes()).toContain('dpsk');
  });
});
