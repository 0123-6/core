// debugger

// 定义1个值
const loveGirlList = Vue.ref([
	{
		name: '夏翀',
		age: 25,
		love: 9.5
	},
	{
		name: '徐青兒',
		age: 32,
		love: 9.1
	},
])

// 定义1个计算属性，保存当前最爱的女人
const mostLoveGirl = Vue.computed(() => {
	const compareFn = (a, b) => a.love - b.love
	const newList = loveGirlList.value.toSorted(compareFn)
	return newList.at(-1)
})
console.log('mostLoveGirl: ', mostLoveGirl.value)

loveGirlList.value.push({
	name: '吕凤凤',
	age: 24,
	love: 9.6
})
console.log('mostLoveGirl: ', mostLoveGirl.value)

loveGirlList.value.push({
	name: '申梦瑶',
	age: 33,
	love: 9.2
},)
console.log('mostLoveGirl: ', mostLoveGirl.value)


const obj1 = Vue.reactive({
	name: '韩佩江',
	age: 25,
	love: [
		{
			name: '夏翀',
			age: 25,
		}
	]
})

const computed1 = Vue.computed(() => {
	let str = ''
	for(const {name} of obj1.love) {
		str += name
	}
	return str
})
console.log(computed1.value)

obj1.love.push({
	name: '吕凤凤',
	age: 24,
})
console.log(computed1.value)


obj1.love = [{
	name: '葛鑫',
	age: 25,
}]
console.log(computed1.value)
