import { isObject } from '@vue/shared'
import { ReactiveFlags } from './constants'
import { proxyHandler } from './proxyHandler'

// 定义全局reactive对象的缓存
export const reactiveMap = new WeakMap<object, any>()

// 返回一个对象的响应式代理
export function reactive(target: object): any {
  // 如果target不是对象类型，直接返回
  if (!isObject(target)) {
    return target
  }
  // 如果target已经是一个proxy，直接返回
  if (isProxy(target)) {
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
  return !!(value && value[ReactiveFlags.IS_REACTIVE])
}

// 判断一个参数是否是Proxy对象
export function isProxy(value: any): boolean {
  return value ? !!value[ReactiveFlags.RAW] : false
}

// 返回被Proxy代理的原始对象。绕过proxy，避免性能浪费。
export function toRaw<T>(observed: T): T {
  const raw = observed && observed[ReactiveFlags.RAW]
  return raw ? toRaw(raw) : observed
}
