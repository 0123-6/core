import type { ReactiveEffect } from './effect'

export type Dep = Map<ReactiveEffect, number> & {
  cleanup: () => void
  computed?: any
}

/**
 * 创建一个新的 Dep 对象
 * @param cleanup 清理函数，用于在依赖被清除时执行
 * @param computed 可选的 computed 属性
 */
export const createDep = (
  cleanup: () => void,
  computed?: any,
): Dep => {
  // 创建一个新的 Map 对象，并断言其类型为 Dep
  const dep = new Map() as Dep
  // 添加 cleanup 方法
  dep.cleanup = cleanup
  // 如果提供了 computed 参数，则添加到 dep 对象中
  dep.computed = computed
  // 返回创建的 Dep 对象
  return dep
}
