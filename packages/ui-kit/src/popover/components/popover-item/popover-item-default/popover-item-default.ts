import { make } from '@editorjs/dom';
import { generateId } from '@editorjs/helpers';
import { IconDotCircle, IconChevronRight } from '@codexteam/icons';
import type {
  PopoverItemDefaultParams as PopoverItemDefaultParams,
  PopoverItemRenderParamsMap,
  PopoverItemType
} from '../../../types';
import { PopoverItem } from '../popover-item';
import { css } from './popover-item-default.const';

/**
 * Represents sigle popover item node
 * @todo move nodes initialization to constructor
 * @todo replace multiple make() usages with constructing separate instances
 * @todo split regular popover item and popover item with confirmation to separate classes
 * @todo display icon on the right side of the item for rtl languages
 */
export class PopoverItemDefault extends PopoverItem {
  /**
   * Id of the item's root element.
   * Stable for the lifetime of the item, including across confirmation mode toggles -
   * lets a consumer that moves focus elsewhere (e.g. an inline popover acting on a text
   * selection) point aria-activedescendant at the currently highlighted item
   */
  public get id(): string | undefined {
    return this.nodes.root?.id;
  }

  /**
   * True if item is disabled and hence not clickable
   */
  public get isDisabled(): boolean {
    return this.params.isDisabled === true;
  }

  /**
   * Exposes popover item toggle parameter
   */
  public get toggle(): boolean | string | undefined {
    return this.params.toggle;
  }

  /**
   * Popover item's title getter
   */
  public get title(): string | undefined {
    return this.params.title;
  }

  /**
   * True if confirmation state is enabled for popover item
   */
  public get isConfirmationStateEnabled(): boolean {
    return this.confirmationState !== null;
  }

  /**
   * ARIA role for the item, derived from its toggle behavior.
   * Can be overridden by the popover via render params — inline popovers render
   * items as buttons in a toolbar rather than as menu items.
   */
  public get ariaRole(): string {
    if (this.params.role !== undefined) {
      return this.params.role;
    }

    if (this.renderParams?.ariaRole !== undefined) {
      return this.renderParams.ariaRole;
    }

    if (typeof this.params.toggle === 'string') {
      return 'menuitemradio';
    }

    if (this.params.toggle === true) {
      return 'menuitemcheckbox';
    }

    return 'menuitem';
  }

  /**
   * Attribute conveying the item's active state, matching its role.
   * Null for roles that have no pressed/checked state.
   */
  private get ariaStateAttribute(): string | null {
    switch (this.ariaRole) {
      case 'menuitemradio':
      case 'menuitemcheckbox':
        return 'aria-checked';
      case 'option':
        return 'aria-selected';
      /**
       * aria-pressed turns a button into a toggle button, which is announced differently.
       * Only the items that do have an on/off state get it: toggles, and the ones reporting
       * whether they are active (e.g. inline formatting tools)
       */
      case 'button':
        return this.params.toggle !== undefined || this.params.isActive !== undefined ? 'aria-pressed' : null;
      default:
        return null;
    }
  }

  /**
   * Accessible name the item currently exposes.
   * Differs from the title while the item is in confirmation state
   */
  public get accessibleName(): string | undefined {
    return PopoverItemDefault.getAccessibleName(this.confirmationState ?? this.params);
  }

  /**
   * True if item is focused in keyboard navigation process
   */
  public get isFocused(): boolean {
    if (this.nodes.root === null) {
      return false;
    }

    if (document.activeElement === this.nodes.root) {
      return true;
    }

    return this.nodes.root.classList.contains(css.focused);
  }

  /**
   * Attributes describing the item for assistive technologies.
   * Kept in sync when the item's content is replaced, for example in confirmation mode
   */
  private static readonly ariaAttributes = ['role', 'aria-label', 'aria-disabled', 'aria-checked', 'aria-pressed', 'aria-selected'];

  /**
   * Item html elements
   */
  private nodes: {
    /**
     * Root element of the item
     */
    root: null | HTMLElement;
    /**
     * Icon element of the item
     */
    icon: null | HTMLElement;
  } = {
      root: null,
      icon: null,
    };

  /**
   * If item is in confirmation state, stores confirmation params such as icon, label, onActivate callback and so on
   */
  private confirmationState: PopoverItemDefaultParams | null = null;

  /**
   * Constructs popover item instance
   * @param params - popover item construction params
   * @param renderParams - popover item render params.
   * The parameters that are not set by user via popover api but rather depend on technical implementation
   */
  constructor(protected readonly params: PopoverItemDefaultParams, private readonly renderParams?: PopoverItemRenderParamsMap[PopoverItemType.Default]) {
    super(params);

    this.nodes.root = this.make(params, renderParams);

    this.nodes.root.id = generateId(`${css.container}-`);
  }

