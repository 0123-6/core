import {computed as _computed} from '@vue/reactivity'

export const computed: typeof _computed = (
  getterOrOptions: any,
) => {
  return _computed(getterOrOptions)
}
