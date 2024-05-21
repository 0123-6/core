// 导入部分
import { ReactiveEffect } from './effect'
import { trackRefValue, triggerRefValue } from './ref'
import { NOOP, hasChanged, isFunction } from '@vue/shared'
import { DirtyLevels } from './constants'

// 计算属性不应改变它的依赖值，否则可能异常
export const COMPUTED_SIDE_EFFECT_WARN =
  `Computed is still dirty after getter evaluation,` +
  ` likely because a computed is mutating its own dependency in its getter.` +
  ` State mutations in computed getters should be avoided. ` +
  ` Check the docs for more details: https://vuejs.org/guide/essentials/computed.html#getters-should-be-side-effect-free`

/**
 * 计算ref实现类
 */
export class ComputedRefImpl {
  // 依赖
  public dep = undefined

  private _value = undefined
  public readonly effect: ReactiveEffect

  // 标志是一个ref对象
  public readonly __v_isRef = true

  public _cacheable: boolean
  private _setter: any

  // 构造函数
  constructor(getter:any, _setter:any) {
    // 设置this._setter
    this._setter = _setter
    // ???这是个啥
    // 观察属性ref实例的effect属性是一个响应式效果对象
    this.effect = new ReactiveEffect(
      // 调用getter函数，参数为oldValue
      () => getter(this._value),
      () =>
        triggerRefValue(
          this,
          this.effect._dirtyLevel === DirtyLevels.MaybeDirty_ComputedSideEffect
            ? DirtyLevels.MaybeDirty_ComputedSideEffect
            : DirtyLevels.MaybeDirty,
        ),
    )
    this.effect.computed = this
    this.effect.active = this._cacheable = true
  }

  // value的getter
  get value() {
    if (
      // 如果没有缓存或者是脏的数据
      (!this._cacheable || this.effect.dirty) &&
      hasChanged(this._value, (this._value = this.effect.run()!))
    ) {
      triggerRefValue(this, DirtyLevels.Dirty)
    }
    trackRefValue(this)
    if (this.effect._dirtyLevel >= DirtyLevels.MaybeDirty_ComputedSideEffect) {
      triggerRefValue(this, DirtyLevels.MaybeDirty_ComputedSideEffect)
    }
    return this._value
  }

  // value的setter
  set value(newValue) {
    this._setter(newValue)
  }
}

// 计算属性的工厂函数
export function computed(getterOrOptions: any) {
  // 定义getter
  let getter
  // 定义setter
  let setter

  // 如果参数是一个函数，说明只有getter
  const onlyGetter = isFunction(getterOrOptions)
  // 设置getter，setter
  if (onlyGetter) {
    getter = getterOrOptions
    setter = NOOP
  } else {
    getter = getterOrOptions.get
    setter = getterOrOptions.set
  }

  // 创建一个计算ref实现类的实例，并返回
  return new ComputedRefImpl(getter, setter) as any
}
