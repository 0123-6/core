import {
  type Target,
  reactive,
  reactiveMap,
  toRaw,
} from './reactive'
import { ReactiveFlags, TrackOpTypes, TriggerOpTypes } from './constants'
import {
  pauseScheduling,
  pauseTracking,
  resetScheduling,
  resetTracking,
} from './effect'
import { track, trigger } from './reactiveEffect'
import {
  hasChanged,
  hasOwn,
  isArray,
  isIntegerKey,
  isObject,
  makeMap,
} from '@vue/shared'
import { isRef } from './ref'

// 定义一个函数，判断给定的参数是否在规定的字符串中，是否不需要追踪
const isNonTrackableKeys = makeMap(`__proto__,__v_isRef,__isVue`)

const arrayInstrumentations = /*#__PURE__*/ createArrayInstrumentations()

function createArrayInstrumentations() {
  const instrumentations: Record<string, Function> = {}
  // instrument identity-sensitive Array methods to account for possible reactive
  // values
  ;(['includes', 'indexOf', 'lastIndexOf'] as const).forEach(key => {
    instrumentations[key] = function (this: unknown[], ...args: unknown[]) {
      const arr = toRaw(this) as any
      for (let i = 0, l = this.length; i < l; i++) {
        track(arr, TrackOpTypes.GET, i + '')
      }
      // we run the method using the original args first (which may be reactive)
      const res = arr[key](...args)
      if (res === -1 || res === false) {
        // if that didn't work, run it again using raw values.
        return arr[key](...args.map(toRaw))
      } else {
        return res
      }
    }
  })
  // instrument length-altering mutation methods to avoid length being tracked
  // which leads to infinite loops in some cases (#2137)
  ;(['push', 'pop', 'shift', 'unshift', 'splice'] as const).forEach(key => {
    instrumentations[key] = function (this: unknown[], ...args: unknown[]) {
      pauseTracking()
      pauseScheduling()
      const res = (toRaw(this) as any)[key].apply(this, args)
      resetScheduling()
      resetTracking()
      return res
    }
  })
  return instrumentations
}

// handler拦截器对象
export const proxyHandler = {
  // get拦截器
  get(target: Target, key: string | symbol, receiver: object) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true
    } else {
      if (key === ReactiveFlags.RAW) {
        if (
          receiver ===
          (reactiveMap).get(target) ||
          // receiver is not the reactive proxy, but has the same prototype
          // this means the reciever is a user proxy of the reactive proxy
          Object.getPrototypeOf(target) === Object.getPrototypeOf(receiver)
        ) {
          return target
        }
        // early return undefined
        return
      }
    }

    // 判断target是否为数组,data()最外层为对象，所以不是数组
    const targetIsArray = isArray(target)

    // 特殊情况处理
    if (targetIsArray && hasOwn(arrayInstrumentations, key)) {
      return Reflect.get(arrayInstrumentations, key, receiver)
    }

    // 使用Reflect.get获取值
    const res = Reflect.get(target, key, receiver)

    if (isNonTrackableKeys(key)) {
      return res
    }

    // 追踪这个属性
    track(target, TrackOpTypes.GET, key)

    if (isRef(res)) {
      // ref unwrapping - skip unwrap for Array + integer key.
      return targetIsArray && isIntegerKey(key) ? res : res.value
    }

    if (isObject(res)) {
      // Convert returned value into a proxy as well. we do the isObject check
      // here to avoid invalid value warning. Also need to lazy access readonly
      // and reactive here to avoid circular dependency.
      return reactive(res)
    }

    // 返回获得的值
    return res
  },

  // set拦截器
  set(
    target: object,
    key: string | symbol,
    value: unknown,
    receiver: object,
  ): boolean {
    let oldValue = (target as any)[key]
    // oldValue是否为只读
    const isOldValueReadonly = false
    oldValue = toRaw(oldValue)
    value = toRaw(value)
    if (!isArray(target) && isRef(oldValue) && !isRef(value)) {
      if (isOldValueReadonly) {
        return false
      } else {
        oldValue.value = value
        return true
      }
    }

    // 判断target是否存在key
    const hadKey =
      isArray(target) && isIntegerKey(key)
        ? Number(key) < target.length
        : hasOwn(target, key)
    // 重点，设置target[key]
    // 修改vm本身完成,接下来需要更新DOM
    const result = Reflect.set(target, key, value, receiver)
    // don't trigger if target is something up in the prototype chain of original
    if (target === toRaw(receiver)) {
      // 如果key不存在，触发添加属性逻辑
      if (!hadKey) {
        trigger(target, TriggerOpTypes.ADD, key, value)
      } else if (hasChanged(value, oldValue)) {
        // 如果值存在，且被修改了，触发修改方法
        trigger(target, TriggerOpTypes.SET, key, value)
      }
    }
    return result
  },
}
