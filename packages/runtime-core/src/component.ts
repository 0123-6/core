import {type VNode, type VNodeChild} from './vnode'
import {
  effectScope,
  isRef,
  pauseTracking,
  proxyRefs,
  type ReactiveEffect,
  resetTracking,
  track,
  TrackOpTypes
} from '@vue/reactivity'
import {
  type ComponentPublicInstance,
  type ComponentPublicInstanceConstructor,
  createDevRenderContext,
  PublicInstanceProxyHandlers,
  publicPropertiesMap,
  RuntimeCompiledPublicInstanceProxyHandlers,
} from './componentPublicInstance'
import {
  type ComponentPropsOptions,
  initProps,
  type NormalizedPropsOptions,
  normalizePropsOptions,
} from './componentProps'
import {initSlots, type InternalSlots, type Slots, type SlotsType, type UnwrapSlotsType,} from './componentSlots'
import {warn} from './warning'
import {callWithErrorHandling, ErrorCodes} from './errorHandling'
import {type AppConfig, type AppContext, createAppContext,} from './apiCreateApp'
import {type Directive} from './directives'
import {
  type ComponentOptions,
  type ComputedOptions,
  type MergedComponentOptions,
  type MethodOptions,
  resolveMergedOptions,
} from './componentOptions'
import {
  emit,
  type EmitFn,
  type EmitsOptions,
  type EmitsToProps,
  normalizeEmitsOptions,
  type ObjectEmitsOptions,
  type ShortEmitsToObject,
} from './componentEmits'
import {
  EMPTY_OBJ,
  extend,
  type IfAny,
  isArray,
  isFunction,
  isObject,
  isPromise,
  makeMap,
  NOOP,
  ShapeFlags,
} from '@vue/shared'
import type {CompilerOptions} from '@vue/compiler-core'
import {markAttrsAccessed} from './componentRenderUtils'
import {currentRenderingInstance} from './componentRenderContext'
import {endMeasure, startMeasure} from './profiling'
import {type CompatConfig, globalCompatConfig} from './compat/compatConfig'
import type {SchedulerJob} from './scheduler'
import type {LifecycleHooks} from './enums'

export type Data = Record<string, unknown>

/**
 * Public utility type for extracting the instance type of a component.
 * Works with all valid component definition types. This is intended to replace
 * the usage of `InstanceType<typeof Comp>` which only works for
 * constructor-based component definition types.
 *
 * Exmaple:
 * ```ts
 * const MyComp = { ... }
 * declare const instance: ComponentInstance<typeof MyComp>
 * ```
 */
export type ComponentInstance<T> = T extends { new (): ComponentPublicInstance }
  ? InstanceType<T>
  : T extends FunctionalComponent<infer Props, infer Emits>
    ? ComponentPublicInstance<Props, {}, {}, {}, {}, ShortEmitsToObject<Emits>>
    : T extends Component<
          infer Props,
          infer RawBindings,
          infer D,
          infer C,
          infer M
        >
      ? // NOTE we override Props/RawBindings/D to make sure is not `unknown`
        ComponentPublicInstance<
          unknown extends Props ? {} : Props,
          unknown extends RawBindings ? {} : RawBindings,
          unknown extends D ? {} : D,
          C,
          M
        >
      : never // not a vue Component

/**
 * For extending allowed non-declared props on components in TSX
 */
export interface ComponentCustomProps {}

/**
 * Default allowed non-declared props on component in TSX
 */
export interface AllowedComponentProps {
  class?: unknown
  style?: unknown
}

// Note: can't mark this whole interface internal because some public interfaces
// extend it.
export interface ComponentInternalOptions {
  /**
   * @internal
   */
  __scopeId?: string
  /**
   * @internal
   */
  __cssModules?: Data
  /**
   * @internal
   */
  __hmrId?: string
  /**
   * Compat build only, for bailing out of certain compatibility behavior
   */
  __isBuiltIn?: boolean
  /**
   * This one should be exposed so that devtools can make use of it
   */
  __file?: string
  /**
   * name inferred from filename
   */
  __name?: string
}