  /**
   * Copies semantics from the freshly constructed element to the element rendered on the page.
   * The item root is reused across states, only its content is replaced, so the attributes
   * have to be transferred separately
   * @param source - element the attributes are read from
   * @param target - element the attributes are applied to
   */
  private static copyAriaAttributes(source: HTMLElement, target: HTMLElement): void {
    PopoverItemDefault.ariaAttributes.forEach((attribute) => {
      const value = source.getAttribute(attribute);

      if (value === null) {
        target.removeAttribute(attribute);

        return;
      }

      target.setAttribute(attribute, value);
    });
  }

  /**
   * Returns accessible name for the passed item params.
   * Falls back to the hint title, since inline popover items are rendered icon-only
   * and carry their name in the hint rather than in the title
   * @param params - construction params of the item or of its confirmation state
   */
  private static getAccessibleName(params: PopoverItemDefaultParams): string | undefined {
    if (params.ariaLabel !== undefined) {
      return params.ariaLabel;
    }

    if (params.title !== undefined && params.title !== '') {
      return params.title;
    }

    return params.hint?.title;
  }

  /**
   * Returns popover item root element
   */
  public getElement(): HTMLElement | null {
    return this.nodes.root;
  }

  /**
   * Called on popover item click
   */
  public handleClick(): void {
    if (this.isConfirmationStateEnabled && this.confirmationState !== null) {
      this.activateOrEnableConfirmationMode(this.confirmationState);

      return;
    }

    this.activateOrEnableConfirmationMode(this.params);
  }

  /**
   * Toggles item active state
   * @param isActive - true if item should strictly should become active
   */
  public toggleActive(isActive?: boolean): void {
    /** Undefined means the state should be flipped, which is what classList.toggle does */
    const nextState = isActive ?? this.nodes.root?.classList.contains(css.active) !== true;

    this.nodes.root?.classList.toggle(css.active, nextState);

    const stateAttribute = this.ariaStateAttribute;

    if (stateAttribute !== null) {
      this.nodes.root?.setAttribute(stateAttribute, String(nextState));
    }
  }

  /**
   * Toggles item hidden state
   * @param isHidden - true if item should be hidden
   */
  public override toggleHidden(isHidden: boolean): void {
    this.nodes.root?.classList.toggle(css.hidden, isHidden);

    if (this.nodes.root !== null) {
      this.nodes.root.hidden = isHidden;
    }
  }

  /**
   * Resets popover item to its original state
   */
  public reset(): void {
    if (this.isConfirmationStateEnabled) {
      this.disableConfirmationMode();
    }
  }

  /**
   * Method called once item becomes focused during keyboard navigation
   */
  public onFocus(): void {
    this.disableSpecialHoverAndFocusBehavior();
  }

  /**
   * Constructs HTML element corresponding to popover item params
   * @param params - item construction params
   * @param [renderParams] - popover item render params with hint and wrappingTag
   */
  private make(params: PopoverItemDefaultParams, renderParams?: PopoverItemRenderParamsMap[PopoverItemType.Default]): HTMLElement {
    const tag = renderParams?.wrapperTag || 'div';
    const el = make(tag, css.container, {
      type: tag === 'button' ? 'button' : undefined,
    });

    if (params.name !== undefined) {
      el.dataset.itemName = params.name;
    }

    /**
     * Items are navigated with arrow keys, so they are focusable but not tabbable.
     * Popover makes one of them tabbable while it is opened
     */
    el.tabIndex = -1;

    this.applyAriaAttributes(el, params);

    this.nodes.icon = make('div', [css.icon, css.iconTool], {
      innerHTML: params.icon ?? IconDotCircle,
    });

    /** Icon is decorative, the item is named via aria-label */
    this.nodes.icon.setAttribute('aria-hidden', 'true');

    el.appendChild(this.nodes.icon);

    if (params.title !== undefined) {
      el.appendChild(make('div', css.title, {
        innerHTML: params.title || '',
      }));
    }

    if (params.secondaryLabel !== undefined) {
      el.appendChild(make('div', css.secondaryTitle, {
        textContent: params.secondaryLabel,
      }));
    }

    if (this.hasChildren) {
      const chevron = make('div', [css.icon, css.iconChevronRight], {
        innerHTML: IconChevronRight,
      });

      /** Chevron is decorative, nested items availability is conveyed via aria-haspopup */
      chevron.setAttribute('aria-hidden', 'true');

      el.appendChild(chevron);
    }

    if (this.isActive) {
      el.classList.add(css.active);
    }

    if (params.isDisabled === true) {
      el.classList.add(css.disabled);
    }

    if (params.hint !== undefined && renderParams?.hint?.enabled !== false) {
      this.addHint(el, {
        ...params.hint,
        position: renderParams?.hint?.position || 'right',
      });
    }

    return el;
  }

