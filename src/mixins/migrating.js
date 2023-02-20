import { kebabCase } from 'element-ui/src/utils/util';
/**
 * Show migrating guide in browser console.
 * 在浏览器控制台中显示移除（变化）指南
 *
 * Usage:
 * import Migrating from 'element-ui/src/mixins/migrating';
 *
 * mixins: [Migrating]
 *
 * add getMigratingConfig method for your component.
 *  getMigratingConfig() {
 *    return {
 *      props: {
 *        'allow-no-selection': 'allow-no-selection is removed.',
 *        'selection-mode': 'selection-mode is removed.'
 *      },
 *      events: {
 *        selectionchange: 'selectionchange is renamed to selection-change.'
 *      }
 *    };
 *  },
 */
export default {
  mounted() {
    // 如果是生产模式，直接返回，不执行
    if (process.env.NODE_ENV === 'production') return;
    // 如果当前节点不存在，直接返回
    if (!this.$vnode) return;
    const { props = {}, events = {} } = this.getMigratingConfig();
    // 获取当前$vnode的data 和 options
    const { data, componentOptions } = this.$vnode;
    // 获取data 的属性attrs
    const definedProps = data.attrs || {};
    // 从options 中获取监听事件
    const definedEvents = componentOptions.listeners || {};

    // 遍历所有的属性
    for (let propName in definedProps) {
      propName = kebabCase(propName); // compatible with camel case 兼容驼峰
      // 如果根据当前遍历的属性名找到了对应的属性值
      if (props[propName]) {
        // 控制台打印 组件名称 属性值
        console.warn(`[Element Migrating][${this.$options.name}][Attribute]: ${props[propName]}`);
      }
    }

    // 遍历监听事件
    for (let eventName in definedEvents) {
      eventName = kebabCase(eventName); // compatible with camel case
      // 如果事件名称对应的事件值存在
      if (events[eventName]) {
        // 控制台打印 组件名称 事件值
        console.warn(`[Element Migrating][${this.$options.name}][Event]: ${events[eventName]}`);
      }
    }
  },
  methods: {
    getMigratingConfig() {
      return {
        props: {},
        events: {}
      };
    }
  }
};
