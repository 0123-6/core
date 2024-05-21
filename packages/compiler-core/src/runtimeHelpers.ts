export const FRAGMENT = Symbol(``)
export const TELEPORT = Symbol(``)
export const SUSPENSE = Symbol(``)
export const KEEP_ALIVE = Symbol(``)
export const BASE_TRANSITION = Symbol(``)
export const OPEN_BLOCK = Symbol(``)
export const CREATE_BLOCK = Symbol(``)
export const CREATE_ELEMENT_BLOCK = Symbol(``)
export const CREATE_VNODE = Symbol(``)
export const CREATE_ELEMENT_VNODE = Symbol(``)
export const CREATE_COMMENT = Symbol(``)
export const CREATE_TEXT = Symbol(``)
export const CREATE_STATIC = Symbol(``)
export const RESOLVE_COMPONENT = Symbol(``)
export const RESOLVE_DYNAMIC_COMPONENT = Symbol(
  ``,
)
export const RESOLVE_DIRECTIVE = Symbol(``)
export const RESOLVE_FILTER = Symbol(``)
export const WITH_DIRECTIVES = Symbol(``)
export const RENDER_LIST = Symbol(``)
export const RENDER_SLOT = Symbol(``)
export const CREATE_SLOTS = Symbol(``)
export const TO_DISPLAY_STRING = Symbol(``)
export const MERGE_PROPS = Symbol(``)
export const NORMALIZE_CLASS = Symbol(``)
export const NORMALIZE_STYLE = Symbol(``)
export const NORMALIZE_PROPS = Symbol(``)
export const GUARD_REACTIVE_PROPS = Symbol(``)
export const TO_HANDLERS = Symbol(``)
export const CAMELIZE = Symbol(``)
export const CAPITALIZE = Symbol(``)
export const TO_HANDLER_KEY = Symbol(``)
export const SET_BLOCK_TRACKING = Symbol(``)
export const PUSH_SCOPE_ID = Symbol(``)
export const POP_SCOPE_ID = Symbol(``)
export const WITH_CTX = Symbol(``)
export const UNREF = Symbol(``)
export const IS_REF = Symbol(``)
export const WITH_MEMO = Symbol(``)
export const IS_MEMO_SAME = Symbol(``)

// Name mapping for runtime helpers that need to be imported from 'vue' in
// generated code. Make sure these are correctly exported in the runtime!
export const helperNameMap: Record<symbol, string> = {
  [FRAGMENT]: `Fragment`,
  [TELEPORT]: `Teleport`,
  [SUSPENSE]: `Suspense`,
  [KEEP_ALIVE]: `KeepAlive`,
  [BASE_TRANSITION]: `BaseTransition`,
  [OPEN_BLOCK]: `openBlock`,
  [CREATE_BLOCK]: `createBlock`,
  [CREATE_ELEMENT_BLOCK]: `createElementBlock`,
  [CREATE_VNODE]: `createVNode`,
  [CREATE_ELEMENT_VNODE]: `createElementVNode`,
  [CREATE_COMMENT]: `createCommentVNode`,
  [CREATE_TEXT]: `createTextVNode`,
  [CREATE_STATIC]: `createStaticVNode`,
  [RESOLVE_COMPONENT]: `resolveComponent`,
  [RESOLVE_DYNAMIC_COMPONENT]: `resolveDynamicComponent`,
  [RESOLVE_DIRECTIVE]: `resolveDirective`,
  [RESOLVE_FILTER]: `resolveFilter`,
  [WITH_DIRECTIVES]: `withDirectives`,
  [RENDER_LIST]: `renderList`,
  [RENDER_SLOT]: `renderSlot`,
  [CREATE_SLOTS]: `createSlots`,
  [TO_DISPLAY_STRING]: `toDisplayString`,
  [MERGE_PROPS]: `mergeProps`,
  [NORMALIZE_CLASS]: `normalizeClass`,
  [NORMALIZE_STYLE]: `normalizeStyle`,
  [NORMALIZE_PROPS]: `normalizeProps`,
  [GUARD_REACTIVE_PROPS]: `guardReactiveProps`,
  [TO_HANDLERS]: `toHandlers`,
  [CAMELIZE]: `camelize`,
  [CAPITALIZE]: `capitalize`,
  [TO_HANDLER_KEY]: `toHandlerKey`,
  [SET_BLOCK_TRACKING]: `setBlockTracking`,
  [PUSH_SCOPE_ID]: `pushScopeId`,
  [POP_SCOPE_ID]: `popScopeId`,
  [WITH_CTX]: `withCtx`,
  // [UNREF]: `unref`,
  [IS_REF]: `isRef`,
  [WITH_MEMO]: `withMemo`,
  [IS_MEMO_SAME]: `isMemoSame`,
}

export function registerRuntimeHelpers(helpers: Record<symbol, string>) {
  Object.getOwnPropertySymbols(helpers).forEach(s => {
    helperNameMap[s] = helpers[s]
  })
}
