/**
 * 自己重写makeMap工具函数，
 * 该函数是一个工厂函数，接受一个字符串，返回一个具有特定功能的函数(判断一个参数是否在字符串中)
 * 该闭包体现了以空间换取时间的编程思想
 */
export function makeMap(
  str: string,// 第一个参数，接受一个字符串，约定以','分割
  expectsLowerCase?: boolean// 可选参数，是否需要将输入转换为小写
): (key: string) => boolean {
  // 初始化一个set
  const set = new Set(str.split(','))
  // 返回工具函数
  return expectsLowerCase
    ? val => set.has(val.toLowerCase())// 如果需要小写转换，返回一个处理小写的函数
    : val => set.has(val)// 否则，返回一个直接判断的函数
}
