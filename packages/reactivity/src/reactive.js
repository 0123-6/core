/**
 * 这是Vue3响应式系统的核心，
 * 1. 需要实现1个reactive()函数，将传入的对象转换为响应式对象
 * 2. 实现3个工具函数，
 * 2.1 isReactive()判断参数是否为响应式对象 完成
 * 2.2 isProxy()判断是否已proxy
 * 2.3 toRaw()获取proxy对象的原始参数
 */
import { ReactiveFlags } from './constants'
import { proxyHandler } from './proxyHandler'

// 定义一个全局变量，存储者全局所有的响应式对象
// key为sourceObj，值为相应化得到的proxy对象
export const reactiveMap = new WeakMap()

// 1. 实现reactive()函数，返回一个对象的响应式代理
export function reactive(sourceObj) {
  // 如果参数不是对象类型，直接返回
  if (typeof sourceObj !== 'object' || sourceObj === null) {
    console.log('sourceObj不是对象类型，响应化失败')
    return sourceObj
  }
  // 如果sourceObj已经是响应式对象，直接返回
  if (isProxy(sourceObj)) {
    console.log('sourceObj已经是响应式对象了，无需再次执行reactive响应化函数')
    return sourceObj
  }
  // 如果已经存在这个对象的缓存，返回对应缓存
  if (reactiveMap.has(sourceObj)) {
    return reactiveMap.get(sourceObj)
  }
  
  // 定义新的proxy对象
  const proxy = new Proxy(sourceObj, proxyHandler)
  // 将source放入全局缓存中
  reactiveMap.set(sourceObj, proxy)
  
  // 返回创建的响应式对象
  return proxy
}

// 2.1 实现isReactive()函数，判断指定参数是否为响应式对象
export function isReactive(value) {
  return !!(value && value[ReactiveFlags.IS_REACTIVE])
}

// 2.2 实现isProxy()函数,参数是否是Proxy对象
export function isProxy(value) {
  return !!(value && value[ReactiveFlags.RAW])
}

// 2.3 实现toRaw()函数
// 返回被Proxy代理的原始对象。绕过proxy，避免性能浪费。
export function toRaw(proxyObj) {
  let raw = proxyObj
  while (raw && raw[ReactiveFlags.RAW]) {
    raw = raw[ReactiveFlags.RAW]
  }
  return raw
}
