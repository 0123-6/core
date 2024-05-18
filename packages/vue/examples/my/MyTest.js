// 定义1个Vue组件
export default {
  name: 'MyTest',
  // 模板
  template: `
		<div style="display: flex;flex-direction: column;">
			<span>{{name}}</span>
			<span>{{age}}</span>
			<span @click="inc">添加</span>
		</div>
	`,
  data() {
    return {
      name: '夏翀',
      age: 25,
    }
  },
  beforeCreate() {
    console.log('进入了beforeCreate钩子')
  },
  created() {
    console.log('进入了created钩子')
  },
  beforeMount() {
    console.log('进入了beforeMount钩子')
  },
  mounted() {
    console.log('进入了mounted钩子')
  },
  beforeUpdate() {
    console.log('进入了beforeUpdate钩子')
  },
  updated() {
    console.log('进入了updated钩子')
  },
  methods: {
    inc() {
      this.age++
    },
  },
}