export interface FunctionalComponent<
  P = {},
  E extends EmitsOptions | Record<string, any[]> = {},
  S extends Record<string, any> = any,
  EE extends EmitsOptions = ShortEmitsToObject<E>,
> extends ComponentInternalOptions {
  // use of any here is intentional so it can be a valid JSX Element constructor
  (
    props: P & EmitsToProps<EE>,
    ctx: Omit<SetupContext<EE, IfAny<S, {}, SlotsType<S>>>, 'expose'>,
  ): any
  props?: ComponentPropsOptions<P>
  emits?: EE | (keyof EE)[]
  slots?: IfAny<S, Slots, SlotsType<S>>
  inheritAttrs?: boolean
  displayName?: string
  compatConfig?: CompatConfig
}

export interface ClassComponent {
  new (...args: any[]): ComponentPublicInstance<any, any, any, any, any>
  __vccOpts: ComponentOptions
}

/**
 * Concrete component type matches its actual value: it's either an options
 * object, or a function. Use this where the code expects to work with actual
 * values, e.g. checking if its a function or not. This is mostly for internal
 * implementation code.
 */
export type ConcreteComponent<
  Props = {},
  RawBindings = any,
  D = any,
  C extends ComputedOptions = ComputedOptions,
  M extends MethodOptions = MethodOptions,
  E extends EmitsOptions | Record<string, any[]> = {},
  S extends Record<string, any> = any,
> =
  | ComponentOptions<Props, RawBindings, D, C, M>
  | FunctionalComponent<Props, E, S>

/**
 * A type used in public APIs where a component type is expected.
 * The constructor type is an artificial type returned by defineComponent().
 */
export type Component<
  Props = any,
  RawBindings = any,
  D = any,
  C extends ComputedOptions = ComputedOptions,
  M extends MethodOptions = MethodOptions,
  E extends EmitsOptions | Record<string, any[]> = {},
  S extends Record<string, any> = any,
> =
  | ConcreteComponent<Props, RawBindings, D, C, M, E, S>
  | ComponentPublicInstanceConstructor<Props>

export type { ComponentOptions }

type LifecycleHook<TFn = Function> = TFn[] | null

// use `E extends any` to force evaluating type to fix #2362
export type SetupContext<
  E = EmitsOptions,
  S extends SlotsType = {},
> = E extends any
  ? {
      attrs: Data
      slots: UnwrapSlotsType<S>
      emit: EmitFn<E>
      expose: (exposed?: Record<string, any>) => void
    }
  : never

/**
 * @internal
 */
export type InternalRenderFunction = {
  (
    ctx: ComponentPublicInstance,
    cache: ComponentInternalInstance['renderCache'],
    // for compiler-optimized bindings
    $props: ComponentInternalInstance['props'],
    $setup: ComponentInternalInstance['setupState'],
    $data: ComponentInternalInstance['data'],
    $options: ComponentInternalInstance['ctx'],
  ): VNodeChild
  _rc?: boolean // isRuntimeCompiled

  // __COMPAT__ only
  _compatChecked?: boolean // v3 and already checked for v2 compat
  _compatWrapped?: boolean // is wrapped for v2 compat
}

/**
 * We expose a subset of properties on the internal instance as they are
 * useful for advanced external libraries and tools.
 */
export interface ComponentInternalInstance {
  uid: number
  type: ConcreteComponent
  parent: ComponentInternalInstance | null
  root: ComponentInternalInstance
  appContext: AppContext
  /**
   * Vnode representing this component in its parent's vdom tree
   */
  vnode: VNode
  /**
   * The pending new vnode from parent updates
   * @internal
   */
  next: VNode | null
  /**
   * Root vnode of this component's own vdom tree
   */
  subTree: VNode
  /**
   * Render effect instance
   */
  effect: ReactiveEffect
  /**
   * Bound effect runner to be passed to schedulers
   */
  update: SchedulerJob
  /**
   * The render function that returns vdom tree.
   * @internal
   */
  render: InternalRenderFunction | null
  /**
   * Object containing values this component provides for its descendants
   * @internal
   */
  provides: Data
  /**
   * Tracking reactive effects (e.g. watchers) associated with this component
   * so that they can be automatically stopped on component unmount
   * @internal
   */
  scope: any
  /**
   * cache for proxy access type to avoid hasOwnProperty calls
   * @internal
   */
  accessCache: Data | null
  /**
   * cache for render function values that rely on _ctx but won't need updates
   * after initialized (e.g. inline handlers)
   * @internal
   */
  renderCache: (Function | VNode)[]

