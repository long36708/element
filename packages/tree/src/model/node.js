import objectAssign from 'element-ui/src/utils/merge';
import { markNodeData, NODE_KEY } from './util';
import { arrayFindIndex } from 'element-ui/src/utils/util';

export const getChildState = node => {
  let all = true; // 所有节点都选中了
  let none = true; // 所有节点都没选中
  let allWithoutDisable = true; // 所有均未禁用
  // 遍历传入的子节点们
  for (let i = 0, j = node.length; i < j; i++) {
    const n = node[i];
    // 当前正在遍历的节点 未选中或是半选中
    if (n.checked !== true || n.indeterminate) {
      // 非全选
      all = false;
      // 如果未禁用
      if (!n.disabled) {
        allWithoutDisable = false;
      }
    }
    // 如果有一个节点选中或者半选中 ，则 所有节点都没选中 = 假
    if (n.checked !== false || n.indeterminate) {
      none = false;
    }
  }

  // 半选中 ：如果不是所有节点都选中了，也不是所有节点都没选中 则一定是半选中状态！！！
  return { all, none, allWithoutDisable, half: !all && !none };
};

const reInitChecked = function(node) {
  // 如果传入节点的子节点长度为0 ，直接return
  if (node.childNodes.length === 0) return;

  // 获取子节点的状态，所有，无，半选中
  const {all, none, half} = getChildState(node.childNodes);
  // 若所有子节点都选中了，则该节点也选中
  if (all) {
    node.checked = true;
    node.indeterminate = false;
  } else if (half) {
    // 如果是半选中
    node.checked = false;
    node.indeterminate = true;
  } else if (none) {
    // 否则未选中
    node.checked = false;
    node.indeterminate = false;
  }

  const parent = node.parent;
  if (!parent || parent.level === 0) return;

  // 在显示复选框的情况下，是否严格的遵循父子不互相关联的做法，默认为 false
  // 如果父子互相关联
  if (!node.store.checkStrictly) {
    // 重新初始化选中父级
    reInitChecked(parent);
  }
};

// 获取节点的属性值
const getPropertyFromData = function(node, prop) {
  // 根据节点的store获取节点所有的属性
  const props = node.store.props;
  // 获取节点的data
  const data = node.data || {};
  // 在节点属性中获取传入的指定属性的属性值
  const config = props[prop];

  if (typeof config === 'function') {
    // 如果属性值是个函数
    return config(data, node);
  } else if (typeof config === 'string') {
    // 如果属性值是个字符串 ，返回节点data中的属性值
    return data[config];
  } else if (typeof config === 'undefined') {
    const dataProp = data[prop];
    return dataProp === undefined ? '' : dataProp;
  }
};

let nodeIdSeed = 0;

export default class Node {
  constructor(options) {
    // 节点id
    this.id = nodeIdSeed++;
    // 节点文字
    this.text = null;
    // 是否选中了
    this.checked = false;
    // 是否半选中
    this.indeterminate = false;
    this.data = null;
    // 是否展开了
    this.expanded = false;
    // 父节点
    this.parent = null;
    // 是否可见
    this.visible = true;
    // 是否是当前节点
    this.isCurrent = false;

    // 循环注册options 的属性
    for (let name in options) {
      if (options.hasOwnProperty(name)) {
        this[name] = options[name];
      }
    }

    // internal
    this.level = 0;
    this.loaded = false;
    this.childNodes = [];
    this.loading = false;

    // 如果父节点存在，当前节点级别为父节点级别 +1
    if (this.parent) {
      this.level = this.parent.level + 1;
    }

    const store = this.store;
    if (!store) {
      throw new Error('[Node]store is required!');
    }
    // 在store中注册当前节点
    store.registerNode(this);

    const props = store.props;
    if (props && typeof props.isLeaf !== 'undefined') {
      const isLeaf = getPropertyFromData(this, 'isLeaf');
      if (typeof isLeaf === 'boolean') {
        this.isLeafByUser = isLeaf;
      }
    }

    if (store.lazy !== true && this.data) {
      // 如果不是懒加载，设置data
      this.setData(this.data);

      // 如果默认展开所有，设置当前节点展开
      if (store.defaultExpandAll) {
        this.expanded = true;
      }
    } else if (this.level > 0 && store.lazy && store.defaultExpandAll) {
      // 如果是懒加载
      this.expand();
    }
    // 如果data不是个数组
    if (!Array.isArray(this.data)) {
      // 标记节点不可读写
      markNodeData(this, this.data);
    }
    if (!this.data) return;
    const defaultExpandedKeys = store.defaultExpandedKeys;
    const key = store.key;
    // 如果当前节点的key 在默认展开的keys中
    if (key && defaultExpandedKeys && defaultExpandedKeys.indexOf(this.key) !== -1) {
      // 展开，自动展开父级节点
      this.expand(null, store.autoExpandParent);
    }

    // 如果当前节点 等于 树当前选中的节点
    if (key && store.currentNodeKey !== undefined && this.key === store.currentNodeKey) {
      store.currentNode = this;
      store.currentNode.isCurrent = true;
    }

    // 如果是懒加载
    if (store.lazy) {
      // 初始化默认选中的树节点
      store._initDefaultCheckedNode(this);
    }

    // 更新节点状态
    this.updateLeafState();
  }

