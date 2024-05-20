import { def, isObject } from '@vue/shared'
import type { RawSymbol, Ref, UnwrapRefSimple } from './ref'
import { ReactiveFlags } from './constants'
import { proxyHandler } from './proxyHandler'

export interface Target {
  [ReactiveFlags.SKIP]?: boolean
  [ReactiveFlags.IS_REACTIVE]?: boolean
  [ReactiveFlags.RAW]?: any
}

export const reactiveMap = new WeakMap<Target, any>()

// only unwrap nested ref
export type UnwrapNestedRefs<T> = T extends Ref ? T : UnwrapRefSimple<T>

// 返回一个对象的响应式代理
export function reactive(target: object) {
  // 如果target不是对象类型，直接返回
  if (!isObject(target)) {
    return target
  }
  // 如果target已经是一个proxy，直接返回
  if (target[ReactiveFlags.RAW]) {
    return target
  }
  // 已经存在这个对象的缓存，返回对应缓存
  const existingProxy = reactiveMap.get(target)
  if (existingProxy) {
    return existingProxy
  }
  // 定义新的proxy对象
  const proxy = new Proxy(
    target,
    proxyHandler,
  )
  // 将新对象放入缓存中
  reactiveMap.set(target, proxy)
  // 返回新对象
  return proxy
}

// 判断指定值是否是reactive对象
export function isReactive(value: unknown): boolean {
  return !!(value && (value as Target)[ReactiveFlags.IS_REACTIVE])
}

/**
 * Checks if an object is a proxy created by {@link reactive},
 * {@link readonly}, {@link shallowReactive} or {@link shallowReadonly()}.
 *
 * @param value - The value to check.
 * @see {@link https://vuejs.org/api/reactivity-utilities.html#isproxy}
 */
export function isProxy(value: any): boolean {
  return value ? !!value[ReactiveFlags.RAW] : false
}

/**
 * Returns the raw, original object of a Vue-created proxy.
 *
 * `toRaw()` can return the original object from proxies created by
 * {@link reactive()}, {@link readonly()}, {@link shallowReactive()} or
 * {@link shallowReadonly()}.
 *
 * This is an escape hatch that can be used to temporarily read without
 * incurring proxy access / tracking overhead or write without triggering
 * changes. It is **not** recommended to hold a persistent reference to the
 * original object. Use with caution.
 *
 * @example
 * ```js
 * const foo = {}
 * const reactiveFoo = reactive(foo)
 *
 * console.log(toRaw(reactiveFoo) === foo) // true
 * 返回被Proxy代理的原始对象。绕过proxy，避免性能浪费。
 *
 * ```
 *
 * @param observed - The object for which the "raw" value is requested.
 * @see {@link https://vuejs.org/api/reactivity-advanced.html#toraw}
 */
export function toRaw<T>(observed: T): T {
  const raw = observed && (observed as Target)[ReactiveFlags.RAW]
  return raw ? toRaw(raw) : observed
}

export type Raw<T> = T & { [RawSymbol]?: true }

/**
 * Marks an object so that it will never be converted to a proxy. Returns the
 * object itself.
 *
 * @example
 * ```js
 * const foo = markRaw({})
 * console.log(isReactive(reactive(foo))) // false
 *
 * // also works when nested inside other reactive objects
 * const bar = reactive({ foo })
 * console.log(isReactive(bar.foo)) // false
 * ```
 *
 * **Warning:** `markRaw()` together with the shallow APIs such as
 * {@link shallowReactive()} allow you to selectively opt-out of the default
 * deep reactive/readonly conversion and embed raw, non-proxied objects in your
 * state graph.
 *
 * @param value - The object to be marked as "raw".
 * @see {@link https://vuejs.org/api/reactivity-advanced.html#markraw}
 */
export function markRaw<T extends object>(value: T): Raw<T> {
  if (Object.isExtensible(value)) {
    def(value, ReactiveFlags.SKIP, true)
  }
  return value
}
