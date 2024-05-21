import { NOOP } from '@vue/shared'
import type { ComputedRefImpl } from './computed'
import {
  DirtyLevels,
  type TrackOpTypes,
  type TriggerOpTypes,
} from './constants'
import type { Dep } from './dep'
import { recordEffectScope } from './effectScope'

export type EffectScheduler = (...args: any[]) => any

export type DebuggerEventExtraInfo = {
  target: object
  type: TrackOpTypes | TriggerOpTypes
  key: any
  newValue?: any
  oldValue?: any
  oldTarget?: Map<any, any> | Set<any>
}

export let activeEffect: ReactiveEffect | undefined

/**
 * 响应式效果类
 */
export class ReactiveEffect<T = any> {
  active = true
  deps: Dep[] = []

  /**
   * Can be attached after creation
   * @internal
   */
  computed?: ComputedRefImpl
  /**
   * @internal
   */
  allowRecurse?: boolean

  onStop?: () => void

  /**
   * @internal
   */
  _dirtyLevel = DirtyLevels.Dirty
  /**
   * @internal
   */
  _trackId = 0
  /**
   * @internal
   */
  _runnings = 0
  /**
   * @internal
   */
  _shouldSchedule = false
  /**
   * @internal
   */
  _depsLength = 0

  constructor(
    public fn: () => T,
    public trigger: () => void,
    public scheduler?: EffectScheduler,
    scope?: any,
  ) {
    recordEffectScope(this, scope)
  }

  // 读取dirty属性
  public get dirty() {
    // 如果当前响应式效果的脏等级为可能脏
    if (
      this._dirtyLevel === DirtyLevels.MaybeDirty_ComputedSideEffect ||
      this._dirtyLevel === DirtyLevels.MaybeDirty
    ) {
      this._dirtyLevel = DirtyLevels.QueryingDirty
      pauseTracking()
      for (let i = 0; i < this._depsLength; i++) {
        const dep = this.deps[i]
        if (dep.computed) {
          triggerComputed(dep.computed)
          if (this._dirtyLevel >= DirtyLevels.Dirty) {
            break
          }
        }
      }
      if (this._dirtyLevel === DirtyLevels.QueryingDirty) {
        this._dirtyLevel = DirtyLevels.NotDirty
      }
      resetTracking()
    }
    // 返回当前响应式效果的脏等级是否在于一定脏对应的脏等级
    return this._dirtyLevel >= DirtyLevels.Dirty
  }

  public set dirty(v) {
    this._dirtyLevel = v ? DirtyLevels.Dirty : DirtyLevels.NotDirty
  }

  // 运行
  run() {
    // 将当前响应式效果的脏等级修改为不脏
    this._dirtyLevel = DirtyLevels.NotDirty
    // 如果当前响应式效果对象不是活跃状态,直接调用和返回this.fn()
    if (!this.active) {
      return this.fn()
    }
    // 缓存shouldTrack
    let lastShouldTrack = shouldTrack
    // 缓存activeEffect
    let lastEffect = activeEffect
    try {
      // 设置应该追踪标识符为true
      shouldTrack = true
      // 设置活跃的响应式效果对象为当前对象
      activeEffect = this
      // ???
      this._runnings++
      // ???
      preCleanupEffect(this)
      // 真正调用的函数
      return this.fn()
    } finally {
      postCleanupEffect(this)
      this._runnings--
      activeEffect = lastEffect
      shouldTrack = lastShouldTrack
    }
  }

  stop() {
    if (this.active) {
      preCleanupEffect(this)
      postCleanupEffect(this)
      this.onStop && this.onStop()
      this.active = false
    }
  }
}

function triggerComputed(computed: ComputedRefImpl) {
  return computed.value
}

// ???
function preCleanupEffect(effect: ReactiveEffect) {
  // 追踪id += 1
  effect._trackId++
  // 对应的依赖的长度为0
  effect._depsLength = 0
}

function postCleanupEffect(effect: ReactiveEffect) {
  if (effect.deps.length > effect._depsLength) {
    for (let i = effect._depsLength; i < effect.deps.length; i++) {
      cleanupDepEffect(effect.deps[i], effect)
    }
    effect.deps.length = effect._depsLength
  }
}

