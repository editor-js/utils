import './styles/variables.css';
import './styles/popover.css';
import './styles/popover-inline.css';
import { PopoverDesktop } from './popover-desktop';
import { PopoverInline } from './popover-inline';
import { PopoverMobile } from './popover-mobile';

/**
 * Union type for all popovers
 */
export type Popover = PopoverDesktop | PopoverMobile | PopoverInline;

export { PopoverDesktop, PopoverMobile, PopoverInline };

export * from './types';
