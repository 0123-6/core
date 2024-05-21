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
  proxyRefs,// runtime-core/component.ts用到了
  customRef,// 进阶API
  type Ref,
} from './ref'

// 响应式核心
export {
  computed,// 核心API
} from './computed'

// 响应式进阶
export {
  effectScope,// 进阶API
  getCurrentScope,// 进阶API
  onScopeDispose,// 进阶API
} from './effectScope'

