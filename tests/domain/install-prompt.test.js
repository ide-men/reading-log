import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  isInstallPromptDismissed,
  dismissInstallPrompt,
  shouldShowInstallPrompt,
  isMobileDevice,
  isIOS,
  isStandalone
} from '../../js/domain/install-prompt.js';
import { createLocalStorageMock } from '../helpers/index.js';

describe('isInstallPromptDismissed', () => {
  it('データがない場合はfalseを返す', () => {
    const storage = createLocalStorageMock();
    expect(isInstallPromptDismissed(storage)).toBe(false);
  });

  it('trueが保存されている場合はtrueを返す', () => {
    const storage = createLocalStorageMock({
      'rl_v1_install_prompt_dismissed': 'true'
    });
    expect(isInstallPromptDismissed(storage)).toBe(true);
  });

  it('falseが保存されている場合はfalseを返す', () => {
    const storage = createLocalStorageMock({
      'rl_v1_install_prompt_dismissed': 'false'
    });
    expect(isInstallPromptDismissed(storage)).toBe(false);
  });
});

describe('dismissInstallPrompt', () => {
  it('閉じた状態をストレージに保存する', () => {
    const storage = createLocalStorageMock();
    dismissInstallPrompt(storage);

    expect(storage.getData()['rl_v1_install_prompt_dismissed']).toBe('true');
  });

  it('保存後はisInstallPromptDismissedがtrueを返す', () => {
    const storage = createLocalStorageMock();
    dismissInstallPrompt(storage);
    expect(isInstallPromptDismissed(storage)).toBe(true);
  });
});

describe('isMobileDevice', () => {
  const originalNavigator = global.navigator;

  afterEach(() => {
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true
    });
  });

  it('iPhoneの場合はtrueを返す', () => {
    Object.defineProperty(global, 'navigator', {
      value: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)' },
      writable: true
    });
    expect(isMobileDevice()).toBe(true);
  });

  it('Androidの場合はtrueを返す', () => {
    Object.defineProperty(global, 'navigator', {
      value: { userAgent: 'Mozilla/5.0 (Linux; Android 11)' },
      writable: true
    });
    expect(isMobileDevice()).toBe(true);
  });

  it('デスクトップの場合はfalseを返す', () => {
    Object.defineProperty(global, 'navigator', {
      value: { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
      writable: true
    });
    expect(isMobileDevice()).toBe(false);
  });
});

describe('isIOS', () => {
  const originalNavigator = global.navigator;

  afterEach(() => {
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true
    });
  });

  it('iPhoneの場合はtrueを返す', () => {
    Object.defineProperty(global, 'navigator', {
      value: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)' },
      writable: true
    });
    expect(isIOS()).toBe(true);
  });

  it('iPadの場合はtrueを返す', () => {
    Object.defineProperty(global, 'navigator', {
      value: { userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)' },
      writable: true
    });
    expect(isIOS()).toBe(true);
  });

  it('Androidの場合はfalseを返す', () => {
    Object.defineProperty(global, 'navigator', {
      value: { userAgent: 'Mozilla/5.0 (Linux; Android 11)' },
      writable: true
    });
    expect(isIOS()).toBe(false);
  });
});

describe('isStandalone', () => {
  const originalNavigator = global.navigator;
  const originalWindow = global.window;

  afterEach(() => {
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true
    });
    if (originalWindow) {
      global.window = originalWindow;
    }
  });

  it('navigator.standalone=trueの場合はtrueを返す (iOS)', () => {
    Object.defineProperty(global, 'navigator', {
      value: { standalone: true, userAgent: 'iPhone' },
      writable: true
    });
    expect(isStandalone()).toBe(true);
  });

  it('display-mode: standaloneの場合はtrueを返す', () => {
    Object.defineProperty(global, 'navigator', {
      value: { standalone: undefined, userAgent: 'Android' },
      writable: true
    });
    global.window = {
      matchMedia: vi.fn().mockReturnValue({ matches: true })
    };
    expect(isStandalone()).toBe(true);
  });

  it('どちらでもない場合はfalseを返す', () => {
    Object.defineProperty(global, 'navigator', {
      value: { standalone: false, userAgent: 'Android' },
      writable: true
    });
    global.window = {
      matchMedia: vi.fn().mockReturnValue({ matches: false })
    };
    expect(isStandalone()).toBe(false);
  });
});

describe('shouldShowInstallPrompt', () => {
  const originalNavigator = global.navigator;
  const originalWindow = global.window;

  beforeEach(() => {
    // デフォルトでモバイルかつ非スタンドアロン
    Object.defineProperty(global, 'navigator', {
      value: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)', standalone: false },
      writable: true
    });
    global.window = {
      matchMedia: vi.fn().mockReturnValue({ matches: false })
    };
  });

  afterEach(() => {
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true
    });
    if (originalWindow) {
      global.window = originalWindow;
    }
  });

  it('モバイル・非スタンドアロン・未閉じの場合はtrueを返す', () => {
    const storage = createLocalStorageMock();
    expect(shouldShowInstallPrompt(storage)).toBe(true);
  });

  it('既に閉じている場合はfalseを返す', () => {
    const storage = createLocalStorageMock({
      'rl_v1_install_prompt_dismissed': 'true'
    });
    expect(shouldShowInstallPrompt(storage)).toBe(false);
  });

  it('デスクトップの場合はfalseを返す', () => {
    Object.defineProperty(global, 'navigator', {
      value: { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
      writable: true
    });
    const storage = createLocalStorageMock();
    expect(shouldShowInstallPrompt(storage)).toBe(false);
  });

  it('スタンドアロンモードの場合はfalseを返す', () => {
    Object.defineProperty(global, 'navigator', {
      value: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)', standalone: true },
      writable: true
    });
    const storage = createLocalStorageMock();
    expect(shouldShowInstallPrompt(storage)).toBe(false);
  });
});
