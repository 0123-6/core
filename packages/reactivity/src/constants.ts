// using literal strings instead of numbers so that it's easier to inspect
// debugger events

export enum TrackOpTypes {
  GET = 'get',
  HAS = 'has',
  ITERATE = 'iterate',
}

export enum TriggerOpTypes {
  SET = 'set',
  ADD = 'add',
  DELETE = 'delete',
  CLEAR = 'clear',
}

export enum ReactiveFlags {
  SKIP = '__v_skip',
  IS_REACTIVE = '__v_isReactive',
  RAW = '__v_raw',
}

// 脏数据的不同等级
export enum DirtyLevels {
  // 不脏 0
  NotDirty = 0,
  // 正在查询脏
  QueryingDirty = 1,
  // 可能因为计算属性的副作用而脏
  MaybeDirty_ComputedSideEffect = 2,
  // 可能脏
  MaybeDirty = 3,
  // 脏的
  Dirty = 4,
}
