<script>
  export default {
    name: 'ElTimeline',

    props: {
      // 指定节点排序方向，默认为正序
      reverse: {
        type: Boolean,
        default: false
      }
    },

    // 注入子组件 timeline实例
    provide() {
      return {
        timeline: this
      };
    },

    render() {
      const reverse = this.reverse;
      const classes = {
        'el-timeline': true,
        'is-reverse': reverse
      };
      let slots = this.$slots.default || [];
      // 如果是倒序
      if (reverse) {
        // 将默认插槽数组倒置
        slots = slots.reverse();
      }
      return (<ul class={ classes }>
        { slots }
      </ul>);
    }
  };
</script>
