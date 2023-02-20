<script>
  import ElCollapseTransition from 'element-ui/src/transitions/collapse-transition';
  import menuMixin from './menu-mixin';
  import Emitter from 'element-ui/src/mixins/emitter';
  import Popper from 'element-ui/src/utils/vue-popper';

  const poperMixins = {
    props: {
      transformOrigin: {
        type: [Boolean, String],
        default: false
      },
      offset: Popper.props.offset,
      boundariesPadding: Popper.props.boundariesPadding,
      popperOptions: Popper.props.popperOptions
    },
    data: Popper.data,
    methods: Popper.methods,
    beforeDestroy: Popper.beforeDestroy,
    deactivated: Popper.deactivated
  };

  export default {
    name: 'ElSubmenu',

    componentName: 'ElSubmenu',

    mixins: [menuMixin, Emitter, poperMixins],

    components: { ElCollapseTransition },

    props: {
      // 唯一标志 string/null
      index: {
        type: String,
        required: true
      },
      // 展开 sub-menu 的延时
      showTimeout: {
        type: Number,
        default: 300
      },
      // 收起 sub-menu 的延时
      hideTimeout: {
        type: Number,
        default: 300
      },
      // 弹出菜单的自定义类名
      popperClass: String,
      // 是否禁用
      disabled: Boolean,
      // 是否将弹出菜单插入至 body 元素。在菜单的定位出现问题时，可尝试修改该属性
      // 一级子菜单：true / 非一级子菜单：false
      popperAppendToBody: {
        type: Boolean,
        default: undefined
      }
    },

    data() {
      return {
        popperJS: null,
        timeout: null,
        items: {},
        submenus: {},
        mouseInChild: false
      };
    },
    watch: {
      opened(val) {
        // 如果是菜单弹出
        if (this.isMenuPopup) {
          this.$nextTick(_ => {
            // 更新弹出层
            this.updatePopper();
          });
        }
      }
    },
    computed: {
      // popper option
      appendToBody() {
        // 如果插入到body是undefined, 根据是不是第一级菜单判断是否插入到body,
        // 否则根据配置
        return this.popperAppendToBody === undefined
          ? this.isFirstLevel
          : this.popperAppendToBody;
      },
      menuTransitionName() {
        return this.rootMenu.collapse ? 'el-zoom-in-left' : 'el-zoom-in-top';
      },
      // 已打开
      opened() {
        // 如果当前根菜单的 打开的菜单数组中包含了当前菜单的索引，则已打开
        return this.rootMenu.openedMenus.indexOf(this.index) > -1;
      },
      active() {
        let isActive = false;
        const submenus = this.submenus;
        const items = this.items;

        // 遍历所有的菜单
        Object.keys(items).forEach(index => {
          // 如果存在 一个激活项，设置为激活
          if (items[index].active) {
            isActive = true;
          }
        });

        // 遍历所有的二级菜单，如果有一个二级菜单激活，设置为激活
        Object.keys(submenus).forEach(index => {
          if (submenus[index].active) {
            isActive = true;
          }
        });

        // 返回是否激活
        return isActive;
      },
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
      isMenuPopup() {
        return this.rootMenu.isMenuPopup;
      },
      titleStyle() {
        if (this.mode !== 'horizontal') {
          return {
            color: this.textColor
          };
        }
        return {
          borderBottomColor: this.active
            ? (this.rootMenu.activeTextColor ? this.activeTextColor : '')
            : 'transparent',
          color: this.active
            ? this.activeTextColor
            : this.textColor
        };
      },
      isFirstLevel() {
        let isFirstLevel = true;
        // 获取当前组件的父组件
        let parent = this.$parent;
        // 如果父组件存在，且父组件不是根组件
        while (parent && parent !== this.rootMenu) {
          // 如果父组件的名称是 ['ElSubmenu', 'ElMenuItemGroup']
          if (['ElSubmenu', 'ElMenuItemGroup'].indexOf(parent.$options.componentName) > -1) {
            // 不是一级菜单 ，跳出循环
            isFirstLevel = false;
            break;
          } else {
            // 否则继续找父级的父组件，继续遍历
            parent = parent.$parent;
          }
        }
        // 返回是不是一级菜单
        return isFirstLevel;
      }
    },
    methods: {
      handleCollapseToggle(value) {
        if (value) {
          // 执行初始化弹出层方法
          this.initPopper();
        } else {
          // 执行组件的销毁方法
          this.doDestroy();
        }
      },
      addItem(item) {
        this.$set(this.items, item.index, item);
      },
      removeItem(item) {
        delete this.items[item.index];
      },
      addSubmenu(item) {
        this.$set(this.submenus, item.index, item);
      },
      removeSubmenu(item) {
        delete this.submenus[item.index];
      },
      handleClick() {
        const { rootMenu, disabled } = this;
        if (
          (rootMenu.menuTrigger === 'hover' && rootMenu.mode === 'horizontal') ||
          (rootMenu.collapse && rootMenu.mode === 'vertical') ||
          disabled
        ) {
          return;
        }
        this.dispatch('ElMenu', 'submenu-click', this);
      },
      handleMouseenter(event, showTimeout = this.showTimeout) {

        if (!('ActiveXObject' in window) && event.type === 'focus' && !event.relatedTarget) {
          return;
        }
        const { rootMenu, disabled } = this;
        if (
          (rootMenu.menuTrigger === 'click' && rootMenu.mode === 'horizontal') ||
          (!rootMenu.collapse && rootMenu.mode === 'vertical') ||
          disabled
        ) {
          return;
        }
        this.dispatch('ElSubmenu', 'mouse-enter-child');
        clearTimeout(this.timeout);
        this.timeout = setTimeout(() => {
          this.rootMenu.openMenu(this.index, this.indexPath);
        }, showTimeout);

        if (this.appendToBody) {
          this.$parent.$el.dispatchEvent(new MouseEvent('mouseenter'));
        }
      },
      handleMouseleave(deepDispatch = false) {
        const {rootMenu} = this;
        if (
          (rootMenu.menuTrigger === 'click' && rootMenu.mode === 'horizontal') ||
          (!rootMenu.collapse && rootMenu.mode === 'vertical')
        ) {
          return;
        }
        this.dispatch('ElSubmenu', 'mouse-leave-child');
        clearTimeout(this.timeout);
        this.timeout = setTimeout(() => {
          !this.mouseInChild && this.rootMenu.closeMenu(this.index);
        }, this.hideTimeout);

        if (this.appendToBody && deepDispatch) {
          if (this.$parent.$options.name === 'ElSubmenu') {
            this.$parent.handleMouseleave(true);
          }
        }
      },
      handleTitleMouseenter() {
        if (this.mode === 'horizontal' && !this.rootMenu.backgroundColor) return;
        const title = this.$refs['submenu-title'];
        title && (title.style.backgroundColor = this.rootMenu.hoverBackground);
      },
      handleTitleMouseleave() {
        if (this.mode === 'horizontal' && !this.rootMenu.backgroundColor) return;
        const title = this.$refs['submenu-title'];
        title && (title.style.backgroundColor = this.rootMenu.backgroundColor || '');
      },
      updatePlacement() {
        // 当前位置= 如果模式是水平 且 是第一级菜单 则在底部开始的地方弹出 ，否则在右侧开始的地方弹出
        this.currentPlacement = this.mode === 'horizontal' && this.isFirstLevel
          ? 'bottom-start'
          : 'right-start';
      },
      initPopper() {
        this.referenceElm = this.$el;
        this.popperElm = this.$refs.menu;
        this.updatePlacement();
      }
    },
    created() {
      // 在created中挂载监听事件
      this.$on('toggle-collapse', this.handleCollapseToggle);
      this.$on('mouse-enter-child', () => {
        this.mouseInChild = true;
        clearTimeout(this.timeout);
      });
      this.$on('mouse-leave-child', () => {
        this.mouseInChild = false;
        clearTimeout(this.timeout);
      });
    },
    mounted() {
      // 挂载时，将当前组件挂载到父级菜单和根菜单
      this.parentMenu.addSubmenu(this);
      this.rootMenu.addSubmenu(this);
      // 初始化弹出层
      this.initPopper();
    },
    beforeDestroy() {
      this.parentMenu.removeSubmenu(this);
      this.rootMenu.removeSubmenu(this);
    },
    render(h) {
      const {
        active,
        opened,
        paddingStyle,
        titleStyle,
        backgroundColor,
        rootMenu,
        currentPlacement,
        menuTransitionName,
        mode,
        disabled,
        popperClass,
        $slots,
        isFirstLevel
      } = this;

      // 弹出的菜单 el-menu--${mode} popperClass
      // el-menu el-menu--popup
      const popupMenu = (
        <transition name={menuTransitionName}>
          <div
            ref="menu"
            v-show={opened}
            class={[`el-menu--${mode}`, popperClass]}
            on-mouseenter={($event) => this.handleMouseenter($event, 100)}
            on-mouseleave={() => this.handleMouseleave(true)}
            on-focus={($event) => this.handleMouseenter($event, 100)}>
            <ul
              role="menu"
              class={['el-menu el-menu--popup', `el-menu--popup-${currentPlacement}`]}
              style={{ backgroundColor: rootMenu.backgroundColor || '' }}>
              {$slots.default}
            </ul>
          </div>
        </transition>
      );

      // 行内菜单 el-menu el-menu--inline
      const inlineMenu = (
        <el-collapse-transition>
          <ul
            role="menu"
            class="el-menu el-menu--inline"
            v-show={opened}
            style={{ backgroundColor: rootMenu.backgroundColor || '' }}>
            {$slots.default}
          </ul>
        </el-collapse-transition>
      );

      // 二级菜单的标题图标
      const submenuTitleIcon = (
        rootMenu.mode === 'horizontal' && isFirstLevel || // 如果是水平 并且是 一级菜单 向下
        rootMenu.mode === 'vertical' && !rootMenu.collapse // 如果是垂直 且 根菜单没有折叠 向下
      ) ? 'el-icon-arrow-down' : 'el-icon-arrow-right';

      // el-submenu
      // el-submenu__title
      // el-submenu__icon-arrow
      return (
        <li
          class={{
            'el-submenu': true,
            'is-active': active,
            'is-opened': opened,
            'is-disabled': disabled
          }}
          role="menuitem"
          aria-haspopup="true"
          aria-expanded={opened}
          on-mouseenter={this.handleMouseenter}
          on-mouseleave={() => this.handleMouseleave(false)}
          on-focus={this.handleMouseenter}
        >
          <div
            class="el-submenu__title"
            ref="submenu-title"
            on-click={this.handleClick}
            on-mouseenter={this.handleTitleMouseenter}
            on-mouseleave={this.handleTitleMouseleave}
            style={[paddingStyle, titleStyle, { backgroundColor }]}
          >
            {$slots.title}
            <i class={[ 'el-submenu__icon-arrow', submenuTitleIcon ]}></i>
          </div>
          {this.isMenuPopup ? popupMenu : inlineMenu}
        </li>
      );
    }
  };
</script>
