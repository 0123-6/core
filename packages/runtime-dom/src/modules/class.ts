// compiler should normalize class + :class bindings on the same element
// into a single binding ['staticClass', dynamic]
export function patchClass(el: Element, value: string | null) {
  // directly setting className should be faster than setAttribute in theory
  // if this is an element during a transition, take the temporary transition
  // classes into account.
  if (value == null) {
    el.removeAttribute('class')
  } else {
    el.className = value
  }
}
