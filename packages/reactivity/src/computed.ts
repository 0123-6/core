import { ReactiveEffect } from './effect'
import { trackRefValue, triggerRefValue } from './ref'
import { NOOP, hasChanged, isFunction } from '@vue/shared'
import { toRaw } from './reactive'
import { DirtyLevels } from './constants'

export const COMPUTED_SIDE_EFFECT_WARN =
  `Computed is still dirty after getter evaluation,` +
  ` likely because a computed is mutating its own dependency in its getter.` +
  ` State mutations in computed getters should be avoided. ` +
  ` Check the docs for more details: https://vuejs.org/guide/essentials/computed.html#getters-should-be-side-effect-free`

export class ComputedRefImpl {
  public dep = undefined

  private _value = undefined
  public readonly effect: ReactiveEffect

  public readonly __v_isRef = true

  public _cacheable: boolean
  private _setter: any

  constructor(getter:any, _setter:any) {
    this._setter = _setter
    this.effect = new ReactiveEffect(
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

  get value() {
    // the computed ref may get wrapped by other proxies e.g. readonly() #3376
    const self = toRaw(this)
    if (
      (!self._cacheable || self.effect.dirty) &&
      hasChanged(self._value, (self._value = self.effect.run()!))
    ) {
      triggerRefValue(self, DirtyLevels.Dirty)
    }
    trackRefValue(self)
    if (self.effect._dirtyLevel >= DirtyLevels.MaybeDirty_ComputedSideEffect) {
      triggerRefValue(self, DirtyLevels.MaybeDirty_ComputedSideEffect)
    }
    return self._value
  }

  set value(newValue) {
    this._setter(newValue)
  }
}

export function computed(getterOrOptions: any) {
  let getter
  let setter

  const onlyGetter = isFunction(getterOrOptions)
  if (onlyGetter) {
    getter = getterOrOptions
    setter = NOOP
  } else {
    getter = getterOrOptions.get
    setter = getterOrOptions.set
  }

  return new ComputedRefImpl(getter, setter) as any
}
