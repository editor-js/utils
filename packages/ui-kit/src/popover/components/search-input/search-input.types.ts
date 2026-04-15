/**
 * Item that could be searched
 */
export interface SearchableItem {
  /**
   * Items title
   */
  title?: string;
}

/**
 * Event that can be triggered by the Search Input
 */
export enum SearchInputEvent {
  /**
   * When search query applied
   */
  Search = 'search'
}

/**
 * Events fired by the Search Input
 */
export interface SearchInputEventMap {
  /**
   * Fired when search query applied
   */
  [SearchInputEvent.Search]: {
    /**
     * Search query string
     */
    query: string;
    /**
     * Found Items
     */
    items: SearchableItem[];
  };
}