  setData(data) {
    // 如果data不是数组 ,标记节点data
    if (!Array.isArray(data)) {
      markNodeData(this, data);
    }

    this.data = data;
    this.childNodes = [];

    let children;
    // 如果是第一级，且data是数组
    if (this.level === 0 && this.data instanceof Array) {
      children = this.data;
    } else {
      children = getPropertyFromData(this, 'children') || [];
    }

    for (let i = 0, j = children.length; i < j; i++) {
      // 当前节点插入孩子
      this.insertChild({ data: children[i] });
    }
  }

  get label() {
    return getPropertyFromData(this, 'label');
  }

  get key() {
    const nodeKey = this.store.key;
    if (this.data) return this.data[nodeKey];
    return null;
  }

  get disabled() {
    return getPropertyFromData(this, 'disabled');
  }

  get nextSibling() {
    const parent = this.parent;
    if (parent) {
      const index = parent.childNodes.indexOf(this);
      if (index > -1) {
        return parent.childNodes[index + 1];
      }
    }
    return null;
  }

  get previousSibling() {
    const parent = this.parent;
    if (parent) {
      const index = parent.childNodes.indexOf(this);
      if (index > -1) {
        return index > 0 ? parent.childNodes[index - 1] : null;
      }
    }
    return null;
  }

  contains(target, deep = true) {
    const walk = function(parent) {
      const children = parent.childNodes || [];
      let result = false;
      for (let i = 0, j = children.length; i < j; i++) {
        const child = children[i];
        if (child === target || (deep && walk(child))) {
          result = true;
          break;
        }
      }
      return result;
    };

    return walk(this);
  }

  remove() {
    const parent = this.parent;
    if (parent) {
      parent.removeChild(this);
    }
  }

  insertChild(child, index, batch) {
    if (!child) throw new Error('insertChild error: child is required.');

    if (!(child instanceof Node)) {
      // 如果不是批量
      if (!batch) {
        const children = this.getChildren(true) || [];
        if (children.indexOf(child.data) === -1) {
          if (typeof index === 'undefined' || index < 0) {
            children.push(child.data);
          } else {
            children.splice(index, 0, child.data);
          }
        }
      }
      objectAssign(child, {
        parent: this,
        store: this.store
      });
      child = new Node(child);
    }
    // 孩子的级别 = 当前节点的级别 +1
    child.level = this.level + 1;

    // 如果索引未指定，直接放到孩子里
    if (typeof index === 'undefined' || index < 0) {
      this.childNodes.push(child);
    } else {
      // 如果索引指定了，插入到指定的索引
      this.childNodes.splice(index, 0, child);
    }

    this.updateLeafState();
  }

  insertBefore(child, ref) {
    let index;
    if (ref) {
      index = this.childNodes.indexOf(ref);
    }
    // 插入孩子，指定插入的索引
    this.insertChild(child, index);
  }

  insertAfter(child, ref) {
    let index;
    if (ref) {
      index = this.childNodes.indexOf(ref);
      // 如果索引存在，索引加1
      if (index !== -1) index += 1;
    }
    // 插入孩子，指定插入的索引
    this.insertChild(child, index);
  }

  removeChild(child) {
    const children = this.getChildren() || [];
    const dataIndex = children.indexOf(child.data);
    if (dataIndex > -1) {
      children.splice(dataIndex, 1);
    }

    const index = this.childNodes.indexOf(child);

    if (index > -1) {
      this.store && this.store.deregisterNode(child);
      child.parent = null;
      this.childNodes.splice(index, 1);
    }

    // 更新叶子节点状态
    this.updateLeafState();
  }

  // 根据参数data 移除子节点
  removeChildByData(data) {
    let targetNode = null;

    // 遍历当前节点的所有孩子节点，如果孩子节点的data和传入的data相等，即找到了目标节点，直接break
    for (let i = 0; i < this.childNodes.length; i++) {
      if (this.childNodes[i].data === data) {
        targetNode = this.childNodes[i];
        break;
      }
    }

    // 如果找到了目标节点，直接移除子节点
    if (targetNode) {
      this.removeChild(targetNode);
    }
  }

  expand(callback, expandParent) {
    const done = () => {
      // 如果展开父级
      if (expandParent) {
        // 当前节点的父节点
        let parent = this.parent;
        // 如果父节点的等级大于0 ，则设置父节点展开，直到父节点的级别等于0
        while (parent.level > 0) {
          parent.expanded = true;
          parent = parent.parent;
        }
      }
      // 设置当前节点展开
      this.expanded = true;
      if (callback) callback();
    };

    // 如果应该加载数据
    if (this.shouldLoadData()) {
      // 加载数据
      this.loadData((data) => {
        if (data instanceof Array) {
          // 如果当前节点选中
          if (this.checked) {
            this.setChecked(true, true);
          } else if (!this.store.checkStrictly) {
            // 在显示复选框的情况下，是否严格的遵循父子不互相关联的做法，默认为 false
            reInitChecked(this);
          }
          done();
        }
      });
    } else {
      done();
    }
  }

