/**
 * 编排层测试：mock PlatformAdapter 全链路覆盖。
 * 验证策略顺序、失败转移、不落浏览器承诺、attempt 轨迹。
 */
import { describe, expect, it } from 'vitest';
import { APP_REGISTRY, findApp } from '../src/registry';
import { launchApp, schemeFor, tryLaunchInOrder } from '../src/launcher';
import type { AppEntry, PlatformAdapter } from '../src/types';

/** 造一个可编程的 mock adapter：哪些 URL/包名会成功由用例声明 */
function mockAdapter(
  os: PlatformAdapter['os'],
  opts: { okUrls?: Set<string>; okPkgs?: Set<string>; visiblePkgs?: Set<string> } = {},
): PlatformAdapter {
  return {
    os,
    openURL: async (url) => {
      if (!opts.okUrls?.has(url)) throw new Error(`cannot open ${url}`);
    },
    openApplication: async (pkg) => {
      if (!opts.okPkgs?.has(pkg)) throw new Error(`package ${pkg} not found`);
    },
    canOpenPackage: opts.visiblePkgs
      ? async (pkg) => opts.visiblePkgs!.has(pkg)
      : undefined,
  };
}

const deepseek = findApp('deepseek')!;
const yuanbao = findApp('yuanbao')!;

describe('launchApp 单应用', () => {
  it('scheme 成功 → via=scheme，不再尝试后续策略', async () => {
    const ad = mockAdapter('android', { okUrls: new Set(['dpsk://chat/new']) });
    const r = await launchApp(ad, deepseek, { fallbackToWeb: false });
    expect(r.opened).toBe(true);
    expect(r.via).toBe('scheme');
    expect(r.attempts).toHaveLength(1);
  });

  it('scheme 失败 → Android 包名兜底成功', async () => {
    const ad = mockAdapter('android', {
      okPkgs: new Set(['com.deepseek.chat']),
    });
    const r = await launchApp(ad, deepseek, { fallbackToWeb: false });
    expect(r.opened).toBe(true);
    expect(r.via).toBe('package');
    expect(r.attempts).toHaveLength(2); // scheme 失败 + package 成功
  });

  it('canOpenPackage 返回 false 时不尝试包名（省一次必然失败的调用）', async () => {
    const ad = mockAdapter('android', {
      visiblePkgs: new Set([]), // 空集合 = 全部不可见
      okPkgs: new Set(['com.deepseek.chat']), // 即使 openApplication 能成功也不该被调用
    });
    const r = await launchApp(ad, deepseek, { fallbackToWeb: false });
    expect(r.opened).toBe(false);
    expect(r.attempts.at(-1)?.error).toContain('not visible');
  });

  it('scheme+包名都失败 + fallbackToWeb → 开网页版', async () => {
    const ad = mockAdapter('android', { okUrls: new Set(['https://chat.deepseek.com/']) });
    const r = await launchApp(ad, deepseek); // 默认 fallbackToWeb=true
    expect(r.opened).toBe(true);
    expect(r.via).toBe('web');
    expect(r.appId).toBe('deepseek');
  });

  it('fallbackToWeb=false 时绝不落浏览器（即使网页能开）', async () => {
    const ad = mockAdapter('android', { okUrls: new Set(['https://chat.deepseek.com/']) });
    const r = await launchApp(ad, deepseek, { fallbackToWeb: false });
    expect(r.opened).toBe(false);
    expect(r.attempts.some((x) => x.strategy === 'web')).toBe(false);
  });

  it('元宝的 scheme 必须带 authority（hunyuan://chat 而非裸 hunyuan://）', async () => {
    expect(yuanbao.androidScheme).toBe('hunyuan://chat');
    const ad = mockAdapter('android', { okUrls: new Set(['hunyuan://chat']) });
    const r = await launchApp(ad, yuanbao, { fallbackToWeb: false });
    expect(r.opened).toBe(true);
    expect(r.via).toBe('scheme');
  });

  it('iOS：无包名兜底，scheme 失败只能网页', async () => {
    const ad = mockAdapter('ios', { okUrls: new Set(['https://chat.deepseek.com/']) });
    const r = await launchApp(ad, deepseek);
    expect(r.opened).toBe(true);
    expect(r.via).toBe('web');
    expect(r.attempts.every((x) => x.strategy !== 'package')).toBe(true);
  });

  it('scheme 未定义的平台直接跳过 scheme 尝试', async () => {
    const entry: AppEntry = { ...deepseek, androidScheme: undefined };
    const ad = mockAdapter('android', {
      okPkgs: new Set(['com.deepseek.chat']),
    });
    const r = await launchApp(ad, entry, { fallbackToWeb: false });
    expect(r.opened).toBe(true);
    expect(r.via).toBe('package');
    expect(r.attempts[0].strategy).toBe('package');
  });
});

describe('tryLaunchInOrder 依次尝试', () => {
  const apps = ['deepseek', 'doubao', 'yuanbao', 'chatgpt']
    .map((id) => findApp(id)!)
    .filter(Boolean);

  it('第一个就命中', async () => {
    const ad = mockAdapter('android', { okUrls: new Set(['dpsk://chat/new']) });
    const hit = await tryLaunchInOrder(ad, apps);
    expect(hit?.app.id).toBe('deepseek');
  });

  it('前面全失败，命中中间一个', async () => {
    const ad = mockAdapter('android', {
      // deepseek/豆包 scheme+包名都不可用，元宝 scheme 可用
      okUrls: new Set(['hunyuan://chat']),
    });
    const hit = await tryLaunchInOrder(ad, apps);
    expect(hit?.app.id).toBe('yuanbao');
    expect(hit?.via).toBe('scheme');
    // 轨迹里能看到前面的失败
    const failedIds = hit!.attempts.filter((x) => !x.ok).map((x) => x.appId);
    expect(failedIds).toContain('deepseek');
    expect(failedIds).toContain('doubao');
  });

  it('全部未安装 → null，绝不落浏览器', async () => {
    const ad = mockAdapter('android', {});
    const hit = await tryLaunchInOrder(ad, apps);
    expect(hit).toBeNull();
  });

  it('网页兜底不参与依次尝试（webUrl 全能开也不能算命中）', async () => {
    const ad = mockAdapter('android', {
      okUrls: new Set(APP_REGISTRY.map((a) => a.webUrl)),
    });
    const hit = await tryLaunchInOrder(ad, apps);
    expect(hit).toBeNull();
  });
});

describe('schemeFor 平台分流', () => {
  it('harmony 缺省回落到 iosScheme', () => {
    const entry = findApp('doubao')!;
    expect(schemeFor(entry, 'harmony')).toBe(entry.iosScheme);
  });
  it('web/unknown 无 scheme', () => {
    expect(schemeFor(deepseek, 'web')).toBeUndefined();
    expect(schemeFor(deepseek, 'unknown')).toBeUndefined();
  });
});
