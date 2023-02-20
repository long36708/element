<template>
  <transition name="el-zoom-in-top" @after-leave="doDestroy">
    <ul class="el-dropdown-menu el-popper" :class="[size && `el-dropdown-menu--${size}`]" v-show="showPopper">
      <slot></slot>
    </ul>
  </transition>
</template>
<script>
  import Popper from 'element-ui/src/utils/vue-popper';

  export default {
    name: 'ElDropdownMenu',

    componentName: 'ElDropdownMenu',

    mixins: [Popper],

    props: {
      visibleArrow: {
        type: Boolean,
        default: true
      },
      arrowOffset: {
        type: Number,
        default: 0
      }
    },

    data() {
      return {
        // dropdown 的大小
        size: this.dropdown.dropdownSize
      };
    },

    // 子组件注入的 dropdown
    inject: ['dropdown'],

    created() {
      // 挂载 更新弹出层事件
      this.$on('updatePopper', () => {
        if (this.showPopper) this.updatePopper();
      });
      // 挂载 可见事件
      this.$on('visible', val => {
        this.showPopper = val;
      });
    },

    mounted() {
      this.dropdown.popperElm = this.popperElm = this.$el;
      this.referenceElm = this.dropdown.$el;
      // compatible with 2.6 new v-slot syntax
      // issue link https://github.com/ElemeFE/element/issues/14345
      this.dropdown.initDomOperation();
    },

    watch: {
      // 监视 placement变化
      'dropdown.placement': {
        immediate: true,
        handler(val) {
          // 当前的placement
          this.currentPlacement = val;
        }
      }
    }
  };
</script>