function cleanupDepEffect(dep: Dep, effect: ReactiveEffect) {
  const trackId = dep.get(effect)
  if (trackId !== undefined && effect._trackId !== trackId) {
    dep.delete(effect)
    if (dep.size === 0) {
      dep.cleanup()
    }
  }
}

export interface ReactiveEffectRunner<T = any> {
  (): T
  effect: ReactiveEffect
}

/**
 * Registers the given function to track reactive updates.
 *
 * The given function will be run once immediately. Every time any reactive
 * property that's accessed within it gets updated, the function will run again.
 *
 * @param fn - The function that will track reactive updates.
 * @returns A runner that can be used to control the effect after creation.
 */
export function effect<T = any>(
  fn: () => T,
): ReactiveEffectRunner {
  fn = (fn as ReactiveEffectRunner).effect.fn

  const _effect = new ReactiveEffect(fn, NOOP, () => {
    if (_effect.dirty) {
      _effect.run()
    }
  })

  _effect.run()
  const runner = _effect.run.bind(_effect) as ReactiveEffectRunner
  runner.effect = _effect
  return runner
}

/**
 * Stops the effect associated with the given runner.
 *
 * @param runner - Association with the effect to stop tracking.
 */
export function stop(runner: ReactiveEffectRunner) {
  runner.effect.stop()
}

// 标识符，是否应该追踪依赖
export let shouldTrack = true
export let pauseScheduleStack = 0

const trackStack: boolean[] = []

/**
 * Temporarily pauses tracking.
 */
export function pauseTracking() {
  trackStack.push(shouldTrack)
  shouldTrack = false
}

/**
 * Re-enables effect tracking (if it was paused).
 */
export function enableTracking() {
  trackStack.push(shouldTrack)
  shouldTrack = true
}

/**
 * Resets the previous global effect tracking state.
 */
export function resetTracking() {
  const last = trackStack.pop()
  shouldTrack = last === undefined ? true : last
}

export function pauseScheduling() {
  pauseScheduleStack++
}

/**
 * 恢复处理程序
 */
export function resetScheduling() {
  pauseScheduleStack--
  // 从queueEffectSchedulers取出1个并执行
  while (!pauseScheduleStack && queueEffectSchedulers.length) {
    queueEffectSchedulers.shift()!()
  }
}

/**
 * 追踪computedRefImpl.effect，一个响应式效果对象
 * @param effect 一个响应式效果对象
 * @param dep 该响应式效果对应的map，记录所有的依赖
 */
export function trackEffect(
  effect: ReactiveEffect,
  dep: Dep,
) {
  if (dep.get(effect) !== effect._trackId) {
    dep.set(effect, effect._trackId)
    const oldDep = effect.deps[effect._depsLength]
    if (oldDep !== dep) {
      if (oldDep) {
        cleanupDepEffect(oldDep, effect)
      }
      effect.deps[effect._depsLength++] = dep
    } else {
      effect._depsLength++
    }
  }
}

// 全局待处理队列
const queueEffectSchedulers: EffectScheduler[] = []

/**
 * 触发更新
 * @param dep
 * @param dirtyLevel
 */
export function triggerEffects(
  dep: Dep,
  dirtyLevel: DirtyLevels,
) {
  pauseScheduling()
  for (const effect of dep.keys()) {
    // dep.get(effect) is very expensive, we need to calculate it lazily and reuse the result
    let tracking: boolean | undefined
    if (
      effect._dirtyLevel < dirtyLevel &&
      (tracking ??= dep.get(effect) === effect._trackId)
    ) {
      effect._shouldSchedule ||= effect._dirtyLevel === DirtyLevels.NotDirty
      effect._dirtyLevel = dirtyLevel
    }
    if (
      effect._shouldSchedule &&
      (tracking ??= dep.get(effect) === effect._trackId)
    ) {
      // 触发更新
      effect.trigger()
      if (
        (!effect._runnings || effect.allowRecurse) &&
        effect._dirtyLevel !== DirtyLevels.MaybeDirty_ComputedSideEffect
      ) {
        effect._shouldSchedule = false
        if (effect.scheduler) {
          // 将处理程序放入待处理队列中
          queueEffectSchedulers.push(effect.scheduler)
        }
      }
    }
  }
  resetScheduling()
}
