// Core API ------------------------------------------------------------------

export const version = __VERSION__
export {
  // core
  reactive,
  ref,
  readonly,
  // utilities
  unref,
  proxyRefs,
  isRef,
  toRef,
  toValue,
  toRefs,
  isProxy,
  isReactive,
  isReadonly,
  isShallow,
  // advanced
  customRef,
  triggerRef,
  shallowRef,
  shallowReactive,
  shallowReadonly,
  markRaw,
  toRaw,
  // effect
  effect,
  stop,
  ReactiveEffect,
  // effect scope
  effectScope,
  EffectScope,
  getCurrentScope,
  onScopeDispose,
} from '@vue/reactivity'
export { computed } from './apiComputed'
export {
  watch,
  watchEffect,
  watchPostEffect,
  watchSyncEffect,
} from './apiWatch'
export {
  onBeforeMount,
  onMounted,
  onBeforeUpdate,
  onUpdated,
  onBeforeUnmount,
  onUnmounted,
  onActivated,
  onDeactivated,
  onRenderTracked,
  onRenderTriggered,
  onErrorCaptured,
  onServerPrefetch,
} from './apiLifecycle'
export { provide, inject, hasInjectionContext } from './apiInject'
export { nextTick } from './scheduler'
export { defineComponent } from './apiDefineComponent'
export { defineAsyncComponent } from './apiAsyncComponent'
export { useAttrs, useSlots } from './apiSetupHelpers'
export { useModel } from './helpers/useModel'

// <script setup> API ----------------------------------------------------------

export {
  // macros runtime, for typing and warnings only
  defineProps,
  defineEmits,
  defineExpose,
  defineOptions,
  defineSlots,
  defineModel,
  withDefaults,
  type DefineProps,
  type ModelRef,
} from './apiSetupHelpers'

/**
 * @internal
 */
export {
  mergeDefaults,
  mergeModels,
  createPropsRestProxy,
  withAsyncContext,
} from './apiSetupHelpers'

// Advanced API ----------------------------------------------------------------

// For getting a hold of the internal instance in setup() - useful for advanced
// plugins
export { getCurrentInstance } from './component'

// For raw render function users
export { h } from './h'
// Advanced render function utilities
export { createVNode, cloneVNode, mergeProps, isVNode } from './vnode'
// VNode types
export { Fragment, Text, Comment, Static, type VNodeRef } from './vnode'
// Built-in components
export { KeepAlive, type KeepAliveProps } from './components/KeepAlive'
// For using custom directives
export { withDirectives } from './directives'

// Custom Renderer API ---------------------------------------------------------

export { createRenderer } from './renderer'
export { queuePostFlushCb } from './scheduler'
import { warn as _warn } from './warning'
export const warn = (__DEV__ ? _warn : NOOP) as typeof _warn

/** @internal */
export { assertNumber } from './warning'
export {
  handleError,
  callWithErrorHandling,
  callWithAsyncErrorHandling,
  ErrorCodes,
} from './errorHandling'
export {
  resolveComponent,
  resolveDirective,
  resolveDynamicComponent,
} from './helpers/resolveAssets'
// For integration with runtime compiler
export { registerRuntimeCompiler, isRuntimeOnly } from './component'

import { ErrorTypeStrings as _ErrorTypeStrings } from './errorHandling'
/**
 * Runtime error messages. Only exposed in dev or esm builds.
 * @internal
 */
export const ErrorTypeStrings = (
  __ESM_BUNDLER__ || __CJS__ || __DEV__ ? _ErrorTypeStrings : null
) as typeof _ErrorTypeStrings

// Types -----------------------------------------------------------------------

import type { VNode } from './vnode'
import type { ComponentInternalInstance } from './component'

// Augment Ref unwrap bail types.
declare module '@vue/reactivity' {
  export interface RefUnwrapBailTypes {
    runtimeCoreBailTypes:
      | VNode
      | {
          // directly bailing on ComponentPublicInstance results in recursion
          // so we use this as a bail hint
          $: ComponentInternalInstance
        }
  }
}

