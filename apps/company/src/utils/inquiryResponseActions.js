export function canSubmitInquiryResponse({ isOpen, deadlinePassed, isBuyer, existingResponse } = {}) {
  return Boolean(isOpen && !deadlinePassed && !isBuyer && !existingResponse)
}
