// 请详细学习每一个API

// 内部API
export {
  effect,
  stop,
  enableTracking,
  pauseTracking,
  resetTracking,
  pauseScheduling,
  resetScheduling,
  ReactiveEffect,
  type ReactiveEffectRunner,
  type EffectScheduler,
} from './effect'
// 内部API
export { trigger, track, ITERATE_KEY } from './reactiveEffect'
// 内部API
export { TrackOpTypes, TriggerOpTypes, ReactiveFlags } from './constants'


// 响应式核心
export {
  reactive,// 核心API
  isReactive,// 工具API
  isProxy,// 工具API
  toRaw,// 进阶API
} from './reactive'

// 响应式核心
export {
  ref,// 核心API
  isRef,// 工具API
  toRef,// 工具API
  toValue,// 工具API
  toRefs,// 工具API
  unref,// 工具API
  proxyRefs,// runtime-core/component.ts用到了
  customRef,// 进阶API
  type Ref,
  type MaybeRef,
  type MaybeRefOrGetter,
  type ToRef,
  type ToRefs,
  type UnwrapRef,
  type ShallowUnwrapRef,
  type RefUnwrapBailTypes,
  type CustomRefFactory,
} from './ref'

// 响应式核心
export {
  computed,// 核心API
  type ComputedRefImpl,
} from './computed'

// 响应式进阶
export {
  effectScope,// 进阶API
  getCurrentScope,// 进阶API
  onScopeDispose,// 进阶API
} from './effectScope'

