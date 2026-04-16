import { generateId } from '../generateId';

/**
 * Event listener information
 */
export interface ListenerData {
  /**
   * Listener unique identifier
   */
  id: string;

  /**
   * Element where to listen to dispatched events
   */
  element: EventTarget;

  /**
   * Event to listen
   */
  eventType: string;

  /**
   * Event handler
   * @param {Event} event - event object
   */
  handler: (event: Event) => void;

  /**
   * @see https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
   */
  options: boolean | AddEventListenerOptions;
}

/**
 * Editor.js Listeners helper
 *
 * Decorator for event listeners assignment
 * @author Codex Team
 * @version 2.0.0
 */

/**
 * allListeners - listeners store
 */
export class Listeners {
  /**
   * Stores all listeners data to find/remove/process it
   */
  private allListeners: ListenerData[] = [];

  /**
   * Assigns event listener on element and returns unique identifier
   * @param element - DOM element that needs to be listened
   * @param eventType - event type string
   * @param handler - method that will be fired on event
   * @param options - useCapture or {capture, passive, once}
   */
  public on(
    element: EventTarget,
    eventType: string,
    handler: (event: Event) => void,
    options: boolean | AddEventListenerOptions = false
  ): string {
    const id = generateId('l');
    const assignedEventData = {
      id,
      element,
      eventType,
      handler,
      options,
    };

    const alreadyExist = this.findOne(element, eventType, handler);

    if (alreadyExist !== null) {
      return;
    }

    this.allListeners.push(assignedEventData);
    element.addEventListener(eventType, handler, options);

    return id;
  }

  /**
   * Removes event listener from element
   * @param element - DOM element that we are removing listener
   * @param eventType - event type string
   * @param handler - remove handler, if element listens several handlers on the same event type
   * @param options - useCapture or {capture, passive, once}
   */
  public off(
    element: EventTarget,
    eventType: string,
    handler?: (event: Event) => void,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    options?: boolean | AddEventListenerOptions
  ): void {
    const existingListeners = this.findAll(element, eventType, handler);

    existingListeners.forEach((listener, i) => {
      const index = this.allListeners.indexOf(existingListeners[i]);

      if (index > -1) {
        this.allListeners.splice(index, 1);

        listener.element.removeEventListener(listener.eventType, listener.handler, listener.options);
      }
    });
  }

  /**
   * Removes listener by id
   * @param id - listener identifier
   */
  public offById(id: string): void {
    const listener = this.findById(id);

    if (listener === undefined) {
      return;
    }

    listener.element.removeEventListener(listener.eventType, listener.handler, listener.options);
  }

  /**
   * Finds and returns first listener by passed params
   * @param element - event target
   * @param [eventType] - event type string
   * @param [handler] - event handler
   */
  public findOne(element: EventTarget, eventType?: string, handler?: (event: Event) => void): ListenerData {
    const foundListeners = this.findAll(element, eventType, handler);

    return foundListeners.length > 0 ? foundListeners[0] : null;
  }

  /**
   * Return all stored listeners by passed params
   * @param element - event target
   * @param eventType - event type string
   * @param handler - event handler function
   */
  public findAll(element: EventTarget, eventType?: string, handler?: (event: Event) => void): ListenerData[] {
    let found: ListenerData[] = [];
    const foundByEventTargets = (element !== undefined && element !== null) ? this.findByEventTarget(element) : [];

    if (element !== undefined && element !== null && eventType !== undefined && handler) {
      found = foundByEventTargets.filter(event => event.eventType === eventType && event.handler === handler);
    } else if (element !== undefined && element !== null && eventType !== undefined) {
      found = foundByEventTargets.filter(event => event.eventType === eventType);
    } else {
      found = foundByEventTargets;
    }

    return found;
  }

  /**
   * Removes all listeners
   */
  public removeAll(): void {
    this.allListeners.map((current) => {
      current.element.removeEventListener(current.eventType, current.handler, current.options);
    });

    this.allListeners = [];
  }

  /**
   * Module cleanup on destruction
   */
  public destroy(): void {
    this.removeAll();
  }

  /**
   * Search method: looks for listener by passed element
   * @param element - searching element
   * @returns listeners that found on element
   */
  private findByEventTarget(element: EventTarget): ListenerData[] {
    return this.allListeners.filter((listener) => {
      if (listener.element === element) {
        return listener;
      }
    });
  }

  /**
   * Search method: looks for listener by passed event type
   * @param eventType - event type string
   * @returns listeners that found on element
   */
  private findByType(eventType: string): ListenerData[] {
    return this.allListeners.filter((listener) => {
      if (listener.eventType === eventType) {
        return listener;
      }
    });
  }

  /**
   * Search method: looks for listener by passed handler
   * @param handler - event handler
   * @returns listeners that found on element
   */
  private findByHandler(handler: (event: Event) => void): ListenerData[] {
    return this.allListeners.filter((listener) => {
      if (listener.handler === handler) {
        return listener;
      }
    });
  }

  /**
   * Returns listener data found by id
   * @param id - listener identifier
   */
  private findById(id: string): ListenerData | undefined {
    return this.allListeners.find(listener => listener.id === id);
  }
}
