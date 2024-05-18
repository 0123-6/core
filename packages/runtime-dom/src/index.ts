import {
  type CreateAppFunction,
  type Renderer,
  type RootRenderFunction,
  createRenderer,
} from '@vue/runtime-core'
import { nodeOps } from './nodeOps'
import { patchProp } from './patchProp'
// Importing from the compiler, will be tree-shaken in prod
import { NOOP, extend, isString } from '@vue/shared'

declare module '@vue/reactivity' {
  export interface RefUnwrapBailTypes {
    runtimeDOMBailTypes: Node | Window
  }
}

const rendererOptions = /*#__PURE__*/ extend({ patchProp }, nodeOps)

// lazy create the renderer - this makes core renderer logic tree-shakable
// in case the user only imports reactivity utilities from Vue.
//
let renderer: Renderer<Element | ShadowRoot>

/**
 * 获取渲染者对象，如果有直接返回，
 * 如果没有，先创建，缓存并返回
 */
function ensureRenderer() {
  return (
    renderer ||
    (renderer = createRenderer<Node, Element | ShadowRoot>(rendererOptions))
  )
}

// use explicit type casts here to avoid import() calls in rolled-up d.ts
export const render = ((...args) => {
  ensureRenderer().render(...args)
}) as RootRenderFunction<Element | ShadowRoot>

/**
 * Vue.createApp()方法定义
 */
export const createApp = ((...args) => {
  // 调用ensureRenderer().createApp()方法生成vm
  const app = ensureRenderer().createApp(...args)
  // 获取并改造vm.mount()方法
  const { mount } = app
  app.mount = (containerOrSelector: Element | ShadowRoot | string): any => {
    // 获取实际DOM
    const container = normalizeContainer(containerOrSelector)
    // 如果实际DOM不存在，直接返回
    if (!container) return

    // clear content before mounting
    // 清空要绑定的实际DOM
    container.innerHTML = ''
    // 调用app原来的mount方法开始绑定
    const proxy = mount(container)
    if (container instanceof Element) {
      container.removeAttribute('v-cloak')
      container.setAttribute('data-v-app', '')
    }
    // 返回mount()返回的proxy
    return proxy
  }
  // 返回vm
  return app
}) as CreateAppFunction<Element>

function normalizeContainer(
  container: Element | ShadowRoot | string,
): Element | null {
  if (isString(container)) {
    return document.querySelector(container)
  }
  return container as any
}

// Custom element support
export {
  defineCustomElement,
  VueElement,
  type VueElementConstructor,
} from './apiCustomElement'

// SFC CSS utilities
export { useCssModule } from './helpers/useCssModule'
export { useCssVars } from './helpers/useCssVars'

// **Internal** DOM-only runtime directive helpers
export {
  vModelText,
  vModelCheckbox,
  vModelRadio,
  vModelSelect,
  vModelDynamic,
} from './directives/vModel'
export { withModifiers, withKeys } from './directives/vOn'
export { vShow } from './directives/vShow'

/**
 * @internal
 */
export const initDirectivesForSSR = NOOP

// re-export everything from core
// h, Component, reactivity API, nextTick, flags & types
export * from '@vue/runtime-core'

export * from './jsx'