  /**
   * Resolved component registry, only for components with mixins or extends
   * @internal
   */
  components: Record<string, ConcreteComponent> | null
  /**
   * Resolved directive registry, only for components with mixins or extends
   * @internal
   */
  directives: Record<string, Directive> | null
  /**
   * Resolved filters registry, v2 compat only
   * @internal
   */
  filters?: Record<string, Function>
  /**
   * resolved props options
   * @internal
   */
  propsOptions: NormalizedPropsOptions
  /**
   * resolved emits options
   * @internal
   */
  emitsOptions: ObjectEmitsOptions | null
  /**
   * resolved inheritAttrs options
   * @internal
   */
  inheritAttrs?: boolean
  /**
   * is custom element?
   * @internal
   */
  isCE?: boolean
  /**
   * custom element specific HMR method
   * @internal
   */
  ceReload?: (newStyles?: string[]) => void

  // the rest are only for stateful components ---------------------------------

  // main proxy that serves as the public instance (`this`)
  proxy: ComponentPublicInstance | null

  // exposed properties via expose()
  exposed: Record<string, any> | null
  exposeProxy: Record<string, any> | null

  /**
   * alternative proxy used only for runtime-compiled render functions using
   * `with` block
   * @internal
   */
  withProxy: ComponentPublicInstance | null
  /**
   * This is the target for the public instance proxy. It also holds properties
   * injected by user options (computed, methods etc.) and user-attached
   * custom properties (via `this.x = ...`)
   * @internal
   */
  ctx: Data

  // state
  data: Data
  props: Data
  attrs: Data
  slots: InternalSlots
  refs: Data
  emit: EmitFn

  attrsProxy: Data | null
  slotsProxy: Slots | null

  /**
   * used for keeping track of .once event handlers on components
   * @internal
   */
  emitted: Record<string, boolean> | null
  /**
   * used for caching the value returned from props default factory functions to
   * avoid unnecessary watcher trigger
   * @internal
   */
  propsDefaults: Data
  /**
   * setup related
   * @internal
   */
  setupState: Data
  /**
   * devtools access to additional info
   * @internal
   */
  devtoolsRawSetupState?: any
  /**
   * @internal
   */
  setupContext: SetupContext | null
  /**
   * @internal
   */
  asyncDep: Promise<any> | null
  /**
   * @internal
   */
  asyncResolved: boolean

  // lifecycle
  isMounted: boolean
  isUnmounted: boolean
  isDeactivated: boolean
  /**
   * @internal
   */
  [LifecycleHooks.BEFORE_CREATE]: LifecycleHook
  /**
   * @internal
   */
  [LifecycleHooks.CREATED]: LifecycleHook
  /**
   * @internal
   */
  [LifecycleHooks.BEFORE_MOUNT]: LifecycleHook
  /**
   * @internal
   */
  [LifecycleHooks.MOUNTED]: LifecycleHook
  /**
   * @internal
   */
  [LifecycleHooks.BEFORE_UPDATE]: LifecycleHook
  /**
   * @internal
   */
  [LifecycleHooks.UPDATED]: LifecycleHook
  /**
   * @internal
   */
  [LifecycleHooks.BEFORE_UNMOUNT]: LifecycleHook
  /**
   * @internal
   */
  [LifecycleHooks.UNMOUNTED]: LifecycleHook
  /**
   * @internal
   */
  [LifecycleHooks.RENDER_TRACKED]: LifecycleHook
  /**
   * @internal
   */
  [LifecycleHooks.RENDER_TRIGGERED]: LifecycleHook
  /**
   * @internal
   */
  [LifecycleHooks.ACTIVATED]: LifecycleHook
  /**
   * @internal
   */
  [LifecycleHooks.DEACTIVATED]: LifecycleHook
  /**
   * @internal
   */
  [LifecycleHooks.ERROR_CAPTURED]: LifecycleHook
  /**
   * @internal
   */
  [LifecycleHooks.SERVER_PREFETCH]: LifecycleHook<() => Promise<unknown>>

