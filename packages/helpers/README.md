# @editorjs/helpers
Utils useful for Editor.js tools development
### Installation 
 ```
   npm install @editorjs/helpers
```
### Function list
- [EventsDispatcher](https://github.com/editor-js/utils/blob/main/packages/helpers/src/EventsDispatcher/EventsDispatcher.ts) - Provides methods for working with Event Bus:
- [Listeners](https://github.com/editor-js/utils/blob/main/packages/helpers/src/Listeners/Listeners.ts) - allListeners - listeners store
- [beautifyShortcut](https://github.com/editor-js/utils/blob/main/packages/helpers/src/beautifyShortcut/beautifyShortcut.ts) - Make shortcut command more human-readable
- [bem](https://github.com/editor-js/utils/blob/main/packages/helpers/src/bem/bem.ts) - Utility function that allows to construct class names from block and element names
- [cacheable](https://github.com/editor-js/utils/blob/main/packages/helpers/src/cacheable/cacheable.ts) - Decorator which provides ability to cache method or accessor result
- [capitalize](https://github.com/editor-js/utils/blob/main/packages/helpers/src/capitalize/capitalize.ts) - Capitalizes first letter of the string
- [copyTextToClipboard](https://github.com/editor-js/utils/blob/main/packages/helpers/src/copyTextToClipboard/copyTextToClipboard.ts) - Copies passed text to the clipboard
- [debounce](https://github.com/editor-js/utils/blob/main/packages/helpers/src/debounce/debounce.ts) - Debouncing method
- [deepMerge](https://github.com/editor-js/utils/blob/main/packages/helpers/src/deepMerge/deepMerge.ts) - Merge two objects recursively
- [delay](https://github.com/editor-js/utils/blob/main/packages/helpers/src/delay/delay.ts) - Delays method execution
- [deprecationAssert](https://github.com/editor-js/utils/blob/main/packages/helpers/src/deprecationAssert/deprecationAssert.ts) - Common method for printing a warning about the usage of deprecated property or method.
- [isEmpty](https://github.com/editor-js/utils/blob/main/packages/helpers/src/empty/isEmpty.ts) - True if passed variable is null/undefined/''/{}
- [notEmpty](https://github.com/editor-js/utils/blob/main/packages/helpers/src/empty/notEmpty.ts) - True if passed variable is not null/undefined/''/{}
- [equals](https://github.com/editor-js/utils/blob/main/packages/helpers/src/equals/equals.ts) - Compares two values with unknown type
- [generateId](https://github.com/editor-js/utils/blob/main/packages/helpers/src/generateId/generateId.ts) - Returns random generated identifier
- [getValidUrl](https://github.com/editor-js/utils/blob/main/packages/helpers/src/getValidUrl/getValidUrl.ts) - Returns valid URL. If it is going outside and valid, it returns itself
- [isPrintableKey](https://github.com/editor-js/utils/blob/main/packages/helpers/src/isPrintableKey/isPrintableKey.ts) - Returns true if passed key code is printable (a-Z, 0-9, etc) character.
- [PromiseQueue](https://github.com/editor-js/utils/blob/main/packages/helpers/src/promiseQueue/promiseQueue.ts) - Class allows to make a queue of async jobs and wait until they all will be finished one by one
- [throttle](https://github.com/editor-js/utils/blob/main/packages/helpers/src/throttle/throttle.ts) - Returns a function, that, when invoked, will only be triggered at most once during a given window of time.
- [prepare](https://github.com/editor-js/utils/blob/main/packages/helpers/src/tooltip/tooltip.ts) - If library is needed, but it is not initialized yet, this function will initialize it
- [show](https://github.com/editor-js/utils/blob/main/packages/helpers/src/tooltip/tooltip.ts) - Shows tooltip on element with passed HTML content
- [hide](https://github.com/editor-js/utils/blob/main/packages/helpers/src/tooltip/tooltip.ts) - Hides tooltip
- [onHover](https://github.com/editor-js/utils/blob/main/packages/helpers/src/tooltip/tooltip.ts) - Binds 'mouseenter' and 'mouseleave' events that shows/hides the Tooltip
- [destroy](https://github.com/editor-js/utils/blob/main/packages/helpers/src/tooltip/tooltip.ts) - Release the library
- [isBoolean](https://github.com/editor-js/utils/blob/main/packages/helpers/src/typeOf/isBoolean.ts) - Checks if passed argument is boolean
- [isClass](https://github.com/editor-js/utils/blob/main/packages/helpers/src/typeOf/isClass.ts) - Check if passed function is a class
- [isFunction](https://github.com/editor-js/utils/blob/main/packages/helpers/src/typeOf/isFunction.ts) - Check if passed variable is a function
- [isNumber](https://github.com/editor-js/utils/blob/main/packages/helpers/src/typeOf/isNumber.ts) - Checks if passed argument is number
- [isObject](https://github.com/editor-js/utils/blob/main/packages/helpers/src/typeOf/isObject.ts) - Checks if passed argument is an object
- [isPromise](https://github.com/editor-js/utils/blob/main/packages/helpers/src/typeOf/isPromise.ts) - Check if passed object is a Promise
- [isString](https://github.com/editor-js/utils/blob/main/packages/helpers/src/typeOf/isString.ts) - Checks if passed argument is a string
- [isUndefined](https://github.com/editor-js/utils/blob/main/packages/helpers/src/typeOf/isUndefined.ts) - Checks if passed argument is undefined
- [typeOf](https://github.com/editor-js/utils/blob/main/packages/helpers/src/typeOf/typeOf.ts) - Return string representation of the object type
- [getUserOS](https://github.com/editor-js/utils/blob/main/packages/helpers/src/userOS/getUserOS.ts) - Returns object with os name as key and boolean as value. Shows current user OS
# About CodeX
   <img align="right" width="120" height="120" src="https://codex.so/public/app/img/codex-logo.svg" hspace="50">

   CodeX is a team of digital specialists around the world interested in building high-quality open source products on a global market. We are [open](https://codex.so/join) for young people who want to constantly improve their skills and grow professionally with experiments in cutting-edge technologies.

  | 🌐 | Join  👋  | Twitter | Instagram |
   | -- | -- | -- | -- | 
   | [codex.so](https://codex.so) | [codex.so/join](https://codex.so/join) |[@codex_team](http://twitter.com/codex_team) | [@codex_team](http://instagram.com/codex_team/) |