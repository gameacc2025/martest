/**
 * @telecom-http-client/utils/EventEmitter
 * Simple event emitter implementation
 * Provides pub/sub functionality for the HTTP client
 *
 * @module @telecom-http-client/utils/EventEmitter
 */

/**
 * EventEmitter class - Simple event emitter implementation
 * @class
 */
class EventEmitter {
  /**
   * Create a new EventEmitter instance
   */
  constructor() {
    this._events = new Map()
    this._maxListeners = 10
  }

  /**
   * Subscribe to an event
   * @param {string} eventName - Event name
   * @param {Function} listener - Listener function
   * @param {Object} [context=null] - Context for the listener
   * @returns {Function} Unsubscribe function
   */
  on(eventName, listener, context = null) {
    if (typeof listener !== 'function') {
      throw new TypeError('Listener must be a function')
    }

    if (!this._events.has(eventName)) {
      this._events.set(eventName, new Set())
    }

    const listeners = this._events.get(eventName)
    listeners.add({ listener, context })

    // Check for memory leak
    if (listeners.size > this._maxListeners) {
      console.warn(`Possible EventEmitter memory leak detected. ${listeners.size} listeners added for event "${eventName}".`)
    }

    // Return unsubscribe function
    return () => this.off(eventName, listener, context)
  }

  /**
   * Subscribe to an event (alias for on)
   * @param {string} eventName - Event name
   * @param {Function} listener - Listener function
   * @param {Object} [context=null] - Context for the listener
   * @returns {Function} Unsubscribe function
   */
  addListener(eventName, listener, context = null) {
    return this.on(eventName, listener, context)
  }

  /**
   * Subscribe to an event that will be called only once
   * @param {string} eventName - Event name
   * @param {Function} listener - Listener function
   * @param {Object} [context=null] - Context for the listener
   * @returns {Function} Unsubscribe function
   */
  once(eventName, listener, context = null) {
    if (typeof listener !== 'function') {
      throw new TypeError('Listener must be a function')
    }

    const onceWrapper = (...args) => {
      this.off(eventName, onceWrapper, context)
      listener.apply(context, args)
    }

    return this.on(eventName, onceWrapper, context)
  }

  /**
   * Unsubscribe from an event
   * @param {string} eventName - Event name
   * @param {Function} listener - Listener function
   * @param {Object} [context=null] - Context for the listener
   * @returns {boolean} True if listener was removed
   */
  off(eventName, listener, context = null) {
    if (!this._events.has(eventName)) {
      return false
    }

    const listeners = this._events.get(eventName)

    for (const item of listeners) {
      if (item.listener === listener && item.context === context) {
        listeners.delete(item)
        return true
      }
    }

    return false
  }

  /**
   * Unsubscribe from an event (alias for off)
   * @param {string} eventName - Event name
   * @param {Function} listener - Listener function
   * @param {Object} [context=null] - Context for the listener
   * @returns {boolean} True if listener was removed
   */
  removeListener(eventName, listener, context = null) {
    return this.off(eventName, listener, context)
  }

  /**
   * Emit an event
   * @param {string} eventName - Event name
   * @param {...any} args - Arguments to pass to listeners
   * @returns {boolean} True if event had listeners
   */
  emit(eventName, ...args) {
    if (!this._events.has(eventName)) {
      return false
    }

    const listeners = this._events.get(eventName)
    const listenersArray = Array.from(listeners)

    for (const item of listenersArray) {
      try {
        item.listener.apply(item.context, args)
      } catch (error) {
        console.error(`Error in event listener for "${eventName}":`, error)
      }
    }

    return listenersArray.length > 0
  }

  /**
   * Get all listeners for an event
   * @param {string} eventName - Event name
   * @returns {Array<Function>} Array of listeners
   */
  listeners(eventName) {
    if (!this._events.has(eventName)) {
      return []
    }
    return Array.from(this._events.get(eventName)).map(item => item.listener)
  }

  /**
   * Get the number of listeners for an event
   * @param {string} eventName - Event name
   * @returns {number} Number of listeners
   */
  listenerCount(eventName) {
    if (!this._events.has(eventName)) {
      return 0
    }
    return this._events.get(eventName).size
  }

  /**
   * Remove all listeners for an event
   * @param {string} eventName - Event name
   * @returns {EventEmitter} Returns this for chaining
   */
  removeAllListeners(eventName) {
    if (this._events.has(eventName)) {
      this._events.delete(eventName)
    }
    return this
  }

  /**
   * Remove all listeners for all events
   * @returns {EventEmitter} Returns this for chaining
   */
  removeAllListeners() {
    this._events.clear()
    return this
  }

  /**
   * Get all event names
   * @returns {Array<string>} Array of event names
   */
  eventNames() {
    return Array.from(this._events.keys())
  }

  /**
   * Set the maximum number of listeners per event
   * @param {number} maxListeners - Maximum number of listeners
   * @returns {EventEmitter} Returns this for chaining
   */
  setMaxListeners(maxListeners) {
    this._maxListeners = maxListeners
    return this
  }

  /**
   * Get the maximum number of listeners per event
   * @returns {number} Maximum number of listeners
   */
  getMaxListeners() {
    return this._maxListeners
  }

  /**
   * Check if an event has any listeners
   * @param {string} eventName - Event name
   * @returns {boolean} True if event has listeners
   */
  hasListeners(eventName) {
    return this._events.has(eventName) && this._events.get(eventName).size > 0
  }

  /**
   * Get the number of listeners for all events
   * @returns {number} Total number of listeners
   */
  getTotalListeners() {
    let count = 0
    for (const listeners of this._events.values()) {
      count += listeners.size
    }
    return count
  }

  /**
   * Get string representation
   * @returns {string} String representation
   */
  toString() {
    return `[EventEmitter: ${this.getTotalListeners()} listeners]`
  }
}

export default EventEmitter