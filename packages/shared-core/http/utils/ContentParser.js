/**
 * @telecom-http-client/utils/ContentParser
 * Content parser utility
 * Handles parsing of various content types
 *
 * @module @telecom-http-client/utils/ContentParser
 */

/**
 * ContentParser class - Parses various content types
 * @class
 */
class ContentParser {
  /**
   * Parse content based on content type
   * @param {any} content - Content to parse
   * @param {string} contentType - Content type header
   * @returns {Promise<any>} Parsed content
   */
  static async parse(content, contentType = '') {
    if (content === null || content === undefined) {
      return null
    }

    // Normalize content type
    const type = contentType.toLowerCase().split(';')[0].trim()

    // Handle different content types
    switch (type) {
      case 'application/json':
      case 'application/json-patch+json':
      case 'application/vnd.api+json':
        return this.parseJSON(content)

      case 'text/plain':
      case 'text/html':
      case 'text/css':
      case 'text/javascript':
        return this.parseText(content)

      case 'application/x-www-form-urlencoded':
        return this.parseFormURLEncoded(content)

      case 'multipart/form-data':
        return this.parseFormData(content)

      case 'application/octet-stream':
        return this.parseBinary(content)

      default:
        // Try JSON first, then text
        try {
          return await this.parseJSON(content)
        } catch (error) {
          return this.parseText(content)
        }
    }
  }

  /**
   * Parse JSON content
   * @param {any} content - Content to parse
   * @returns {Promise<any>} Parsed JSON
   */
  static async parseJSON(content) {
    if (typeof content === 'string') {
      return JSON.parse(content)
    }

    if (content instanceof Response) {
      return content.json()
    }

    if (content instanceof Promise) {
      return content
    }

    return content
  }

  /**
   * Parse text content
   * @param {any} content - Content to parse
   * @returns {Promise<string>} Text content
   */
  static async parseText(content) {
    if (typeof content === 'string') {
      return content
    }

    if (content instanceof Response) {
      return content.text()
    }

    if (content instanceof Blob) {
      return content.text()
    }

    if (content instanceof Promise) {
      return content
    }

    return String(content)
  }

  /**
   * Parse form URL encoded content
   * @param {any} content - Content to parse
   * @returns {Promise<Object>} Parsed form data as object
   */
  static async parseFormURLEncoded(content) {
    if (typeof content === 'string') {
      const params = new URLSearchParams(content)
      const result = {}
      params.forEach((value, key) => {
        result[key] = value
      })
      return result
    }

    if (content instanceof URLSearchParams) {
      const result = {}
      content.forEach((value, key) => {
        result[key] = value
      })
      return result
    }

    if (content instanceof Response) {
      const text = await content.text()
      return this.parseFormURLEncoded(text)
    }

    return content
  }

  /**
   * Parse form data content
   * @param {any} content - Content to parse
   * @returns {Promise<Object>} Parsed form data as object
   */
  static async parseFormData(content) {
    if (content instanceof FormData) {
      const result = {}
      for (const [key, value] of content.entries()) {
        result[key] = value
      }
      return result
    }

    if (content instanceof Response) {
      const formData = await content.formData()
      return this.parseFormData(formData)
    }

    return content
  }

  /**
   * Parse binary content
   * @param {any} content - Content to parse
   * @returns {Promise<ArrayBuffer|Blob>} Binary content
   */
  static async parseBinary(content) {
    if (content instanceof ArrayBuffer) {
      return content
    }

    if (content instanceof Blob) {
      return content.arrayBuffer()
    }

    if (content instanceof Response) {
      return content.arrayBuffer()
    }

    return content
  }

  /**
   * Parse response with automatic content type detection
   * @param {Response} response - Fetch API response
   * @returns {Promise<any>} Parsed response data
   */
  static async parseResponse(response) {
    const contentType = response.headers.get('content-type') || ''
    return this.parse(response, contentType)
  }
}

export default ContentParser