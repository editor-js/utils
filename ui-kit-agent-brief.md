# Agent brief: make `@editorjs/ui-kit`'s popover accessible

**Repo:** `@editorjs/ui-kit` (not this one — copy this file into that repo, or work from it there).
**Baseline audited:** 1.1.5. Line numbers are orientation only; locate by symbol name, since
the working tree may have moved on.

## Mission

`@editorjs/ui-kit` emits **zero** `role`/`aria-*` attributes. A grep across `src` returns no
matches; the only accessibility-adjacent line in the package is `tabIndex: -1` on the search
input, which is itself a workaround that removes the search from the keyboard entirely.

Every popover-driven surface in Editor.js — the inline formatting toolbar, the block
toolbox, every nested menu — is therefore unusable with a screen reader. Items have no role,
no name, and no state; keyboard navigation moves a CSS class rather than focus, so nothing
is announced.

The rationale and full findings are in `ui-kit-upstream.md` (companion file). This brief is
the executable version: what to change, in what order, and how to prove it.

**Core insight — most of this needs no new API.** The information is already passed in as
params (`title`, `toggle`, `isActive`, `isDisabled`); it simply isn't rendered as ARIA.
Deriving semantics from existing params fixes the majority of gaps with no consumer
migration and no breaking change.

## Repo facts you need

- `"type": "module"`, built with Vite (`yarn build` → `dist/`), typed via `vite-plugin-dts`.
- Scripts: `build`, `dev`, `lint` (eslint), `lint:styles` (stylelint). **There is no test
  script and no test framework** — Phase 0 adds one.
- `yarn dev` serves on **port 3300** and opens `./preview/index.html`, an existing manual
  playground that already builds a `PopoverDesktop` with a searchable list, a nested-children
  item, and an HTML item. This is your e2e fixture base.
- Dependencies you'll interact with: `@editorjs/dom` (`make()`, `Flipper`), `@editorjs/helpers`
  (`bem`, `tooltip`, `Listeners`), `@codexteam/icons`.

## Guardrails

- **Do not change visual behavior.** Every change here is attributes, roles, and focus
  management. If a change alters layout or styling, you've gone too far.
- **Do not break the Safari workaround.** `popover-inline.ts` sets `wrapperTag: 'button'`
  with a comment explaining it fixes focus loss on click in Safari. Keep it.
- **Keep the public API backward compatible.** New params must be optional. Existing
  consumers (`@editorjs/ui`, editor.js core) must keep working untouched — the whole point
  is that they get correct semantics *without* changing their call sites.
- **User-facing strings go through `messages`.** `PopoverAbstract` already has a
  `messages: PopoverMessages` field merged from `params.messages` (see `popover-abstract.ts`
  ~L56, L75-79). Any new literal string ("Back", "Search") must be added there, not hardcoded.
- Run `yarn lint` before finishing. The repo uses eslint with `jsdoc` rules — every new
  method and param needs a doc comment, matching the existing style.

---

# Phase 0 — Test infrastructure

Nothing exists. Scaffold Playwright against the preview server.

1. Add `@playwright/test` as a devDependency; add scripts:
   ```json
   "test:e2e": "playwright test",
   "test:e2e:ui": "playwright test --ui"
   ```
