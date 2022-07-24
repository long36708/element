<template>
  <transition
    name="el-drawer-fade"
    @after-enter="afterEnter"
    @after-leave="afterLeave">
    <div
      class="el-drawer__wrapper"
      tabindex="-1"
      v-show="visible">
      <div
        class="el-drawer__container"
        :class="visible && 'el-drawer__open'"
        @click.self="handleWrapperClick"
        role="document"
        tabindex="-1">
        <div
          aria-modal="true"
          aria-labelledby="el-drawer__title"
          :aria-label="title"
          class="el-drawer"
          :class="[direction, customClass]"
          :style="isHorizontal ? `width: ${drawerSize}` : `height: ${drawerSize}`"
          ref="drawer"
          role="dialog"
          tabindex="-1"
          >
          <header class="el-drawer__header" id="el-drawer__title" v-if="withHeader">
            <slot name="title">
              <span role="heading" :title="title">{{ title }}</span>
            </slot>
            <button
              :aria-label="`close ${title || 'drawer'}`"
              class="el-drawer__close-btn"
              type="button"
              v-if="showClose"
              @click="closeDrawer">
              <i class="el-dialog__close el-icon el-icon-close"></i>
            </button>
          </header>
          <section class="el-drawer__body" v-if="rendered">
            <slot></slot>
          </section>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import Popup from 'element-ui/src/utils/popup';
import emitter from 'element-ui/src/mixins/emitter';

export default {
  name: 'ElDrawer',
  mixins: [Popup, emitter],
  props: {
    // Drawer 自身是否插入至 body 元素上。嵌套的 Drawer 必须指定该属性并赋值为 true
    appendToBody: {
      type: Boolean,
      default: false
    },
    // 关闭前的回调，会暂停 Drawer 的关闭
    beforeClose: {
      type: Function
    },
    //	Drawer 的自定义类名
    customClass: {
      type: String,
      default: ''
    },
    // 是否可以通过按下 ESC 关闭 Drawer
    closeOnPressEscape: {
      type: Boolean,
      default: true
    },
    // 控制是否在关闭 Drawer 之后将子元素全部销毁
    destroyOnClose: {
      type: Boolean,
      default: false
    },
    // 是否需要遮罩层
    modal: {
      type: Boolean,
      default: true
    },
    // Drawer 打开的方向
    direction: {
      type: String,
      default: 'rtl',
      validator(val) {
        return ['ltr', 'rtl', 'ttb', 'btt'].indexOf(val) !== -1;
      }
    },
    // 遮罩层是否插入至 body 元素上，若为 false，则遮罩层会插入至 Drawer 的父元素上
    modalAppendToBody: {
      type: Boolean,
      default: true
    },
    // 是否显示关闭按钮
    showClose: {
      type: Boolean,
      default: true
    },
    // Drawer 窗体的大小, 当使用 number 类型时, 以像素为单位,
    // 当使用 string 类型时, 请传入 'x%', 否则便会以 number 类型解释
    size: {
      type: [Number, String],
      default: '30%'
    },
    // Drawer 的标题，也可通过具名 slot （见下表）传入
    title: {
      type: String,
      default: ''
    },
    // 是否显示 Drawer，支持 .sync 修饰符
    visible: {
      type: Boolean
    },
    // 点击遮罩层是否可以关闭 Drawer
    wrapperClosable: {
      type: Boolean,
      default: true
    },
    // 控制是否显示 header 栏, 默认为 true,
    // 当此项为 false 时, title attribute 和 title slot 均不生效
    withHeader: {
      type: Boolean,
      default: true
    }
  },
  computed: {
    isHorizontal() {
      return this.direction === 'rtl' || this.direction === 'ltr';
    },
    drawerSize() {
      return typeof this.size === 'number' ? `${this.size}px` : this.size;
    }
  },
  data() {
    return {
      closed: false,
      prevActiveElement: null // 上一个激活的元素
    };
  },
  watch: {
    visible(val) {
      // 如果抽屉变为可见
      if (val) {
        // 未关闭
        this.closed = false;
        // 触发打开事件
        this.$emit('open');
        // 如果需要插入到body
        if (this.appendToBody) {
          document.body.appendChild(this.$el);
        }
        // 上一个激活的元素
        this.prevActiveElement = document.activeElement;
      } else {
        // 否则，如果抽屉变为不可见 ，并且抽屉还未关闭！！
        if (!this.closed) {
          // 触发关闭事件
          this.$emit('close');
          // 如果开启 在关闭 Drawer 之后将子元素全部销毁
          if (this.destroyOnClose === true) {
            this.rendered = false;
          }
        }
        this.$nextTick(() => {
          if (this.prevActiveElement) {
            this.prevActiveElement.focus();
          }
        });
      }
    }
  },
  methods: {
    // Drawer 打开动画结束时的回调
    afterEnter() {
      this.$emit('opened');
    },
    // Drawer 关闭动画结束时的回调
    afterLeave() {
      this.$emit('closed');
    },
    hide(cancel) {
      // 如果不是取消,执行更新visible的方法，设置为false
      if (cancel !== false) {
        this.$emit('update:visible', false);t
        // 触发关闭事件 Drawer 关闭的回调
        this.$emit('close');
        // 控制是否在关闭 Drawer 之后将子元素全部销毁
        if (this.destroyOnClose === true) {
          // 将抽屉内容销毁
          this.rendered = false;
        }
        // 将抽屉的关闭状态改为true
        this.closed = true;
      }
    },
    handleWrapperClick() {
      // 如果开启 点击遮罩层可以关闭 Drawer
      if (this.wrapperClosable) {
        this.closeDrawer();
      }
    },
    // 关闭抽屉的方法
    closeDrawer() {
      if (typeof this.beforeClose === 'function') {
        // 关闭前的回调，会暂停 Drawer 的关闭
        this.beforeClose(this.hide);
      } else {
        this.hide();
      }
    },
    handleClose() {
      // This method here will be called by PopupManger, when the `closeOnPressEscape` was set to true
      // pressing `ESC` will call this method, and also close the drawer.
      // This method also calls `beforeClose` if there was one.
      this.closeDrawer();
    }
  },
  mounted() {
    // 挂载时，如果可见，渲染抽屉中的内容
    if (this.visible) {
      this.rendered = true;
      // ？？？
      this.open();
      if (this.appendToBody) {
        document.body.appendChild(this.$el);
      }
    }
  },
  destroyed() {
    // if appendToBody is true, remove DOM node after destroy
    if (this.appendToBody && this.$el && this.$el.parentNode) {
      // 在组件销毁时移除dom
      this.$el.parentNode.removeChild(this.$el);
    }
  }
};
</script>
