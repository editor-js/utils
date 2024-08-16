/**
 * True if current device runs iOS
 */
export const isIosDevice
  = typeof window !== 'undefined'
  && window.navigator !== null
  && window.navigator.platform
  && (/iP(ad|hone|od)/.test(window.navigator.platform)
  || (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1));
