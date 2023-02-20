export default {
  // 注入 根菜单，所有的子菜单都能读取根菜单的数据
  inject: ['rootMenu'],
  computed: {
    // 当前菜单组件的索引路径
    indexPath() {
      const path = [this.index];
      let parent = this.$parent;
      // 如果父组件的名称不是 ElMenu ，一直循环直到是 为止
      while (parent.$options.componentName !== 'ElMenu') {
        // 如果父组件的索引存在，将其放到path的开头
        if (parent.index) {
          // unshift() 方法将一个或多个元素添加到数组的开头，并返回该数组的新长度（该方法修改原有数组）
          path.unshift(parent.index);
        }
        parent = parent.$parent;
      }
      return path;
    },
    // 父级菜单
    parentMenu() {
      let parent = this.$parent;
      // 如果父组件存在，且父组件的名称 不是 ['ElMenu', 'ElSubmenu'] ，一直循环找到parent 是 ['ElMenu', 'ElSubmenu'] 中的一个为止
      while (
        parent &&
        ['ElMenu', 'ElSubmenu'].indexOf(parent.$options.componentName) === -1
      ) {
        parent = parent.$parent;
      }
      return parent;
    },
    paddingStyle() {
      // 如果根节点不是垂直模式，直接返回
      if (this.rootMenu.mode !== 'vertical') return {};

      let padding = 20;
      let parent = this.$parent;

      // 垂直模式下，如果根菜单是折叠状态
      if (this.rootMenu.collapse) {
        padding = 20;
      } else {
        // 如果父节点存在且父组件的名称不是 ElMenu ，一直遍历，直到父组件名称是ElMenu
        while (parent && parent.$options.componentName !== 'ElMenu') {
          if (parent.$options.componentName === 'ElSubmenu') {
            padding += 20;
          }
          parent = parent.$parent;
        }
      }
      return {paddingLeft: padding + 'px'};
    }
  }
};
