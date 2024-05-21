// 追踪对应的操作类型
export const TrackOpTypes = {
  GET: 'get',
  HAS: 'has',
  ITERATE: 'iterate',
}

// 触发对应的操作类型
export const TriggerOpTypes = {
  SET: 'set',
  ADD: 'add',
  DELETE: 'delete',
  CLEAR: 'clear',
}

// reactive包内部的静态标识符
export const ReactiveFlags = {
  SKIP: '__v_skip',
  IS_REACTIVE: '__v_isReactive',
  RAW: '__v_raw',
}

// 脏数据的不同等级
export const DirtyLevels = {
  // 不脏 0
  NotDirty: 0,
  // 正在查询脏
  QueryingDirty: 1,
  // 可能因为计算属性的副作用而脏
  MaybeDirty_ComputedSideEffect: 2,
  // 可能脏
  MaybeDirty: 3,
  // 脏的
  Dirty: 4,
}