  /**
   * For caching bound $forceUpdate on public proxy access
   * @internal
   */
  f?: () => void
  /**
   * For caching bound $nextTick on public proxy access
   * @internal
   */
  n?: () => Promise<void>
  /**
   * `updateTeleportCssVars`
   * For updating css vars on contained teleports
   * @internal
   */
  ut?: (vars?: Record<string, string>) => void

  /**
   * dev only. For style v-bind hydration mismatch checks
   * @internal
   */
  getCssVars?: () => Record<string, string>

  /**
   * v2 compat only, for caching mutated $options
   * @internal
   */
  resolvedOptions?: MergedComponentOptions
}

const emptyAppContext = createAppContext()

let uid = 0

export function createComponentInstance(
  vnode: VNode,
  parent: ComponentInternalInstance | null,
) {
  const type = vnode.type as ConcreteComponent
  // inherit parent app context - or - if root, adopt from root vnode
  const appContext =
    (parent ? parent.appContext : vnode.appContext) || emptyAppContext

  const instance: ComponentInternalInstance = {
    uid: uid++,
    vnode,
    type,
    parent,
    appContext,
    root: null!, // to be immediately set
    next: null,
    subTree: null!, // will be set synchronously right after creation
    effect: null!,
    update: null!, // will be set synchronously right after creation
    scope: effectScope(true /* detached */),
    render: null,
    proxy: null,
    exposed: null,
    exposeProxy: null,
    withProxy: null,
    provides: parent ? parent.provides : Object.create(appContext.provides),
    accessCache: null!,
    renderCache: [],

    // local resolved assets
    components: null,
    directives: null,

    // resolved props and emits options
    propsOptions: normalizePropsOptions(type, appContext),
    emitsOptions: normalizeEmitsOptions(type, appContext),

    // emit
    emit: null!, // to be set immediately
    emitted: null,

    // props default value
    propsDefaults: EMPTY_OBJ,

    // inheritAttrs
    inheritAttrs: type.inheritAttrs,

    // state
    ctx: EMPTY_OBJ,
    data: EMPTY_OBJ,
    props: EMPTY_OBJ,
    attrs: EMPTY_OBJ,
    slots: EMPTY_OBJ,
    refs: EMPTY_OBJ,
    setupState: EMPTY_OBJ,
    setupContext: null,

    attrsProxy: null,
    slotsProxy: null,

    asyncDep: null,
    asyncResolved: false,

    // lifecycle hooks
    // not using enums here because it results in computed properties
    isMounted: false,
    isUnmounted: false,
    isDeactivated: false,
    bc: null,
    c: null,
    bm: null,
    m: null,
    bu: null,
    u: null,
    um: null,
    bum: null,
    da: null,
    a: null,
    rtg: null,
    rtc: null,
    ec: null,
    sp: null,
  }
  if (__DEV__) {
    instance.ctx = createDevRenderContext(instance)
  } else {
    instance.ctx = { _: instance }
  }
  instance.root = parent ? parent.root : instance
  instance.emit = emit.bind(null, instance)

  // apply custom element special handling
  if (vnode.ce) {
    vnode.ce(instance)
  }

  return instance
}

export let currentInstance: ComponentInternalInstance | null = null

export const getCurrentInstance: () => ComponentInternalInstance | null = () =>
  currentInstance || currentRenderingInstance

let internalSetCurrentInstance: (
  instance: ComponentInternalInstance | null,
) => void

internalSetCurrentInstance = i => {
  currentInstance = i
}

export const setCurrentInstance = (instance: ComponentInternalInstance) => {
  const prev = currentInstance
  internalSetCurrentInstance(instance)
  instance.scope.on()
  return () => {
    instance.scope.off()
    internalSetCurrentInstance(prev)
  }
}

export const unsetCurrentInstance = () => {
  currentInstance && currentInstance.scope.off()
  internalSetCurrentInstance(null)
}

const isBuiltInTag = /*#__PURE__*/ makeMap('slot,component')