export { TrackOpTypes, TriggerOpTypes } from '@vue/reactivity'
export type {
  Ref,
  MaybeRef,
  MaybeRefOrGetter,
  ToRef,
  ToRefs,
  UnwrapRef,
  ShallowRef,
  ShallowUnwrapRef,
  CustomRefFactory,
  ReactiveFlags,
  DeepReadonly,
  ShallowReactive,
  UnwrapNestedRefs,
  ComputedRef,
  WritableComputedRef,
  WritableComputedOptions,
  ComputedGetter,
  ComputedSetter,
  ReactiveEffectRunner,
  ReactiveEffectOptions,
  EffectScheduler,
  DebuggerOptions,
  DebuggerEvent,
  DebuggerEventExtraInfo,
  Raw,
} from '@vue/reactivity'
export type {
  WatchEffect,
  WatchOptions,
  WatchOptionsBase,
  WatchCallback,
  WatchSource,
  WatchStopHandle,
} from './apiWatch'
export type { InjectionKey } from './apiInject'
export type {
  App,
  AppConfig,
  AppContext,
  Plugin,
  ObjectPlugin,
  FunctionPlugin,
  CreateAppFunction,
  OptionMergeFunction,
} from './apiCreateApp'
export type {
  VNode,
  VNodeChild,
  VNodeTypes,
  VNodeProps,
  VNodeArrayChildren,
  VNodeNormalizedChildren,
} from './vnode'
export type {
  Component,
  ConcreteComponent,
  FunctionalComponent,
  ComponentInternalInstance,
  SetupContext,
  ComponentCustomProps,
  AllowedComponentProps,
  ComponentInstance,
} from './component'
export type {
  DefineComponent,
  DefineSetupFnComponent,
  PublicProps,
} from './apiDefineComponent'
export type {
  ComponentOptions,
  ComponentOptionsMixin,
  ComponentOptionsWithoutProps,
  ComponentOptionsWithObjectProps,
  ComponentOptionsWithArrayProps,
  ComponentCustomOptions,
  ComponentOptionsBase,
  ComponentProvideOptions,
  RenderFunction,
  MethodOptions,
  ComputedOptions,
  RuntimeCompilerOptions,
  ComponentInjectOptions,
} from './componentOptions'
export type { EmitsOptions, ObjectEmitsOptions } from './componentEmits'
export type {
  ComponentPublicInstance,
  ComponentCustomProperties,
  CreateComponentPublicInstance,
} from './componentPublicInstance'
export type {
  Renderer,
  RendererNode,
  RendererElement,
  RendererOptions,
  RootRenderFunction,
} from './renderer'
export type { Slot, Slots, SlotsType } from './componentSlots'
export type {
  Prop,
  PropType,
  ComponentPropsOptions,
  ComponentObjectPropsOptions,
  ExtractPropTypes,
  ExtractPublicPropTypes,
  ExtractDefaultPropTypes,
} from './componentProps'
export type {
  Directive,
  DirectiveBinding,
  DirectiveHook,
  ObjectDirective,
  FunctionDirective,
  DirectiveArguments,
} from './directives'
export type {
  AsyncComponentOptions,
  AsyncComponentLoader,
} from './apiAsyncComponent'

// Internal API ----------------------------------------------------------------

// **IMPORTANT** Internal APIs may change without notice between versions and
// user code should avoid relying on them.

// For compiler generated code
// should sync with '@vue/compiler-core/src/runtimeHelpers.ts'
export {
  withCtx,
  pushScopeId,
  popScopeId,
  withScopeId,
} from './componentRenderContext'
export { renderList } from './helpers/renderList'
export { toHandlers } from './helpers/toHandlers'
export { renderSlot } from './helpers/renderSlot'
export { createSlots } from './helpers/createSlots'
export { withMemo, isMemoSame } from './helpers/withMemo'
export {
  openBlock,
  createBlock,
  setBlockTracking,
  createTextVNode,
  createCommentVNode,
  createStaticVNode,
  createElementVNode,
  createElementBlock,
  guardReactiveProps,
} from './vnode'
export {
  toDisplayString,
  camelize,
  capitalize,
  toHandlerKey,
  normalizeProps,
  normalizeClass,
  normalizeStyle,
} from '@vue/shared'

// For test-utils
export { transformVNodeArgs } from './vnode'

// 2.x COMPAT ------------------------------------------------------------------

import { DeprecationTypes as _DeprecationTypes } from './compat/compatConfig'

import { warnDeprecation } from './compat/compatConfig'
import {
  checkCompatEnabled,
  isCompatEnabled,
  softAssertCompatEnabled,
} from './compat/compatConfig'
import { resolveFilter as _resolveFilter } from './helpers/resolveAssets'
import { NOOP } from '@vue/shared'

/**
 * @internal only exposed in compat builds
 */
export const resolveFilter = null

const _compatUtils = {
  warnDeprecation,
  isCompatEnabled,
  checkCompatEnabled,
  softAssertCompatEnabled,
}

/**
 * @internal only exposed in compat builds.
 */
export const compatUtils = (
  null
) as typeof _compatUtils

export const DeprecationTypes = (
  null
) as typeof _DeprecationTypes
