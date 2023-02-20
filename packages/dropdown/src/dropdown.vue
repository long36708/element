<script>
  import Clickoutside from 'element-ui/src/utils/clickoutside';
  import Emitter from 'element-ui/src/mixins/emitter';
  import Migrating from 'element-ui/src/mixins/migrating';
  import ElButton from 'element-ui/packages/button';
  import ElButtonGroup from 'element-ui/packages/button-group';
  import { generateId } from 'element-ui/src/utils/util';

  export default {
    name: 'ElDropdown',

    componentName: 'ElDropdown',

    mixins: [Emitter, Migrating],

    directives: { Clickoutside },

    components: {
      ElButton,
      ElButtonGroup
    },

    provide() {
      return {
        dropdown: this
      };
    },

    props: {
      // 触发下拉的行为
      trigger: {
        type: String,
        default: 'hover'
      },
      // 菜单按钮类型，同 Button 组件(只在split-button为 true 的情况下有效)
      type: String,
      // 菜单尺寸，在split-button为 true 的情况下也对触发按钮生效
      size: {
        type: String,
        default: ''
      },
      // 下拉触发元素呈现为按钮组
      splitButton: Boolean,
      // 是否在点击菜单项后隐藏菜单
      hideOnClick: {
        type: Boolean,
        default: true
      },
      // 菜单弹出位置
      placement: {
        type: String,
        default: 'bottom-end'
      },
      visibleArrow: {
        default: true
      },
      // 展开下拉菜单的延时（仅在 trigger 为 hover 时有效）
      showTimeout: {
        type: Number,
        default: 250
      },
      // 	收起下拉菜单的延时（仅在 trigger 为 hover 时有效）
      hideTimeout: {
        type: Number,
        default: 150
      },
      // Dropdown 组件的 tabindex
      tabindex: {
        type: Number,
        default: 0
      },
      // 是否禁用
      disabled: {
        type: Boolean,
        default: false
      }
    },

    data() {
      return {
        timeout: null,
        visible: false,
        triggerElm: null,
        menuItems: null,
        menuItemsArray: null,
        dropdownElm: null,
        focusing: false,
        listId: `dropdown-menu-${generateId()}`
      };
    },

    computed: {
      dropdownSize() {
        return this.size || (this.$ELEMENT || {}).size;
      }
    },

    mounted() {
      this.$on('menu-item-click', this.handleMenuItemClick);
    },

    watch: {
      visible(val) {
        // 向下广播 可见
        this.broadcast('ElDropdownMenu', 'visible', val);
        this.$emit('visible-change', val);
      },
      focusing(val) {
        const selfDefine = this.$el.querySelector('.el-dropdown-selfdefine');
        if (selfDefine) { // 自定义
          if (val) {
            selfDefine.className += ' focusing';
          } else {
            selfDefine.className = selfDefine.className.replace('focusing', '');
          }
        }
      }
    },

    methods: {
      getMigratingConfig() {
        return {
          props: {
            'menu-align': 'menu-align is renamed to placement.'
          }
        };
      },
      // 展示下拉菜单
      show() {
        // 若禁用，直接return
        if (this.disabled) return;
        clearTimeout(this.timeout);
        // 延时设置下拉菜单显示，若是点击，延时为0，否则为设置的延时显示时间
        this.timeout = setTimeout(() => {
          this.visible = true;
        }, this.trigger === 'click' ? 0 : this.showTimeout);
      },
      hide() {
        // 若禁用，直接return
        if (this.disabled) return;
        this.removeTabindex();
        // 如果聚焦索引值大于等于0 ，重置触发元素的聚焦索引
        if (this.tabindex >= 0) {
          this.resetTabindex(this.triggerElm);
        }
        clearTimeout(this.timeout);
        // 延时设置隐藏
        this.timeout = setTimeout(() => {
          this.visible = false;
        }, this.trigger === 'click' ? 0 : this.hideTimeout);
      },
      handleClick() {
        // 若禁用，直接return
        if (this.disabled) return;
        // 若显示则隐藏 ，否则显示
        if (this.visible) {
          this.hide();
        } else {
          this.show();
        }
      },
      handleTriggerKeyDown(ev) {
        const keyCode = ev.keyCode;
        // 如果按上下键 移除聚焦索引并重置，菜单项的第一项聚焦
        if ([38, 40].indexOf(keyCode) > -1) { // up/down
          this.removeTabindex();
          this.resetTabindex(this.menuItems[0]);
          this.menuItems[0].focus();
          ev.preventDefault();
          ev.stopPropagation();
        } else if (keyCode === 13) { // space enter选中
          // 如果按空格或回车键 触发点击事件
          this.handleClick();
        } else if ([9, 27].indexOf(keyCode) > -1) { // tab || esc
          // 如果按tab 或者esc键 隐藏组件
          this.hide();
        }
      },
      handleItemKeyDown(ev) {
        const keyCode = ev.keyCode;
        const target = ev.target;
        const currentIndex = this.menuItemsArray.indexOf(target);
        const max = this.menuItemsArray.length - 1;
        let nextIndex;
        if ([38, 40].indexOf(keyCode) > -1) { // up/down
          if (keyCode === 38) { // up
            nextIndex = currentIndex !== 0 ? currentIndex - 1 : 0;
          } else { // down
            nextIndex = currentIndex < max ? currentIndex + 1 : max;
          }
          this.removeTabindex();
          this.resetTabindex(this.menuItems[nextIndex]);
          this.menuItems[nextIndex].focus();
          ev.preventDefault();
          ev.stopPropagation();
        } else if (keyCode === 13) { // enter选中
          this.triggerElmFocus();
          target.click();
          if (this.hideOnClick) { // click关闭
            this.visible = false;
          }
        } else if ([9, 27].indexOf(keyCode) > -1) { // tab // esc
          this.hide();
          this.triggerElmFocus();
        }
      },
      resetTabindex(ele) { // 下次tab时组件聚焦元素
        this.removeTabindex();
        ele.setAttribute('tabindex', '0'); // 下次期望的聚焦元素
      },
      removeTabindex() {
        // 触发元素的tabindex -1
        this.triggerElm.setAttribute('tabindex', '-1');
        // 菜单项数组的tabindex - 1
        this.menuItemsArray.forEach((item) => {
          item.setAttribute('tabindex', '-1');
        });
      },
      // 初始化属性
      initAria() {
        this.dropdownElm.setAttribute('id', this.listId);
        this.triggerElm.setAttribute('aria-haspopup', 'list');
        this.triggerElm.setAttribute('aria-controls', this.listId);

        if (!this.splitButton) { // 自定义
          this.triggerElm.setAttribute('role', 'button');
          this.triggerElm.setAttribute('tabindex', this.tabindex);
          this.triggerElm.setAttribute('class', (this.triggerElm.getAttribute('class') || '') + ' el-dropdown-selfdefine'); // 控制
        }
      },
      initEvent() {
        let { trigger, show, hide, handleClick, splitButton, handleTriggerKeyDown, handleItemKeyDown } = this;
        // 触发元素
        this.triggerElm = splitButton
          ? this.$refs.trigger.$el
          : this.$slots.default[0].elm;

        let dropdownElm = this.dropdownElm;

        // 给触发元素添加监听器
        this.triggerElm.addEventListener('keydown', handleTriggerKeyDown); // triggerElm keydown
        dropdownElm.addEventListener('keydown', handleItemKeyDown, true); // item keydown
        // 控制自定义元素的样式
        if (!splitButton) {
          this.triggerElm.addEventListener('focus', () => {
            this.focusing = true;
          });
          this.triggerElm.addEventListener('blur', () => {
            this.focusing = false;
          });
          this.triggerElm.addEventListener('click', () => {
            this.focusing = false;
          });
        }
        // 如果触发方式为悬浮触发
        if (trigger === 'hover') {
          // 鼠标移入时，显示
          this.triggerElm.addEventListener('mouseenter', show);
          // 鼠标移出时，隐藏
          this.triggerElm.addEventListener('mouseleave', hide);
          dropdownElm.addEventListener('mouseenter', show);
          dropdownElm.addEventListener('mouseleave', hide);
        } else if (trigger === 'click') {
          this.triggerElm.addEventListener('click', handleClick);
        }
      },
      // 菜单项点击时
      handleMenuItemClick(command, instance) {
        // 下拉菜单默认在点击菜单项后会被隐藏，将hide-on-click属性默认为false可以关闭此功能
        if (this.hideOnClick) {
          this.visible = false;
        }
        // 点击菜单项触发的事件回调
        this.$emit('command', command, instance);
      },
      triggerElmFocus() {
        this.triggerElm.focus && this.triggerElm.focus();
      },
      initDomOperation() {
        this.dropdownElm = this.popperElm;
        this.menuItems = this.dropdownElm.querySelectorAll("[tabindex='-1']");
        this.menuItemsArray = [].slice.call(this.menuItems);

        this.initEvent();
        this.initAria();
      }
    },

    render(h) {
      let { hide, splitButton, type, dropdownSize, disabled } = this;

      const handleMainButtonClick = (event) => {
        this.$emit('click', event);
        hide();
      };
      // 触发事件的元素
      let triggerElm = null;
      // 如果 下拉触发元素呈现为按钮组
      if (splitButton) {
        triggerElm = <el-button-group>
          <el-button type={type} size={dropdownSize} nativeOn-click={handleMainButtonClick} disabled={disabled}>
            {this.$slots.default}
          </el-button>
          <el-button ref="trigger" type={type} size={dropdownSize} class="el-dropdown__caret-button" disabled={disabled}>
            <i class="el-dropdown__icon el-icon-arrow-down"></i>
          </el-button>
        </el-button-group>;
      } else {
        triggerElm = this.$slots.default;
        const vnodeData = triggerElm[0].data || {};
        let { attrs = {} } = vnodeData;
        // 如果当前组件禁用 且vnodeData的属性未禁用 ，修改为禁用
        if (disabled && !attrs.disabled) {
          attrs.disabled = true;
          vnodeData.attrs = attrs;
        }
      }
      // 菜单元素
      const menuElm = disabled ? null : this.$slots.dropdown;

      return (
        <div class="el-dropdown" v-clickoutside={hide} aria-disabled={disabled}>
          {triggerElm}
          {menuElm}
        </div>
      );
    }
  };
</script>