export function validateComponentName(
  name: string,
  { isNativeTag }: AppConfig,
) {
  if (isBuiltInTag(name) || isNativeTag(name)) {
    warn(
      'Do not use built-in or reserved HTML elements as component id: ' + name,
    )
  }
}

export function isStatefulComponent(instance: ComponentInternalInstance) {
  return instance.vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT
}

export function setupComponent(
  instance: ComponentInternalInstance,
) {
  const { props, children } = instance.vnode
  const isStateful = isStatefulComponent(instance)
  initProps(instance, props, isStateful)
  initSlots(instance, children)

  return isStateful
    ? setupStatefulComponent(instance)
    : undefined
}

function setupStatefulComponent(
  instance: ComponentInternalInstance,
) {
  const Component = instance.type as ComponentOptions

  // 0. create render proxy property access cache
  instance.accessCache = Object.create(null)
  // 1. create public instance / render proxy
  instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers)
  // 2. call setup()
  const { setup } = Component
  if (setup) {
    const setupContext = (instance.setupContext =
      setup.length > 1 ? createSetupContext(instance) : null)

    const reset = setCurrentInstance(instance)
    pauseTracking()
    const setupResult = callWithErrorHandling(
      setup,
      instance,
      ErrorCodes.SETUP_FUNCTION,
      [
        instance.props,
        setupContext,
      ],
    )
    resetTracking()
    reset()

    if (isPromise(setupResult)) {
      setupResult.then(unsetCurrentInstance, unsetCurrentInstance)
    } else {
      handleSetupResult(instance, setupResult)
    }
  } else {
    finishComponentSetup(instance)
  }
}

export function handleSetupResult(
  instance: ComponentInternalInstance,
  setupResult: unknown,
) {
  if (isFunction(setupResult)) {
    instance.render = setupResult as InternalRenderFunction
  } else if (isObject(setupResult)) {
    // setup returned bindings.
    // assuming a render function compiled from template is present.
    instance.setupState = proxyRefs(setupResult)
  }
  finishComponentSetup(instance)
}

type CompileFunction = (
  template: string | object,
  options?: CompilerOptions,
) => InternalRenderFunction

let compile: CompileFunction | undefined
let installWithProxy: (i: ComponentInternalInstance) => void

/**
 * For runtime-dom to register the compiler.
 * Note the exported method uses any to avoid d.ts relying on the compiler types.
 */
export function registerRuntimeCompiler(_compile: any) {
  compile = _compile
  installWithProxy = i => {
    if (i.render!._rc) {
      i.withProxy = new Proxy(i.ctx, RuntimeCompiledPublicInstanceProxyHandlers)
    }
  }
}

// dev only
export const isRuntimeOnly = () => !compile

export function finishComponentSetup(
  instance: ComponentInternalInstance,
) {
  const Component = instance.type as ComponentOptions

  // template / render function normalization
  // could be already set when returned from setup()
  if (!instance.render) {
    if (compile && !Component.render) {
      const template =
        (__COMPAT__ &&
          instance.vnode.props &&
          instance.vnode.props['inline-template']) ||
        Component.template ||
        resolveMergedOptions(instance).template
      if (template) {
        if (__DEV__) {
          startMeasure(instance, `compile`)
        }
        const { isCustomElement, compilerOptions } = instance.appContext.config
        const { delimiters, compilerOptions: componentCompilerOptions } =
          Component
        const finalCompilerOptions: CompilerOptions = extend(
          extend(
            {
              isCustomElement,
              delimiters,
            },
            compilerOptions,
          ),
          componentCompilerOptions,
        )
        if (__COMPAT__) {
          // pass runtime compat config into the compiler
          finalCompilerOptions.compatConfig = Object.create(globalCompatConfig)
          if (Component.compatConfig) {
            // @ts-expect-error types are not compatible
            extend(finalCompilerOptions.compatConfig, Component.compatConfig)
          }
        }
        Component.render = compile(template, finalCompilerOptions)
        if (__DEV__) {
          endMeasure(instance, `compile`)
        }
      }
    }

    instance.render = (Component.render || NOOP) as InternalRenderFunction

    // for runtime-compiled render functions using `with` blocks, the render
    // proxy used needs a different `has` handler which is more performant and
    // also only allows a whitelist of globals to fallthrough.
    if (installWithProxy) {
      installWithProxy(instance)
    }
  }
}

