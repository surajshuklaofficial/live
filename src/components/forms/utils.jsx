/**
 * Forces the submission of the form that is in the DOM with the given
 * identifier.
 *
 * @param  {string} formId  ID of the form in the DOM
 */
export function forceFormSubmission(formId) {
  const form = document.getElementById(formId);
  if (form) {
    form.dispatchEvent(new Event('submit', { cancelable: true }));
  }
}