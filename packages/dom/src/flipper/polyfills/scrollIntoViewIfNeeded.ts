/**
 * Element interface extension to add scrollIntoViewIfNeeded method
 */
interface Element {
  /**
   * Checks if element in view and scroll to element if it's not
   * @param centerIfNeeded - true, if the element should be aligned so it is centered within the visible area of the scrollable ancestor.
   */
  scrollIntoViewIfNeeded: (centerIfNeeded?: boolean) => void;
}

/**
 * ScrollIntoViewIfNeeded polyfill by KilianSSL (forked from hsablonniere)
 * @see {@link https://gist.github.com/KilianSSL/774297b76378566588f02538631c3137}
 * @param centerIfNeeded - true, if the element should be aligned so it is centered within the visible area of the scrollable ancestor.
 */
// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
if (!Element.prototype.scrollIntoViewIfNeeded) {
  Element.prototype.scrollIntoViewIfNeeded = function (this: Element, centerIfNeeded): void {
    if (!(this instanceof HTMLElement)) {
      return;
    }

    centerIfNeeded = arguments.length === 0 ? true : centerIfNeeded === true;

    const parent = this.parentNode;

    if (!(parent instanceof HTMLElement)) {
      return;
    }

    const parentComputedStyle = window.getComputedStyle(parent, null);
    const parentBorderTopWidth = parseInt(parentComputedStyle.getPropertyValue('border-top-width'));
    const parentBorderLeftWidth = parseInt(parentComputedStyle.getPropertyValue('border-left-width'));
    const overTop = this.offsetTop - parent.offsetTop < parent.scrollTop;
    const overBottom = (this.offsetTop - parent.offsetTop + this.clientHeight - parentBorderTopWidth) > (parent.scrollTop + parent.clientHeight);
    const overLeft = this.offsetLeft - parent.offsetLeft < parent.scrollLeft;
    const overRight = (this.offsetLeft - parent.offsetLeft + this.clientWidth - parentBorderLeftWidth) > (parent.scrollLeft + parent.clientWidth);
    const alignWithTop = overTop && !overBottom;

    if ((overTop || overBottom) && centerIfNeeded === true) {
      parent.scrollTop = this.offsetTop - parent.offsetTop - parent.clientHeight / 2 - parentBorderTopWidth + this.clientHeight / 2;
    }

    if ((overLeft || overRight) && centerIfNeeded === true) {
      parent.scrollLeft = this.offsetLeft - parent.offsetLeft - parent.clientWidth / 2 - parentBorderLeftWidth + this.clientWidth / 2;
    }

    if ((overTop || overBottom || overLeft || overRight) && centerIfNeeded !== true) {
      this.scrollIntoView(alignWithTop);
    }
  };
}
