/**
 * Utility functions for keyboard extension
 * @module
 */

/**
 * Checks if an input element accepts text input
 * @param element Input element to check
 * @returns True if the input accepts text
 */
export function isTextInput(element: HTMLInputElement): boolean {
  const inputType = element.type.toLowerCase()
  const nonTextInputTypes = ['button', 'checkbox', 'radio', 'submit', 'reset', 'file', 'image', 'hidden']

  return !nonTextInputTypes.includes(inputType)
}

/**
 * Checks if an element or its parent is contentEditable
 * @param element Element to check
 * @returns True if element is contentEditable
 */
export function isContentEditable(element: Element): boolean {
  let current: Element | null = element

  while (current) {
    if (current.hasAttribute('contenteditable')) {
      const contentEditable = current.getAttribute('contenteditable')?.toLowerCase()

      return contentEditable === 'true' || contentEditable === ''
    }
    current = current.parentElement
  }

  return false
}

/**
 * Checks if an element is an input element that accepts text
 * @param element Element to check
 * @returns True if element is a text input
 */
function isTextInputElement(element: Element): boolean {
  const tagName = element.tagName.toLowerCase()

  if (tagName === 'input' && element instanceof HTMLInputElement) {
    return isTextInput(element)
  }

  return tagName === 'textarea'
}

/**
 * Checks if the event target is an editable element where text input is expected
 * @param target Event target element
 * @returns True if the target is an editable element
 */
export function isEditableElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof Element)) return false

  return isTextInputElement(target) || isContentEditable(target)
}