2. `playwright.config.ts` at the repo root:
   ```ts
   import { defineConfig, devices } from '@playwright/test';

   const PORT = 3300;

   export default defineConfig({
     testDir: './e2e/tests',
     fullyParallel: true,
     reporter: 'list',
     use: { baseURL: `http://localhost:${PORT}` },
     projects: [
       { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
       { name: 'webkit', use: { ...devices['Desktop Safari'] } },
     ],
     webServer: {
       command: `yarn dev`,
       url: `http://localhost:${PORT}`,
       reuseExistingServer: true,
     },
   });
   ```
   Confirm the dev server's `open` behavior doesn't interfere in CI; set `server.open: false`
   via an env guard if it does.
3. **Add dedicated fixtures rather than mutating `preview/index.html`** — that page is a
   manual playground and should stay one. Create `e2e/fixtures/` with three pages, each
   importing from `/src/index.ts` like the preview does, and each setting
   `document.body.dataset.ready = 'true'` once constructed so tests can wait deterministically:

   - **`menu.html`** — `PopoverDesktop`, `searchable: true`, containing: a plain item; two
     items sharing `toggle: 'group-key'` (radio semantics) with one `isActive`; one
     `toggle: true` item; one `isDisabled` item; one item with `children`; one item with
     `confirmation`; one `PopoverItemType.Separator`; one `PopoverItemType.Html`.
   - **`inline.html`** — `PopoverInline` with two items, one `isActive: () => true`, one
     `isActive: () => false`, both icon-only (title present but rendered as hint).
   - **`mobile.html`** — `PopoverMobile`.

   Give every item a stable `name` so tests have a non-ARIA fallback selector while you're
   mid-migration.

Verify the harness runs (`yarn test:e2e`) with one trivial assertion before starting Phase 1.

---

# Phase 1 — Item roles, names, and disabled state

**Severity: highest.** Icon-only items currently have *no accessible name at all*.

**File:** `src/popover/components/popover-item/popover-item-default/popover-item-default.ts`

In `make()` (~L149-199), the title is only rendered when `params.title !== undefined`:

```ts
if (params.title !== undefined) {
  el.appendChild(make('div', css.title, { innerHTML: params.title || '' }));
}
```

`PopoverInline` renders items icon-only (title goes to a hover hint), so those buttons are
nameless. Set the accessible name unconditionally from `title`, independent of whether the
visible title node is created.

Add two private getters to derive semantics from existing params:

```ts
/**
 * ARIA role for the item, derived from its toggle behavior.
 * Can be overridden by the popover via render params — inline popovers render
 * items as buttons in a toolbar rather than as menu items.
 */
private get ariaRole(): string {
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
    case 'button':
      return 'aria-pressed';
    default:
      return null;
  }
}
```

This requires retaining `renderParams` on the instance — the constructor currently passes it
to `make()` and drops it. Store it as a private readonly field.

In `make()`, after creating `el`:

```ts
el.setAttribute('role', this.ariaRole);

if (params.title !== undefined) {
  el.setAttribute('aria-label', params.title);
}

if (params.isDisabled === true) {
  el.setAttribute('aria-disabled', 'true');
}

const stateAttribute = this.ariaStateAttribute;

if (stateAttribute !== null) {
  el.setAttribute(stateAttribute, String(this.isActive));
}
```

Also set `aria-hidden="true"` on the icon node and the chevron node — they're decorative and
would otherwise be announced alongside the label.

**Types:** add `ariaRole?: string` to `PopoverItemRenderParamsMap[PopoverItemType.Default]`
in `src/popover/types/popover-item.ts` (~L226-252), beside the existing `wrapperTag`.

**Inline popover:** in `src/popover/popover-inline.ts`, add `ariaRole: 'button'` alongside the
existing `wrapperTag: 'button'`. Items are already native `<button>`, so this mainly selects
`aria-pressed` as the state attribute rather than `aria-checked`.

### E2E

`e2e/tests/item-semantics.spec.ts`:
- menu fixture: every item resolves via `getByRole('menuitem', { name: … })`; the
  `toggle: 'group-key'` items resolve as `menuitemradio`; the `toggle: true` item as
  `menuitemcheckbox`; the disabled item has `aria-disabled="true"`.
- inline fixture: **`getByRole('button', { name: 'Bold' })` resolves** — this is the
  regression test for the icon-only naming bug, and the one that most directly unblocks
  downstream consumers.
- no item exposes its icon as content: assert the accessible name equals the title exactly.

---

# Phase 2 — Active state stays in sync

**File:** same as Phase 1.

`toggleActive()` currently only touches a class:

```ts
public toggleActive(isActive?: boolean): void {
  this.nodes.root?.classList.toggle(css.active, isActive);
}
```

Make it write the ARIA state too:

```ts
public toggleActive(isActive?: boolean): void {
  const nextState = isActive ?? !this.isActive;

  this.nodes.root?.classList.toggle(css.active, nextState);

  const stateAttribute = this.ariaStateAttribute;

  if (stateAttribute !== null) {
    this.nodes.root?.setAttribute(stateAttribute, String(nextState));
  }
}
```

Note the existing signature takes `isActive?: boolean` and relies on `classList.toggle`'s
undefined-means-flip behavior; preserve that semantic when computing `nextState`.

Items sharing a `toggle` key form a radio group. Wrap each such group in a
`role="group"` container in `PopoverAbstract`'s item rendering so the grouping is conveyed,
not just the individual checked states.

### E2E

- Click a `menuitemradio`: it becomes `aria-checked="true"` and its group sibling flips to
  `"false"`.
- Click a `menuitemcheckbox` twice: `aria-checked` toggles `true` → `false`.
- Inline fixture: the active item starts `aria-pressed="true"`, the inactive one `"false"`.

---

# Phase 3 — Container roles

**File:** `src/popover/popover-abstract.ts` (~L92), `src/popover/popover-inline.ts`.

`this.nodes.items = make('div', [css.items])` is a dedicated container and a *sibling* of the
search input (search is inserted into `popoverContainer` before it — see
`popover-desktop.ts` `addSearch()`), so it can take a menu role cleanly.

Add a protected getter so subclasses can override:

```ts
/**
 * ARIA role for the items container. Menus by default; inline popovers are toolbars.
 */
