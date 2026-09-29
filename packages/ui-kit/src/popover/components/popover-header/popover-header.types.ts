/**
 * Popover header params interface
 */
export interface PopoverHeaderParams {
  /**
   * Text to be displayed inside header
   */
  text: string;

  /**
   * Back button click handler
   */
  onBackButtonClick: () => void;

  /**
   * Accessible name of the back button. The button displays an icon only,
   * so without it screen reader users can not leave a nested popover
   */
  backButtonLabel?: string;
}
