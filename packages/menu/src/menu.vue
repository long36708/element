<script type="text/jsx">
  import emitter from 'element-ui/src/mixins/emitter';
  import Migrating from 'element-ui/src/mixins/migrating';
  import Menubar from 'element-ui/src/utils/menu/aria-menubar';
  import { addClass, removeClass, hasClass } from 'element-ui/src/utils/dom';

  export default {
    name: 'ElMenu',

    render (h) {
      const component = (
        <ul
          role="menubar"
          key={ +this.collapse }
          style={{ backgroundColor: this.backgroundColor || '' }}
          class={{
            'el-menu--horizontal': this.mode === 'horizontal', //水平
            'el-menu--collapse': this.collapse,
            "el-menu": true
          }}
        >
          { this.$slots.default }
        </ul>
      );

      if (this.collapseTransition) {
        return (
          <el-menu-collapse-transition>
            { component }
          </el-menu-collapse-transition>
        );
      } else {
        return component;
      }
    },

    componentName: 'ElMenu',

    mixins: [emitter, Migrating],

    provide() {
      return {
        rootMenu: this
      };
    },

    components: {
      'el-menu-collapse-transition': {
        functional: true,
        render(createElement, context) {
          const data = {
            props: {
              mode: 'out-in'
            },
            on: {
              beforeEnter(el) {
                el.style.opacity = 0.2;
              },

              enter(el) {
                addClass(el, 'el-opacity-transition');
                el.style.opacity = 1;
              },

              afterEnter(el) {
                removeClass(el, 'el-opacity-transition');
                el.style.opacity = '';
              },

              beforeLeave(el) {
                if (!el.dataset) el.dataset = {};

                if (hasClass(el, 'el-menu--collapse')) {
                  removeClass(el, 'el-menu--collapse');
                  el.dataset.oldOverflow = el.style.overflow;
                  el.dataset.scrollWidth = el.clientWidth;
                  addClass(el, 'el-menu--collapse');
                } else {
                  addClass(el, 'el-menu--collapse');
                  el.dataset.oldOverflow = el.style.overflow;
                  el.dataset.scrollWidth = el.clientWidth;
                  removeClass(el, 'el-menu--collapse');
                }

                el.style.width = el.scrollWidth + 'px';
                el.style.overflow = 'hidden';
              },

              leave(el) {
                addClass(el, 'horizontal-collapse-transition');
                el.style.width = el.dataset.scrollWidth + 'px';
              }
            }
          };
          return createElement('transition', data, context.children);
        }
      }
    },

    props: {
      //	模式
      mode: {
        type: String,
        default: 'vertical'
      },
      // 当前激活菜单的 index
      defaultActive: {
        type: String,
        default: ''
      },
      // 当前打开的 sub-menu 的 index 的数组
      defaultOpeneds: Array,
      // 是否只保持一个子菜单的展开
      uniqueOpened: Boolean,
      // 是否使用 vue-router 的模式，启用该模式会在激活导航时以 index 作为 path 进行路由跳转
      router: Boolean,
      // 子菜单打开的触发方式(只在 mode 为 horizontal 时有效) 	hover / click
      menuTrigger: {
        type: String,
        default: 'hover'
      },
      // 是否水平折叠收起菜单（仅在 mode 为 vertical 时可用）
      collapse: Boolean,
      // 菜单的背景色（仅支持 hex 格式）
      backgroundColor: String,
      // 菜单的文字颜色（仅支持 hex 格式）
      textColor: String,
      // 当前激活菜单的文字颜色（仅支持 hex 格式）
      activeTextColor: String,
      // 是否开启折叠动画
      collapseTransition: {
        type: Boolean,
        default: true
      }
    },
    data() {
      return {
        activeIndex: this.defaultActive,
        openedMenus: (this.defaultOpeneds && !this.collapse) ? this.defaultOpeneds.slice(0) : [],
        items: {},
        submenus: {}
      };
    },
    computed: {
      // 悬浮背景色
      hoverBackground() {
        return this.backgroundColor ? this.mixColor(this.backgroundColor, 0.2) : '';
      },
      isMenuPopup() {
        // 如果是水平 或者是垂直且展开
        return this.mode === 'horizontal' || (this.mode === 'vertical' && this.collapse);
      }
    },
    watch: {
      defaultActive(value){
        // 默认值改变，如果默认值在this.items里不存在，设置激活项为null
        if(!this.items[value]){
          this.activeIndex = null
        }
        // 更新激活的索引
        this.updateActiveIndex(value)
      },
      // 当前打开的 sub-menu 的 index 的数组
      defaultOpeneds(value) {
        // 如果不是折叠
        if (!this.collapse) {
          // 打开的菜单 = value
          this.openedMenus = value;
        }
      },

      collapse(value) {
        // 如果是折叠 打开的菜单 = []
        if (value) this.openedMenus = [];
        this.broadcast('ElSubmenu', 'toggle-collapse', value);
      }
    },
    methods: {
      updateActiveIndex(val) {
        // 如果根据传入的val 可以找到对应的item,或者，根据当前激活的索引可以找到item ,或者，直接使用默认激活的值
        const item = this.items[val] || this.items[this.activeIndex] || this.items[this.defaultActive];
        // 如果item存在
        if (item) {
          // 设置激活的索引为 item.index
          this.activeIndex = item.index;
          // 设置 初始化打开菜单
          this.initOpenedMenu();
        } else {
          // 如果找不到对应的item,设置激活的index = null
          this.activeIndex = null;
        }
      },

      // 获取移除配置
      getMigratingConfig() {
        return {
          // 属性移除
          props: {
            'theme': 'theme is removed.'
          }
        };
      },
      // 获取颜色
      getColorChannels(color) {
        color = color.replace('#', '');
        if (/^[0-9a-fA-F]{3}$/.test(color)) {
          color = color.split('');
          for (let i = 2; i >= 0; i--) {
            color.splice(i, 0, color[i]);
          }
          color = color.join('');
        }
        if (/^[0-9a-fA-F]{6}$/.test(color)) {
          return {
            red: parseInt(color.slice(0, 2), 16),
            green: parseInt(color.slice(2, 4), 16),
            blue: parseInt(color.slice(4, 6), 16)
          };
        } else {
          return {
            red: 255,
            green: 255,
            blue: 255
          };
        }
      },
      // 混合颜色
      mixColor(color, percent) {
        let { red, green, blue } = this.getColorChannels(color);
        if (percent > 0) { // shade given color
          red *= 1 - percent;
          green *= 1 - percent;
          blue *= 1 - percent;
        } else { // tint given color
          red += (255 - red) * percent;
          green += (255 - green) * percent;
          blue += (255 - blue) * percent;
        }
        return `rgb(${ Math.round(red) }, ${ Math.round(green) }, ${ Math.round(blue) })`;
      },
      // 添加一项
      addItem(item) {
        this.$set(this.items, item.index, item);
      },
      // 删除一项
      removeItem(item) {
        delete this.items[item.index];
      },
      // 添加二级菜单
      addSubmenu(item) {
        this.$set(this.submenus, item.index, item);
      },
      // 删除二级菜单
      removeSubmenu(item) {
        delete this.submenus[item.index];
      },
      openMenu(index, indexPath) {
        // 获取打开的菜单
        let openedMenus = this.openedMenus;
        // 如果打开的菜单的索引已经包含了 当前传入的索引， 直接返回
        if (openedMenus.indexOf(index) !== -1) return;
        // 将不在该菜单路径下的其余菜单收起
        // collapse all menu that are not under current menu item
        if (this.uniqueOpened) {
          // 获取 当前展开的菜单中 在传入的菜单路径下的菜单 过滤掉，不在该菜单路径下的菜单
          this.openedMenus = openedMenus.filter(index => {
            return indexPath.indexOf(index) !== -1;
          });
        }
        // 当前展开的菜单索引 里填入 传入的索引
        this.openedMenus.push(index);
      },
      // 关闭菜单
      closeMenu(index) {
        // 在打开的菜单中获取传入的索引
        const i = this.openedMenus.indexOf(index);
        // 如果索引存在，删除
        if (i !== -1) {
          this.openedMenus.splice(i, 1);
        }
      },
      handleSubmenuClick(submenu) {
        // 获取二级菜单的索引和索引路径
        const { index, indexPath } = submenu;
        // 若当前索引在打开的菜单中存在，则已经打开
        let isOpened = this.openedMenus.indexOf(index) !== -1;

        // 如果已经打开，则关闭当前索引对应的菜单
        if (isOpened) {
          this.closeMenu(index);
          // 向外发出关闭事件 sub-menu 收起的回调
          // index: 收起的 sub-menu 的 index， indexPath: 收起的 sub-menu 的 index path
          this.$emit('close', index, indexPath);
        } else {
          // 否则，根据当前索引和索引路径 打开菜单
          this.openMenu(index, indexPath);
          // sub-menu 展开的回调
          // index: 打开的 sub-menu 的 index， indexPath: 打开的 sub-menu 的 index path
          this.$emit('open', index, indexPath);
        }
      },
      handleItemClick(item) {
        // 获取点击的菜单的索引和索引路径
        const { index, indexPath } = item;
        // 记录老的激活索引
        const oldActiveIndex = this.activeIndex;
        const hasIndex = item.index !== null;
        // 如果点击的菜单的索引存在，设置为激活的索引
        if (hasIndex) {
          this.activeIndex = item.index;
        }

        // 菜单激活回调
        // index: 选中菜单项的 index, indexPath: 选中菜单项的 index path
        this.$emit('select', index, indexPath, item);

        // 如果是水平模式，或者是折叠
        if (this.mode === 'horizontal' || this.collapse) {
          // 将打开的菜单置空
          this.openedMenus = [];
        }

        // 是否使用 vue-router 的模式，启用该模式会在激活导航时以 index 作为 path 进行路由跳转
        if (this.router && hasIndex) {
          this.routeToItem(item, (error) => {
            // 如果出错了，将当前激活的索引 设置为之前的老索引
            this.activeIndex = oldActiveIndex;
            if (error) {
              // vue-router 3.1.0+ push/replace cause NavigationDuplicated error
              // https://github.com/ElemeFE/element/issues/17044
              // 如果错误名称是 NavigationDuplicated ，直接返回 ；否则打印错误日志
              if (error.name === 'NavigationDuplicated') return
              console.error(error)
            }
          });
        }
      },
      // 初始化展开菜单
      // initialize opened menu
      initOpenedMenu() {
        // 获取当前激活的索引
        const index = this.activeIndex;
        // 根据当前激活的索引，找到激活的菜单项
        const activeItem = this.items[index];
        // 如果激活项不存在，或者是水平模式 或者是折叠 ，直接返回
        if (!activeItem || this.mode === 'horizontal' || this.collapse) return;

        let indexPath = activeItem.indexPath;

        // 展开该菜单项的路径上所有子菜单
        // expand all submenus of the menu item
        indexPath.forEach(index => {
          let submenu = this.submenus[index];
          submenu && this.openMenu(index, submenu.indexPath);
        });
      },
      /**
       *
       * @param item 点击的菜单项
       * @param onError 处理错误的回调
       */
      routeToItem(item, onError) {
        // 获取菜单项的路由或者索引
        let route = item.route || item.index;
        try {
          // 跳转路径
          this.$router.push(route, () => {}, onError);
        } catch (e) {
          console.error(e);
        }
      },
      open(index) {
        // 根据传入的索引在二级菜单中找到对应的索引路径
        const { indexPath } = this.submenus[index.toString()];
        // 根据索引路径打开菜单
        indexPath.forEach(i => this.openMenu(i, indexPath));
      },
      close(index) {
        // 根据传入的索引，关闭菜单
        this.closeMenu(index);
      }
    },
    mounted() {
      // 初始化展开菜单
      this.initOpenedMenu();
      this.$on('item-click', this.handleItemClick);
      this.$on('submenu-click', this.handleSubmenuClick);
      // 如果是水平模式
      if (this.mode === 'horizontal') {
        new Menubar(this.$el); // eslint-disable-line
      }
      // 监听items 变化， 更新激活的索引
      this.$watch('items', this.updateActiveIndex);
    }
  };
</script>
