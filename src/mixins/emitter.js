function broadcast(componentName, eventName, params) {
  // 根据当前组件this的孩子们，遍历
  this.$children.forEach(child => {
    // 获取孩子的组件名称
    var name = child.$options.componentName;

    // 如果孩子的组件名称和传入的一致
    if (name === componentName) {
      // 正在遍历的孩子进行 $emit 触发事件传递参数
      child.$emit.apply(child, [eventName].concat(params));
    } else {
      // 如果孩子的组件名称和传入的不一致，继续向下广播
      broadcast.apply(child, [componentName, eventName].concat([params]));
    }
  });
}
export default {
  methods: {
    // 向上分发派遣
    dispatch(componentName, eventName, params) {
      // 获取当前组件的父节点或者根节点
      var parent = this.$parent || this.$root;
      // 获取父节点的名称
      var name = parent.$options.componentName;

      // 当父节点存在 且名称不等于传入的组件名称时
      while (parent && (!name || name !== componentName)) {
        // 获取父节点的父节点
        parent = parent.$parent;

        // 如果父节点存在，获取父节点的名称
        if (parent) {
          name = parent.$options.componentName;
        }
      }
      // 跳出while循环后，如果parent存在
      if (parent) {
        // 触发事件传递参数
        parent.$emit.apply(parent, [eventName].concat(params));
      }
    },
    // 向下广播
    broadcast(componentName, eventName, params) {
      broadcast.call(this, componentName, eventName, params);
    }
  }
};
