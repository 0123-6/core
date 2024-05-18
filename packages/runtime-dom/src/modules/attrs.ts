import {
  NOOP,
  includeBooleanAttr,
  isSpecialBooleanAttr,
  makeMap,
} from '@vue/shared'
import {
  type ComponentInternalInstance,
  DeprecationTypes,
  compatUtils,
} from '@vue/runtime-core'

export const xlinkNS = 'http://www.w3.org/1999/xlink'

export function patchAttr(el: Element, key: string, value: any) {
  // note we are only checking boolean attributes that don't have a
  // corresponding dom prop of the same name here.
  const isBoolean = isSpecialBooleanAttr(key)
  if (value == null || (isBoolean && !includeBooleanAttr(value))) {
    el.removeAttribute(key)
  } else {
    el.setAttribute(key, isBoolean ? '' : value)
  }
}

// 2.x compat
const isEnumeratedAttr = __COMPAT__
  ? /*#__PURE__*/ makeMap('contenteditable,draggable,spellcheck')
  : NOOP

export function compatCoerceAttr(
  el: Element,
  key: string,
  value: unknown,
  instance: ComponentInternalInstance | null = null,
): boolean {
  if (isEnumeratedAttr(key)) {
    const v2CoercedValue =
      value === null
        ? 'false'
        : typeof value !== 'boolean' && value !== undefined
          ? 'true'
          : null
    if (
      v2CoercedValue &&
      compatUtils.softAssertCompatEnabled(
        DeprecationTypes.ATTR_ENUMERATED_COERCION,
        instance,
        key,
        value,
        v2CoercedValue,
      )
    ) {
      el.setAttribute(key, v2CoercedValue)
      return true
    }
  } else if (
    value === false &&
    !isSpecialBooleanAttr(key) &&
    compatUtils.softAssertCompatEnabled(
      DeprecationTypes.ATTR_FALSE_VALUE,
      instance,
      key,
    )
  ) {
    el.removeAttribute(key)
    return true
  }
  return false
}
