<template>
  <li class="el-timeline-item">
    <div class="el-timeline-item__tail"></div>
    <!-- 自定义节点 不存在时  -->
    <div v-if="!$slots.dot"
      class="el-timeline-item__node"
      :class="[
        `el-timeline-item__node--${size || ''}`,
        `el-timeline-item__node--${type || ''}`
      ]"
      :style="{
        backgroundColor: color
      }"
    >
      <!-- 节点图标  -->
      <i v-if="icon"
        class="el-timeline-item__icon"
        :class="icon"
      ></i>
    </div>
    <!-- 自定义节点   -->
    <div v-if="$slots.dot" class="el-timeline-item__dot">
      <slot name="dot"></slot>
    </div>

    <!-- 如果不隐藏时间戳，且位置在上   -->
    <div class="el-timeline-item__wrapper">
      <div v-if="!hideTimestamp && placement === 'top'"
        class="el-timeline-item__timestamp is-top">
        {{timestamp}}
      </div>

      <!-- Timeline-Item 的内容 -->
      <div class="el-timeline-item__content">
        <slot></slot>
      </div>
      <!-- 如果不隐藏时间戳，且位置在下   -->
      <div v-if="!hideTimestamp && placement === 'bottom'"
        class="el-timeline-item__timestamp is-bottom">
        {{timestamp}}
      </div>
    </div>
  </li>
</template>

<script>
  export default {
    name: 'ElTimelineItem',

    // 接收传入的timeline
    inject: ['timeline'],

    props: {
      // 时间戳
      timestamp: String,

      // 是否隐藏时间戳
      hideTimestamp: {
        type: Boolean,
        default: false
      },

      // 时间戳位置 top / bottom
      placement: {
        type: String,
        default: 'bottom'
      },

      // 节点类型 	primary / success / warning / danger / info
      type: String,

      // 节点颜色
      color: String,

      // 节点尺寸
      size: {
        type: String,
        default: 'normal'
      },

      // 节点图标
      icon: String
    }
  };
</script>
