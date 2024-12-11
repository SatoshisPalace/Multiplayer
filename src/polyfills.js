import { Buffer } from 'buffer';

if (typeof window !== 'undefined') {
  window.global = window;
  window.Buffer = Buffer;
  window.process = {
    env: { DEBUG: undefined },
    version: '',
    nextTick: function(fn) { setTimeout(fn, 0); },
    browser: true
  };
}