  doCreateChildren(array, defaultProps = {}) {
    // 遍历数组的每一项 在当前节点插入孩子节点
    array.forEach((item) => {
      this.insertChild(objectAssign({ data: item }, defaultProps), undefined, true);
    });
  }

  collapse() {
    this.expanded = false;
  }

  shouldLoadData() {
    // 如果是懒加载 且 正在load 未完成loaded
    return this.store.lazy === true && this.store.load && !this.loaded;
  }

  updateLeafState() {
    // 如果是懒加载且 未加载完成 是用户指定的叶子
    if (this.store.lazy === true && this.loaded !== true && typeof this.isLeafByUser !== 'undefined') {
      this.isLeaf = this.isLeafByUser;
      return;
    }
    const childNodes = this.childNodes;
    // 如果不是懒加载 或者 懒加载完成加载
    if (!this.store.lazy || (this.store.lazy === true && this.loaded === true)) {
      // 如果当前节点的子节点不存在 或者长度为0 则是叶子节点 直接返回
      this.isLeaf = !childNodes || childNodes.length === 0;
      return;
    }
    // 否则不是叶子节点
    this.isLeaf = false;
  }

  setChecked(value, deep, recursion, passValue) {
    // 是否是半选中
    this.indeterminate = value === 'half';
    // 是否选中
    this.checked = value === true;

    // 在显示复选框的情况下，是否严格的遵循父子不互相关联的做法，默认为 false
    // 若严格父子不关联，直接返回
    if (this.store.checkStrictly) return;

    if (!(this.shouldLoadData() && !this.store.checkDescendants)) {
      let { all, allWithoutDisable } = getChildState(this.childNodes);

      // 若不是叶子节点 且 不是所有孩子都选中，所有都未禁用
      if (!this.isLeaf && (!all && allWithoutDisable)) {
        // 当前 未选中
        this.checked = false;
        value = false;
      }
      // 检查后代
      const handleDescendants = () => {
        if (deep) {
          const childNodes = this.childNodes;
          for (let i = 0, j = childNodes.length; i < j; i++) {
            const child = childNodes[i];
            passValue = passValue || value !== false;
            const isCheck = child.disabled ? child.checked : passValue;
            child.setChecked(isCheck, deep, true, passValue);
          }
          const { half, all } = getChildState(childNodes);
          // 如果不是所有都选中
          if (!all) {
            this.checked = all;
            this.indeterminate = half;
          }
        }
      };

      // 如果应该加载data
      if (this.shouldLoadData()) {
        // Only work on lazy load data.
        this.loadData(() => {
          // 检查后代
          handleDescendants();
          // 重新初始化选中
          reInitChecked(this);
        }, {
          checked: value !== false
        });
        return;
      } else {
        // 检查后代
        handleDescendants();
      }
    }

    const parent = this.parent;
    // 若当前节点的父节点不存在或者父节点的级别是0 ，直接返回
    if (!parent || parent.level === 0) return;

    // 若不递归，重新初始化选中
    if (!recursion) {
      reInitChecked(parent);
    }
  }

  getChildren(forceInit = false) { // this is data
    if (this.level === 0) return this.data;
    const data = this.data;
    if (!data) return null;

    const props = this.store.props;
    let children = 'children';
    if (props) {
      children = props.children || 'children';
    }

    if (data[children] === undefined) {
      data[children] = null;
    }

    if (forceInit && !data[children]) {
      data[children] = [];
    }

    return data[children];
  }

  updateChildren() {
    const newData = this.getChildren() || [];
    const oldData = this.childNodes.map((node) => node.data);

    const newDataMap = {};
    const newNodes = [];

    newData.forEach((item, index) => {
      const key = item[NODE_KEY];
      const isNodeExists = !!key && arrayFindIndex(oldData, data => data[NODE_KEY] === key) >= 0;
      if (isNodeExists) {
        newDataMap[key] = { index, data: item };
      } else {
        newNodes.push({ index, data: item });
      }
    });

    if (!this.store.lazy) {
      oldData.forEach((item) => {
        if (!newDataMap[item[NODE_KEY]]) this.removeChildByData(item);
      });
    }

    newNodes.forEach(({ index, data }) => {
      this.insertChild({ data }, index);
    });

    this.updateLeafState();
  }

  loadData(callback, defaultProps = {}) {
    // 如果是懒加载，且当前节点未加载完成 且 不是正在加载或默认属性的keys存在
    if (this.store.lazy === true && this.store.load && !this.loaded && (!this.loading || Object.keys(defaultProps).length)) {
      // 正在加载中
      this.loading = true;

      const resolve = (children) => {
        // 加载完成
        this.loaded = true;
        this.loading = false;
        // 孩子节点 为空
        this.childNodes = [];

        // 创建孩子节点
        this.doCreateChildren(children, defaultProps);

        // 更新叶子节点状态
        this.updateLeafState();
        if (callback) {
          callback.call(this, children);
        }
      };

      this.store.load(this, resolve);
    } else {
      if (callback) {
        callback.call(this);
      }
    }
  }
}
