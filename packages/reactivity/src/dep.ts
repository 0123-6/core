import type { ReactiveEffect } from './effect'

export type Dep = Map<ReactiveEffect, number> & {
  cleanup: () => void
  computed?: any
}

export const createDep = (
  cleanup: () => void,
  computed?: any,
): Dep => {
  const dep = new Map() as Dep
  dep.cleanup = cleanup
  dep.computed = computed
  return dep
}
