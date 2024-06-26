import {
  activeEffect,
  shouldTrack,
  trackEffect,
  triggerEffects,
} from './effect'
import { DirtyLevels } from './constants'
import {
  hasChanged,
} from '@vue/shared'
import {
  isReactive, reactive,
  toRaw
} from './reactive'
import { type Dep, createDep } from './dep'
import { ComputedRefImpl } from './computed'

export interface Ref {
  value: any
}

type RefBase<T> = {
  dep?: Dep
  value: T
}

/**
 * 追踪该依赖，如果此时有观察者，将观察者的依赖数组添加当前ref对象。
 * ref + 计算属性专用
 * @param ref 正在被读取的RefImpl对象。
 */
export function trackRefValue(ref: RefBase<any>) {
  // 如果应该被追踪和此时存在观察者
  if (shouldTrack && activeEffect) {
    ref = toRaw(ref)
    trackEffect(
      activeEffect,
      (ref.dep ??= createDep(
        () => (ref.dep = undefined),
        ref instanceof ComputedRefImpl ? ref : undefined,
      )),
    )
  }
}

/**
 * 触发ref的所有订阅者,ref + 计算属性专用
 * @param ref
 * @param dirtyLevel
 */
export function triggerRefValue(
  ref: RefBase<any>,
  dirtyLevel: DirtyLevels = DirtyLevels.Dirty,
) {
  // 获取ref的原始值,原始值存放在__v_raw属性上
  ref = toRaw(ref)
  if (ref.dep) {
    // 触发更新
    triggerEffects(
      ref.dep,
      dirtyLevel,
    )
  }
}

// 判断传入的参数是否为ref对象
export function isRef(r: any): r is Ref {
  return !!(r && r.__v_isRef === true)
}

// ref是一个工厂函数，参数为原始值，返回一个RefImpl实例
export function ref(rawValue?: unknown) {
  // 如果传入的参数已经是ref对象，直接返回
  if (isRef(rawValue)) {
    return rawValue
  }
  // new一个RefImpl对象并返回
  return new RefImpl(rawValue)
}

/**
 * Ref类的定义
 */
class RefImpl {
  // 私有属性_value
  private _value: any
  // 私有属性_rawValue
  private _rawValue: any

  // 该ref对象作为一个依赖，dep保存着订阅该依赖的观察者数组
  public dep?: Dep = undefined
  // 标识符，表明是ref对象
  public readonly __v_isRef = true

  // 构造函数
  constructor(
    value: any,
  ) {
    // 如果是浅层的话，啥也不做，呜呜呜
    // 获取参数的原始值
    this._rawValue = toRaw(value)
    // 将传入的参数响应式化
    this._value = reactive(value)
  }

  // value并不是实际的属性，而是一对getter,setter
  get value() {
    // 追踪
    // count.value,this为count，也就是RefImpl的实例对象
    trackRefValue(this)
    // 返回真正的value值
    return this._value
  }

  set value(newVal) {
    // 获取参数的原始值
    newVal = toRaw(newVal)
    // 如果新值和旧值不一样
    if (hasChanged(newVal, this._rawValue)) {
      // 重新设置_rawValue和_value
      this._rawValue = newVal
      this._value = reactive(newVal)
      // 触发所有订阅了此ref的观察者对象
      triggerRefValue(this, DirtyLevels.Dirty)
    }
  }
}

const shallowUnwrapHandlers: ProxyHandler<any> = {
  get: (target, key, receiver) => {
    const ref = Reflect.get(target, key, receiver)
    return isRef(ref) ? ref.value : ref
  },
  set: (target, key, value, receiver) => {
    const oldValue = target[key]
    if (isRef(oldValue) && !isRef(value)) {
      oldValue.value = value
      return true
    } else {
      return Reflect.set(target, key, value, receiver)
    }
  },
}

/**
 * Returns a reactive proxy for the given object.
 *
 * If the object already is reactive, it's returned as-is. If not, a new
 * reactive proxy is created. Direct child properties that are refs are properly
 * handled, as well.
 * 组件专用
 *
 * @param objectWithRefs - Either an already-reactive object or a simple object
 * that contains refs.
 */
export function proxyRefs<T extends object>(
  objectWithRefs: T,
): any {
  return isReactive(objectWithRefs)
    ? objectWithRefs
    : new Proxy(objectWithRefs, shallowUnwrapHandlers)
}

type CustomRefFactory<T> = (
  track: () => void,
  trigger: () => void,
) => {
  get: () => T
  set: (value: T) => void
}

/**
 * 自定义ref实现
 */
class CustomRefImpl<T> {
  public dep?: Dep = undefined

  private readonly _get: ReturnType<CustomRefFactory<T>>['get']
  private readonly _set: ReturnType<CustomRefFactory<T>>['set']

  public readonly __v_isRef = true

  constructor(factory: CustomRefFactory<T>) {
    const { get, set } = factory(
      () => trackRefValue(this),
      () => triggerRefValue(this),
    )
    this._get = get
    this._set = set
  }

  get value() {
    return this._get()
  }

  set value(newVal) {
    this._set(newVal)
  }
}

/**
 * Creates a customized ref with explicit control over its dependency tracking
 * and updates triggering.
 *
 * @param factory - The function that receives the `track` and `trigger` callbacks.
 * @see {@link https://vuejs.org/api/reactivity-advanced.html#customref}
 */
export function customRef<T>(factory: CustomRefFactory<T>): Ref {
  return new CustomRefImpl(factory) as any
}