  /**
   * Sets item's role, accessible name and states on its root element
   * @param el - item root element to apply attributes to
   * @param params - item params the attributes are derived from
   */
  private applyAriaAttributes(el: HTMLElement, params: PopoverItemDefaultParams): void {
    el.setAttribute('role', this.ariaRole);

    const accessibleName = PopoverItemDefault.getAccessibleName(params);

    if (accessibleName !== undefined) {
      el.setAttribute('aria-label', accessibleName);
    }

    if (params.isDisabled === true) {
      el.setAttribute('aria-disabled', 'true');
    }

    const stateAttribute = this.ariaStateAttribute;

    if (stateAttribute !== null) {
      el.setAttribute(stateAttribute, String(this.isActive));
    }

    if (this.hasChildren) {
      /** Items of the inline popover open panels rather than menus */
      el.setAttribute('aria-haspopup', this.ariaRole === 'button' ? 'true' : 'menu');
      el.setAttribute('aria-expanded', 'false');
    }
  }

  /**
   * Activates confirmation mode for the item.
   * @param newState - new popover item params that should be applied
   */
  private enableConfirmationMode(newState: PopoverItemDefaultParams): void {
    if (this.nodes.root === null) {
      return;
    }

    const params = {
      ...this.params,
      ...newState,
      confirmation: 'confirmation' in newState ? newState.confirmation : undefined,
    } as PopoverItemDefaultParams;
    const confirmationEl = this.make(params);

    this.nodes.root.innerHTML = confirmationEl.innerHTML;
    /** Item becomes a different control, so its name and state should follow */
    PopoverItemDefault.copyAriaAttributes(confirmationEl, this.nodes.root);
    this.syncActiveStateAttribute();
    this.nodes.root.classList.add(css.confirmationState);

    this.confirmationState = newState;

    this.enableSpecialHoverAndFocusBehavior();
  }

  /**
   * Returns item to its original state
   */
  private disableConfirmationMode(): void {
    if (this.nodes.root === null) {
      return;
    }
    const itemWithOriginalParams = this.make(this.params);

    this.nodes.root.innerHTML = itemWithOriginalParams.innerHTML;
    PopoverItemDefault.copyAriaAttributes(itemWithOriginalParams, this.nodes.root);
    this.syncActiveStateAttribute();
    this.nodes.root.classList.remove(css.confirmationState);

    this.confirmationState = null;

    this.disableSpecialHoverAndFocusBehavior();
  }

  /**
   * Brings the pressed/checked state back in line with the active class of the item root.
   *
   * The attributes copied over from a freshly made element carry the state from the item
   * params, i.e. the one the item was constructed with. The root element, on the other hand,
   * is reused across the states and keeps the active class toggleActive() has left it with,
   * which is the state the item is actually in
   */
  private syncActiveStateAttribute(): void {
    const stateAttribute = this.ariaStateAttribute;

    if (this.nodes.root === null || stateAttribute === null) {
      return;
    }

    this.nodes.root.setAttribute(stateAttribute, String(this.nodes.root.classList.contains(css.active)));
  }

  /**
   * Enables special focus and hover behavior for item in confirmation state.
   * This is needed to prevent item from being highlighted as hovered/focused just after click.
   */
  private enableSpecialHoverAndFocusBehavior(): void {
    this.nodes.root?.classList.add(css.noHover);
    this.nodes.root?.classList.add(css.noFocus);

    this.nodes.root?.addEventListener('mouseleave', this.removeSpecialHoverBehavior, { once: true });
  }

  /**
   * Disables special focus and hover behavior
   */
  private disableSpecialHoverAndFocusBehavior(): void {
    this.removeSpecialFocusBehavior();
    this.removeSpecialHoverBehavior();

    this.nodes.root?.removeEventListener('mouseleave', this.removeSpecialHoverBehavior);
  }

  /**
   * Removes class responsible for special focus behavior on an item
   */
  private removeSpecialFocusBehavior = (): void => {
    this.nodes.root?.classList.remove(css.noFocus);
  };

  /**
   * Removes class responsible for special hover behavior on an item
   */
  private removeSpecialHoverBehavior = (): void => {
    this.nodes.root?.classList.remove(css.noHover);
  };

  /**
   * Executes item's onActivate callback if the item has no confirmation configured
   * @param item - item to activate or bring to confirmation mode
   */
  private activateOrEnableConfirmationMode(item: PopoverItemDefaultParams): void {
    if (!('confirmation' in item) || item.confirmation === undefined) {
      try {
        item.onActivate?.(item);
        this.disableConfirmationMode();
      } catch {
        this.animateError();
      }
    } else {
      this.enableConfirmationMode(item.confirmation);
    }
  }

  /**
   * Animates item which symbolizes that error occurred while executing 'onActivate()' callback
   */
  private animateError(): void {
    if (this.nodes.icon?.classList.contains(css.wobbleAnimation) === true) {
      return;
    }

    this.nodes.icon?.classList.add(css.wobbleAnimation);

    this.nodes.icon?.addEventListener('animationend', this.onErrorAnimationEnd);
  }

  /**
   * Handles finish of error animation
   */
  private onErrorAnimationEnd = (): void => {
    this.nodes.icon?.classList.remove(css.wobbleAnimation);
    this.nodes.icon?.removeEventListener('animationend', this.onErrorAnimationEnd);
  };
}
