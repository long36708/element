import { on, off } from 'element-ui/src/utils/dom';
import { renderThumbStyle, BAR_MAP } from './util';

/* istanbul ignore next */
export default {
  name: 'Bar',

  props: {
    // 是否是垂直滚动条
    vertical: Boolean,
    // 滚动条的宽度
    size: String,
    move: Number
  },

  computed: {
    bar() {
      return BAR_MAP[this.vertical ? 'vertical' : 'horizontal'];
    },

    wrap() {
      // 父组件的wrap
      return this.$parent.wrap;
    }
  },

  render(h) {
    const { size, move, bar } = this;

    return (
      <div
        class={ ['el-scrollbar__bar', 'is-' + bar.key] }
        onMousedown={ this.clickTrackHandler } >
        <div
          ref="thumb"
          class="el-scrollbar__thumb"
          onMousedown={ this.clickThumbHandler }
          style={ renderThumbStyle({ size, move, bar }) }>
        </div>
      </div>
    );
  },

  methods: {
    clickThumbHandler(e) {
      // prevent click event of right button
      if (e.ctrlKey || e.button === 2) {
        // 如果是ctrl键直接返回
        return;
      }
      // 开始拖拽
      this.startDrag(e);
      this[this.bar.axis] = (e.currentTarget[this.bar.offset] - (e[this.bar.client] - e.currentTarget.getBoundingClientRect()[this.bar.direction]));
    },

    clickTrackHandler(e) {
      const offset = Math.abs(e.target.getBoundingClientRect()[this.bar.direction] - e[this.bar.client]);
      const thumbHalf = (this.$refs.thumb[this.bar.offset] / 2);
      const thumbPositionPercentage = ((offset - thumbHalf) * 100 / this.$el[this.bar.offset]);

      this.wrap[this.bar.scroll] = (thumbPositionPercentage * this.wrap[this.bar.scrollSize] / 100);
    },

    startDrag(e) {
      // 停止立即传播
      e.stopImmediatePropagation();
      // 鼠标指针按下
      this.cursorDown = true;
      // 挂载鼠标移动事件
      on(document, 'mousemove', this.mouseMoveDocumentHandler);
      // 挂载鼠标抬起事件
      on(document, 'mouseup', this.mouseUpDocumentHandler);
      document.onselectstart = () => false;
    },

    // 鼠标移动文档处理器
    mouseMoveDocumentHandler(e) {
      // 鼠标指针 未按下 直接返回
      if (this.cursorDown === false) return;
      const prevPage = this[this.bar.axis];

      if (!prevPage) return;

      const offset = ((this.$el.getBoundingClientRect()[this.bar.direction] - e[this.bar.client]) * -1);
      const thumbClickPosition = (this.$refs.thumb[this.bar.offset] - prevPage);
      const thumbPositionPercentage = ((offset - thumbClickPosition) * 100 / this.$el[this.bar.offset]);

      this.wrap[this.bar.scroll] = (thumbPositionPercentage * this.wrap[this.bar.scrollSize] / 100);
    },

    // 鼠标抬起文档处理器
    mouseUpDocumentHandler(e) {
      // 鼠标指针 设置为未按下
      this.cursorDown = false;
      this[this.bar.axis] = 0;
      // 卸载鼠标移动事件
      off(document, 'mousemove', this.mouseMoveDocumentHandler);
      document.onselectstart = null;
    }
  },

  destroyed() {
    // 卸载鼠标抬起事件
    off(document, 'mouseup', this.mouseUpDocumentHandler);
  }
};
