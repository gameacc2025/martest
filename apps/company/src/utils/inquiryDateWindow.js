const ERROR_CODES = Object.freeze({
  INVALID_PUBLISH_DATE: 'invalid_publish_date',
  INVALID_RESPONSE_DEADLINE: 'invalid_response_deadline',
  DEADLINE_NOT_FUTURE: 'deadline_not_future',
  DEADLINE_NOT_AFTER_PUBLISH: 'deadline_not_after_publish',
});

/**
 * Validate the same date-window invariants enforced by the inquiry API.
 * datetime-local values are interpreted in the browser's local timezone;
 * callers serialize accepted values to ISO before sending them.
 */
export function getInquiryDateWindowError({ publishDate, responseDeadline, now = new Date() } = {}) {
  const current = now instanceof Date ? now : new Date(now);
  if (Number.isNaN(current.getTime())) {
    throw new TypeError('now must be a valid date');
  }

  const publication = publishDate ? new Date(publishDate) : null;
  if (publishDate && Number.isNaN(publication.getTime())) {
    return ERROR_CODES.INVALID_PUBLISH_DATE;
  }

  const deadline = responseDeadline ? new Date(responseDeadline) : null;
  if (responseDeadline && Number.isNaN(deadline.getTime())) {
    return ERROR_CODES.INVALID_RESPONSE_DEADLINE;
  }

  if (deadline && deadline <= current) {
    return ERROR_CODES.DEADLINE_NOT_FUTURE;
  }
  if (publication && deadline && deadline <= publication) {
    return ERROR_CODES.DEADLINE_NOT_AFTER_PUBLISH;
  }

  return null;
}

export { ERROR_CODES as INQUIRY_DATE_WINDOW_ERRORS };