protected get itemsContainerRole(): string {
  return 'menu';
}
```

Set `this.nodes.items.setAttribute('role', this.itemsContainerRole)` at construction, and
override the getter to return `'toolbar'` in `PopoverInline`. Give the popover root an
`aria-label` from `messages`, or `aria-labelledby` pointing at the header text when one
exists (see Phase 5).

### E2E

- menu fixture: `getByRole('menu')` resolves and contains the menu items.
- inline fixture: `getByRole('toolbar')` resolves and contains the buttons.
- The search input is **not** a child of the menu container.

---

# Phase 4 — Focus model (largest piece)

**Files:** `src/popover/popover-desktop.ts` (flipper setup ~L91-104),
`popover-item-default.ts` (`isFocused` ~L48-55, `onFocus`).

`Flipper` is constructed with `focusedItemClass: popoverItemCls.focused` and moves that class
between items on arrow keys. **DOM focus never moves**, and there is no
`aria-activedescendant`. A screen reader user arrowing through the menu hears nothing while
the visual highlight travels.

This is the gap that makes the component unnavigable rather than merely unlabelled.

**Recommended: roving tabindex.** The focused item gets `tabindex="0"` and a real `.focus()`;
all others get `tabindex="-1"`. This makes `isFocused` a `document.activeElement` check
instead of a class check, and it's what makes Phase 6 tractable.

- Set `tabindex="-1"` on every item in `make()`.
- On flip, move `tabindex="0"` to the newly focused item and call `.focus()` on it.
- Keep the `focused` CSS class in sync so styling is unaffected — or better, restyle from
  `:focus-visible` and retire the class once nothing depends on it. Check consumers before
  removing it; `@editorjs/ui` does not reference it, but editor.js core may.

The alternative (`aria-activedescendant` on the items container plus generated item ids) is
less invasive to `Flipper` but keeps focus in a wrapper rather than on the items; prefer
roving tabindex unless `Flipper`'s shared use across editor.js makes that impractical.

`Flipper` lives in `@editorjs/dom`. If it can't express this, add the behavior in
`popover-desktop.ts`'s `onFlip`/`setCaretToItem` handlers rather than forking `Flipper`.

### E2E

- Open the menu, press `ArrowDown`: assert `page.locator(':focus')` is the first item and it
  has `tabindex="0"`; assert every other item has `tabindex="-1"`.
- `ArrowDown` again moves real focus to the second item.
- `Enter` activates the focused item (assert via a `window.__activated` hook set by the
  fixture's `onActivate`).
- Focus visibly follows keyboard nav in both chromium and webkit.

---

# Phase 5 — `PopoverHeader` back button

**File:** `src/popover/components/popover-header/popover-header.ts`.

```ts
backButton: Dom.make('button', [css.backButton]),
...
this.nodes.backButton.innerHTML = IconChevronLeft;
```

A `<button>` whose only content is an injected SVG — **no accessible name**. On mobile, where
nested menus render as pages with this header, a screen reader user cannot navigate back out
of a submenu.

- Set `aria-label` on the back button, sourced from `messages` (add a `back` message with a
  default of `'Back'`); `PopoverHeader` will need the message passed through its params.
- Set `aria-hidden="true"` on the chevron SVG.
- Give the header text an id and reference it from the popover root via `aria-labelledby`, so
  entering a submenu announces which one.

### E2E

- mobile fixture: open a nested item, then `getByRole('button', { name: 'Back' })` resolves
  and returns to the parent list.

---

# Phase 6 — Search input

**File:** `src/popover/components/search-input/search-input.ts` (~L60-70).

```ts
this.input = make('input', css.input, {
  placeholder,
  /**
   * Used to prevent focusing on the input by Tab key
   * (Popover in the Toolbar lays below the blocks,
   * so Tab in the last block will focus this hidden input if this property is not set)
   */
  tabIndex: -1,
});
```

Two problems. First, a placeholder is not a label — it isn't reliably announced and vanishes
on input. Second, the comment is candid that `tabIndex: -1` is a workaround for a *hidden*
popover's input catching Tab, applied permanently — so the search is unreachable by keyboard
even when the popover is open.

- Add `aria-label` (via `messages`, defaulting to the same string as `placeholder`) and
  `type="search"`.
- Replace the tabindex hack with real visibility management: a closed popover should be
  `hidden` or `inert`, at which point its input is naturally untabbable and `tabIndex: -1`
  can be dropped. Phase 4's focus work is what makes this safe.
- Set `aria-hidden="true"` on the search icon.

Optionally wire the full combobox pattern (`role="combobox"`, `aria-expanded`,
`aria-controls` → items container, `aria-autocomplete="list"`). Treat as a follow-up; the
label and reachability fixes are the valuable part.

### E2E

- menu fixture: `getByRole('searchbox', { name: … })` resolves and is reachable by `Tab` when
  the popover is open.
- When the popover is closed, the input is not focusable (assert `Tab` from a preceding
  element doesn't land on it).

---

# Phase 7 — Announcements for dynamic state

### 7a. Search results (`popover-abstract.ts` ~L87-91)

The `nothingFoundMessage` node appears silently. Add `role="status"` (or
`aria-live="polite"`). Better: one polite live region owned by the popover that reports the
result count on filter ("3 results"), which also gives 7b somewhere to announce.

### 7b. Confirmation mode (`popover-item-default.ts` ~L205-240)

```ts
this.nodes.root.innerHTML = confirmationEl.innerHTML;
```

`enableConfirmationMode()` swaps the item's children in place: same element, new icon, new
title, new action. The control silently becomes a different control, and if focus is on it,
nothing is re-announced.

- Re-set `aria-label` from the confirmation params in `enableConfirmationMode()`, and restore
  it in `disableConfirmationMode()`. Because both call `make()` on fresh params, the cleanest
  fix is to have them copy the root's ARIA attributes from the freshly-made element rather
  than only its `innerHTML`.
- Announce the transition via the live region from 7a.

Note this `innerHTML` replacement is *why* consumers can't safely apply their own ARIA to item
children, and a large part of the motivation for this whole brief.

### 7c. Nested popovers (`popover-desktop.ts` `showNestedItems()` ~L207, `onChildrenClose()`)

Items with `children` open a nested popover but advertise nothing. Set
`aria-haspopup="menu"` at construction when `hasChildren` is true, and toggle
`aria-expanded` in `showNestedItems()` / `destroyNestedPopoverIfExists()` /
`onChildrenClose()`. If the nested popover gets an id, point `aria-controls` at it.

### E2E

- Type a non-matching query: assert the status region contains the nothing-found text.
- Trigger a confirmation item: assert its accessible name changes to the confirmation title,
  and reverts on `reset()`.
- The children item has `aria-haspopup="menu"` and `aria-expanded="false"`, flipping to
  `"true"` when the nested popover opens and back on close.

---

# Phase 8 — Remaining items

- **`PopoverMobile`** (`popover-mobile.ts`) — an overlay + `ScrollLocker` + fixed panel is a
  modal in all but semantics. Add `role="dialog"`, `aria-modal="true"`, a focus trap while
  open, focus restoration to the trigger on close, and `Esc` to dismiss. Marking the
  background `inert` pairs naturally with the existing scroll lock.
  **E2E:** mobile fixture — `getByRole('dialog')` resolves; `Tab` cycles within it; `Esc`
  closes and returns focus to the trigger.
- **`PopoverItemSeparator`** (`popover-item-separator.ts`) — `role="separator"`.
- **`PopoverItemHtml`** (`popover-item-html.ts`) — the wrapper `<div>` has no role, and inside
  a `role="menu"` an unroled wrapper breaks the required parent/child structure. Set
  `role="none"` so its children (which `getControls()` shows are expected to be buttons and
  inputs) participate directly.
- **`Hint`** (`components/hint/hint.ts`) — attached via `tooltip.onHover`, so it's hover-only:
  never announced, unreachable by keyboard, despite holding the shortcut description. Give it
  `role="tooltip"` and an id, reference it from the item via `aria-describedby`, and show it
  on focus as well as hover.
- **`toggleHidden()`** — filtering hides items with a CSS class only. If that class resolves
  to `display: none` the AT tree follows, but implicitly; also set the `hidden` attribute so
  the intent survives CSS changes.
  **E2E:** filter the list, assert hidden items are excluded from `getByRole('menuitem')`.

---

# Phase 9 — Optional API escape hatch

Only after the derived behavior above is settled. Add to `PopoverItemDefaultBaseParams`:

```ts
/** Accessible name. Defaults to `title`. */
ariaLabel?: string;
/** Overrides the derived ARIA role. */
role?: 'menuitem' | 'menuitemcheckbox' | 'menuitemradio' | 'option' | 'button';
```

Both optional, both defaulting to the derived values, so no consumer changes.

---

# Verification

```bash
yarn lint
yarn lint:styles
yarn build          # must still emit dist/ + d.ts cleanly
yarn test:e2e       # chromium + webkit
```

**Downstream check (strongly recommended before release).** The consumer that motivated this
is `@editorjs/ui` in the `document-model` repo. To verify end to end:

1. `yarn link` this package into that repo (or `yarn pack` and install the tarball).
2. `yarn workspace @editorjs/editorjs build && yarn workspace @editorjs/editorjs test:e2e`.
3. The existing suite must stay green — especially
   `bolds selected text via the inline toolbar`, which exercises the inline popover.
4. Then confirm these now resolve, which they cannot today:
   ```ts
   page.getByRole('button', { name: 'Bold' })          // inline toolbar item
   page.getByRole('menuitem', { name: 'Paragraph' })   // toolbox entry
   ```
   That repo has a change (`add-editor-aria-semantics`) with a follow-up task waiting on
   exactly this.

# Suggested commit sequence

| Commits | Phases | Release |
| --- | --- | --- |
| 1 | Phase 0 (test scaffold) | — |
| 2-4 | Phases 1-3 (names, state, container roles) | patch — additive attributes, no behavior change |
| 5 | Phase 4 (focus model) | **minor** — changes focus behavior, needs a changelog note |
| 6-8 | Phases 5-8 | minor |
| 9 | Phase 9 (optional params) | minor |

Phases 1-3 are the highest value per unit of risk: they're pure attribute additions that
give every consumer accessible names and state for free. Ship them first rather than holding
them behind the focus rework.
