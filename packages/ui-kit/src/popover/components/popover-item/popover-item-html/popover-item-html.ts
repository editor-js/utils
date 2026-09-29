import { PopoverItem } from '../popover-item';
import type { PopoverItemHtmlParams, PopoverItemRenderParamsMap, PopoverItemType } from '../../../types';
import { css, FOCUSABLE_CONTROLS_SELECTOR } from './popover-item-html.const';
import { make } from '@editorjs/dom';
import { generateId } from '@editorjs/helpers';

/**
 * Represents popover item with custom html content
 */
export class PopoverItemHtml extends PopoverItem {
  /**
   * Item html elements
   */
  private nodes: {
    /**
     * Popover item root HTML element
     */
    root: HTMLElement;
  };

  /**
   * Constructs the instance
   * @param params – instance parameters
   * @param renderParams – popover item render params.
   * The parameters that are not set by user via popover api but rather depend on technical implementation
   */
  constructor(params: PopoverItemHtmlParams, renderParams?: PopoverItemRenderParamsMap[PopoverItemType.Html]) {
    super(params);

    this.nodes = {
      root: make('div', css.root),
    };

    /**
     * Wrapper is a layout element. Inside a menu an unroled wrapper would break the expected
     * parent/child structure, so its custom content participates in the menu directly
     */
    this.nodes.root.setAttribute('role', 'none');

    this.nodes.root.appendChild(params.element);

    /**
     * Native controls (buttons, inputs) are tabbable by default. Without this, one would be
     * reachable by Tab from a cold page load, before the popover housing it is ever shown —
     * the popover only strips tabindex from its items on hide(), which hasn't run yet
     */
    this.getControls().forEach((control) => {
      control.tabIndex = -1;
    });

    if (params.name !== undefined) {
      this.nodes.root.dataset.itemName = params.name;
    }

    if (this.hasChildren) {
      this.popupStateElements.forEach((element) => {
        element.setAttribute('aria-haspopup', 'menu');
        element.setAttribute('aria-expanded', 'false');
      });
    }

    if (params.hint !== undefined && renderParams?.hint?.enabled !== false) {
      const controls = this.getControls();

      this.addHint(this.nodes.root, {
        ...params.hint,
        position: renderParams?.hint?.position || 'right',
      }, controls.length > 0 ? controls : undefined);
    }
  }

  /**
   * Returns popover item root element
   */
  public getElement(): HTMLElement {
    return this.nodes.root;
  }

  /**
   * Toggles item hidden state
   * @param isHidden - true if item should be hidden
   */
  public toggleHidden(isHidden: boolean): void {
    this.nodes.root.classList.toggle(css.hidden, isHidden);
    this.nodes.root.hidden = isHidden;
  }

  /**
   * Reflects the state of the popover with children items opened from this item
   * @param isExpanded - true if the children popover is currently displayed
   */
  public override toggleExpanded(isExpanded: boolean): void {
    if (!this.hasChildren) {
      return;
    }

    this.popupStateElements.forEach((element) => {
      element.setAttribute('aria-expanded', String(isExpanded));
    });
  }

  /**
   * Returns the native controls inside the custom content, the ones that take the focus
   *
   * Each of them is given an id unless it has one already, so that a popover that leaves the
   * focus elsewhere can still point aria-activedescendant at the control it has highlighted
   */
  public getControls(): HTMLElement[] {
    const controls = Array.from(this.nodes.root.querySelectorAll<HTMLElement>(FOCUSABLE_CONTROLS_SELECTOR));

    controls.forEach((control) => {
      if (control.id === '') {
        control.id = generateId(`${css.root}-control-`);
      }
    });

    return controls;
  }

  /**
   * Elements that advertise the popover opened from this item. The wrapper is role="none", so
   * assistive technologies ignore anything set on it: the state has to be on the controls that
   * actually take the focus. The wrapper is only left to carry it when there is no control at all
   */
  private get popupStateElements(): HTMLElement[] {
    const controls = this.getControls();

    return controls.length > 0 ? controls : [this.nodes.root];
  }
}
