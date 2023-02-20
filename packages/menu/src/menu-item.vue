<template>
  <li class="el-menu-item"
    role="menuitem"
    tabindex="-1"
    :style="[paddingStyle, itemStyle, { backgroundColor }]"
    :class="{
      'is-active': active,
      'is-disabled': disabled
    }"
    @click="handleClick"
    @mouseenter="onMouseEnter"
    @focus="onMouseEnter"
    @blur="onMouseLeave"
    @mouseleave="onMouseLeave"
  >
    <!-- 如果父级菜单是 ElMenu 且根菜单是折叠的 且插槽的title存在  -->
    <el-tooltip
      v-if="parentMenu.$options.componentName === 'ElMenu' && rootMenu.collapse && $slots.title"
      effect="dark"
      placement="right">
      <div slot="content"><slot name="title"></slot></div>
      <div style="position: absolute;left: 0;top: 0;height: 100%;width: 100%;display: inline-block;box-sizing: border-box;padding: 0 20px;">
        <slot></slot>
      </div>
    </el-tooltip>
    <template v-else>
      <slot></slot>
      <slot name="title"></slot>
    </template>
  </li>
</template>
<script>
  import Menu from './menu-mixin';
  import ElTooltip from 'element-ui/packages/tooltip';
  import Emitter from 'element-ui/src/mixins/emitter';

  export default {
    name: 'ElMenuItem',

    componentName: 'ElMenuItem',

    mixins: [Menu, Emitter],

    components: { ElTooltip },

    props: {
      // 	唯一标志
      index: {
        default: null,
        validator: val => typeof val === 'string' || val === null
      },
      // Vue Router 路径对象
      route: [String, Object],
      // 是否禁用
      disabled: Boolean
    },
    computed: {
      // 如果当前组件的索引和根节点中激活的索引相同
      active() {
        return this.index === this.rootMenu.activeIndex;
      },
      // 返回根菜单的悬浮背景色
      hoverBackground() {
        return this.rootMenu.hoverBackground;
      },
      backgroundColor() {
        return this.rootMenu.backgroundColor || '';
      },
      activeTextColor() {
        return this.rootMenu.activeTextColor || '';
      },
      textColor() {
        return this.rootMenu.textColor || '';
      },
      mode() {
        return this.rootMenu.mode;
      },
      itemStyle() {
        // 文字颜色，如果当前组件激活，则是激活时的文字颜色
        const style = {
          color: this.active ? this.activeTextColor : this.textColor
        };
        // 如果是水平 且 不是嵌套
        if (this.mode === 'horizontal' && !this.isNested) {
          // 底部颜色为 激活的话 是根菜单激活时文字的颜色，否则是透明
          style.borderBottomColor = this.active
            ? (this.rootMenu.activeTextColor ? this.activeTextColor : '')
            : 'transparent';
        }
        return style;
      },
      // 是否是嵌套
      isNested() {
        // 如果父级菜单不是根菜单，则是嵌套
        return this.parentMenu !== this.rootMenu;
      }
    },
    methods: {
      onMouseEnter() {
        // 如果是水平模式，且 根菜单的背景颜色不存在 ，直接返回
        if (this.mode === 'horizontal' && !this.rootMenu.backgroundColor) return;
        this.$el.style.backgroundColor = this.hoverBackground;
      },
      onMouseLeave() {
        // 如果是水平模式，且 根菜单的背景颜色不存在 ，直接返回
        if (this.mode === 'horizontal' && !this.rootMenu.backgroundColor) return;
        this.$el.style.backgroundColor = this.backgroundColor;
      },
      handleClick() {
        // 如果未禁用
        if (!this.disabled) {
          // 向上派遣 item-click事件
          this.dispatch('ElMenu', 'item-click', this);
          this.$emit('click', this);
        }
      }
    },
    mounted() {
      this.parentMenu.addItem(this);
      this.rootMenu.addItem(this);
    },
    beforeDestroy() {
      this.parentMenu.removeItem(this);
      this.rootMenu.removeItem(this);
    }
  };
</script>
