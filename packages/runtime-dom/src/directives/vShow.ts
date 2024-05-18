import type { ObjectDirective } from '@vue/runtime-core'

export const vShowOriginalDisplay = Symbol('_vod')
export const vShowHidden = Symbol('_vsh')

export interface VShowElement extends HTMLElement {
  // _vod = vue original display
  [vShowOriginalDisplay]: string
  [vShowHidden]: boolean
}

export const vShow: ObjectDirective<VShowElement> & { name?: 'show' } = {
  beforeMount(el, { value }) {
    el[vShowOriginalDisplay] =
      el.style.display === 'none' ? '' : el.style.display
    setDisplay(el, value)
  },
  updated(el, { value, oldValue }) {
    if (!value === !oldValue) return
    setDisplay(el, value)
  },
  beforeUnmount(el, { value }) {
    setDisplay(el, value)
  },
}

function setDisplay(el: VShowElement, value: unknown): void {
  el.style.display = value ? el[vShowOriginalDisplay] : 'none'
  el[vShowHidden] = !value
}
