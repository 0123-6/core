import { isArray, isIntegerKey, isMap, isSymbol } from '@vue/shared'
import { DirtyLevels, type TrackOpTypes, TriggerOpTypes } from './constants'
import { type Dep, createDep } from './dep'
import {
  activeEffect,
  pauseScheduling,
  resetScheduling,
  shouldTrack,
  trackEffect,
  triggerEffects,
} from './effect'

// The main WeakMap that stores {target -> key -> dep} connections.
// Conceptually, it's easier to think of a dependency as a Dep class
// which maintains a Set of subscribers, but we simply store them as
// raw Maps to reduce memory overhead.
type KeyToDepMap = Map<any, Dep>
// Vue3将依赖关系存储在这里，作为模块作用域的属性
// Vue2是每一个属性持有一个Dep对象，在属性内部的dep对象上保存着订阅观察者的信息。
const targetMap = new WeakMap<object, KeyToDepMap>()

export const ITERATE_KEY = Symbol('')
export const MAP_KEY_ITERATE_KEY = Symbol('')

/**
 * Tracks access to a reactive property.
 *
 * This will check which effect is running at the moment and record it as dep
 * which records all effects that depend on the reactive property.
 * 收集依赖，如果存在观察者，那么说明观察者依赖这个属性。
 *
 * @param target - 属性所在的对象
 * @param type - 访问属性的类型，get
 * @param key - 属性名称
 */
export function track(target: object, type: TrackOpTypes, key: unknown) {
  // 我从控制台改变的，此时shouldTrack为true，activeEffect为undefined
  // 说明此时不存在观察者，追踪结束。
  // 如果是Vue.computed(() => {})触发的，shouldTrack为true，
  // 且activeEffect为ComputedRefImpl实例的effect属性
  if (shouldTrack && activeEffect) {
    // 获取当前target对应的map
    let depsMap = targetMap.get(target)
    // 如果对应的map不存在，在targetMap放入target
    if (!depsMap) {
      targetMap.set(target, (depsMap = new Map()))
    }
    // 获取当前属性对应的map
    let dep = depsMap.get(key)
    // 如果当前属性对应的map不存在,则放入map中
    if (!dep) {
      depsMap.set(key, (dep = createDep(() => depsMap!.delete(key))))
    }
    // 追踪computedRefImpl.effect
    trackEffect(
      activeEffect,
      dep,
    )
  }
}

/**
 * Finds all deps associated with the target (or a specific property) and
 * triggers the effects stored within.
 * 触发依赖的该属性的观察者，执行它们的update方法
 *
 * @param target - The reactive object.
 * @param type - Defines the type of the operation that needs to trigger effects.
 * @param key - Can be used to target a specific reactive property in the target object.
 */
export function trigger(
  target: object,
  type: TriggerOpTypes,
  key?: unknown,
  newValue?: unknown,
) {
  // 获取target对应的map
  const depsMap = targetMap.get(target)
  if (!depsMap) {
    // never been tracked
    return
  }
  // 定义deps为[]
  let deps: (Dep | undefined)[] = []
  if (type === TriggerOpTypes.CLEAR) {
    // collection being cleared
    // trigger all effects for target
    deps = [...depsMap.values()]
  } else if (key === 'length' && isArray(target)) {
    const newLength = Number(newValue)
    depsMap.forEach((dep, key) => {
      if (key === 'length' || (!isSymbol(key) && key >= newLength)) {
        deps.push(dep)
      }
    })
  } else {
    // schedule runs for SET | ADD | DELETE
    if (key !== void 0) {
      // 将depsMap.get(key)得到的map添加到deps中
      deps.push(depsMap.get(key))
    }

    // also run for iteration key on ADD | DELETE | Map.SET
    switch (type) {
      case TriggerOpTypes.ADD:
        if (!isArray(target)) {
          deps.push(depsMap.get(ITERATE_KEY))
          if (isMap(target)) {
            deps.push(depsMap.get(MAP_KEY_ITERATE_KEY))
          }
        } else if (isIntegerKey(key)) {
          // new index added to array -> length changes
          deps.push(depsMap.get('length'))
        }
        break
      case TriggerOpTypes.DELETE:
        if (!isArray(target)) {
          deps.push(depsMap.get(ITERATE_KEY))
          if (isMap(target)) {
            deps.push(depsMap.get(MAP_KEY_ITERATE_KEY))
          }
        }
        break
      case TriggerOpTypes.SET:
        if (isMap(target)) {
          deps.push(depsMap.get(ITERATE_KEY))
        }
        break
    }
  }
  // 暂停处理程序
  pauseScheduling()
  for (const dep of deps) {
    if (dep) {
      // 触发依赖
      triggerEffects(
        dep,
        DirtyLevels.Dirty,
      )
    }
  }
  // 恢复处理程序
  resetScheduling()
}

export function getDepFromReactive(object: any, key: string | number | symbol) {
  const depsMap = targetMap.get(object)
  return depsMap && depsMap.get(key)
}
