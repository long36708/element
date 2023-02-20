<!--函数式组件-->
<template functional>
  <div
    v-bind="data.attrs"
    v-on="listeners"
    :class="[data.staticClass, 'el-divider', `el-divider--${props.direction}`]"
  >
    <!--  如果插槽里有内容 且分割线方向不是垂直  -->
    <div
      v-if="slots().default && props.direction !== 'vertical'"
      :class="['el-divider__text', `is-${props.contentPosition}`]"
     >
      <slot />
    </div>
  </div>
</template>

<script>
export default {
  name: 'ElDivider',
  props: {
    // 设置分割线方向
    direction: {
      type: String,
      default: 'horizontal',
      validator(val) {
        return ['horizontal', 'vertical'].indexOf(val) !== -1;
      }
    },
    // 设置分割线文案的位置
    contentPosition: {
      type: String,
      default: 'center',
      validator(val) {
        return ['left', 'center', 'right'].indexOf(val) !== -1;
      }
    }
  }
};

</script>