const attrsProxyHandlers = __DEV__
  ? {
      get(target: Data, key: string) {
        markAttrsAccessed()
        track(target, TrackOpTypes.GET, '')
        return target[key]
      },
      set() {
        warn(`setupContext.attrs is readonly.`)
        return false
      },
      deleteProperty() {
        warn(`setupContext.attrs is readonly.`)
        return false
      },
    }
  : {
      get(target: Data, key: string) {
        track(target, TrackOpTypes.GET, '')
        return target[key]
      },
    }

/**
 * Dev-only
 */
function getSlotsProxy(instance: ComponentInternalInstance): Slots {
  return (
    instance.slotsProxy ||
    (instance.slotsProxy = new Proxy(instance.slots, {
      get(target, key: string) {
        track(instance, TrackOpTypes.GET, '$slots')
        return target[key]
      },
    }))
  )
}

export function createSetupContext(
  instance: ComponentInternalInstance,
): SetupContext {
  const expose: SetupContext['expose'] = exposed => {
    if (__DEV__) {
      if (instance.exposed) {
        warn(`expose() should be called only once per setup().`)
      }
      if (exposed != null) {
        let exposedType: string = typeof exposed
        if (exposedType === 'object') {
          if (isArray(exposed)) {
            exposedType = 'array'
          } else if (isRef(exposed)) {
            exposedType = 'ref'
          }
        }
        if (exposedType !== 'object') {
          warn(
            `expose() should be passed a plain object, received ${exposedType}.`,
          )
        }
      }
    }
    instance.exposed = exposed || {}
  }

  if (__DEV__) {
    // We use getters in dev in case libs like test-utils overwrite instance
    // properties (overwrites should not be done in prod)
    let attrsProxy: Data
    return Object.freeze({
      get attrs() {
        return (
          attrsProxy ||
          (attrsProxy = new Proxy(instance.attrs, attrsProxyHandlers))
        )
      },
      get slots() {
        return getSlotsProxy(instance)
      },
      get emit() {
        return (event: string, ...args: any[]) => instance.emit(event, ...args)
      },
      expose,
    })
  } else {
    return {
      attrs: new Proxy(instance.attrs, attrsProxyHandlers),
      slots: instance.slots,
      emit: instance.emit,
      expose,
    }
  }
}

export function getExposeProxy(instance: ComponentInternalInstance) {
  if (instance.exposed) {
    return (
      instance.exposeProxy ||
      (instance.exposeProxy = new Proxy(proxyRefs(instance.exposed), {
        get(target, key: string) {
          if (key in target) {
            return target[key]
          } else if (key in publicPropertiesMap) {
            return publicPropertiesMap[key](instance)
          }
        },
        has(target, key: string) {
          return key in target || key in publicPropertiesMap
        },
      }))
    )
  }
}

const classifyRE = /(?:^|[-_])(\w)/g
const classify = (str: string): string =>
  str.replace(classifyRE, c => c.toUpperCase()).replace(/[-_]/g, '')

export function getComponentName(
  Component: ConcreteComponent,
  includeInferred = true,
): string | false | undefined {
  return isFunction(Component)
    ? Component.displayName || Component.name
    : Component.name || (includeInferred && Component.__name)
}

/* istanbul ignore next */
export function formatComponentName(
  instance: ComponentInternalInstance | null,
  Component: ConcreteComponent,
  isRoot = false,
): string {
  let name = getComponentName(Component)
  if (!name && Component.__file) {
    const match = Component.__file.match(/([^/\\]+)\.\w+$/)
    if (match) {
      name = match[1]
    }
  }

  if (!name && instance && instance.parent) {
    // try to infer the name based on reverse resolution
    const inferFromRegistry = (registry: Record<string, any> | undefined) => {
      for (const key in registry) {
        if (registry[key] === Component) {
          return key
        }
      }
    }
    name =
      inferFromRegistry(
        instance.components ||
          (instance.parent.type as ComponentOptions).components,
      ) || inferFromRegistry(instance.appContext.components)
  }

  return name ? classify(name) : isRoot ? `App` : `Anonymous`
}
