## 属性可枚举的值

```text
// 设置分割线方向
direction: {
  type: String,
  default: 'horizontal',
  validator(val) {
    return ['horizontal', 'vertical'].indexOf(val) !== -1;
  }
}
```

## 绑定属性和事件：

functional 组件 v-bind="data.attrs" v-on="listeners"

通过v-bind="data.attrs"和v-on="listeners"将父组件传递的属性和事件绑定到根元素上

### 绑定属性，不应是 v-bind="$attrs"吗？

### 解释

在这段代码中，`v-bind="data.attrs"` 和 `v-bind="$attrs"` 的作用是不同的。具体解释如下：

1. **`v-bind="data.attrs"`**：
    - 这里的 `data.attrs` 是由 Vue 的 functional 组件上下文提供的对象，包含了父组件传递的所有属性（props、class、style 等）。
    - 通过这种方式，可以确保所有父组件传递的属性都能正确绑定到当前元素上。

2. **`v-bind="$attrs"`**：
    - `$attrs` 是 Vue 提供的一个特殊变量，包含父组件传递的所有非 prop 属性（如 class、style、事件监听器等），但不包括 props。
    - 它通常用于将这些属性传递给子组件或更深层次的组件。

### 选择哪一个？

- 在 functional 组件中，使用 `data.attrs` 是正确的做法，因为 functional 组件没有实例，所以不能直接使用 `$attrs`。
- `data` 对象包含了所有需要的信息，包括属性和事件监听器。

- 如果是在普通组件中，`v-bind="$attrs"` 可以用来传递非 prop 属性，但这不是 functional 组件的标准用法。

### 结论

在你提供的代码中，`v-bind="data.attrs"` 是正确的写法，因为它符合 functional 组件的使用规范。

如果你尝试在 functional 组件中使用 `v-bind="$attrs"`，会导致错误，因为 functional 组件没有实例，无法访问 `$attrs`。

### 总结

- **functional 组件**：使用 `data.attrs` 来绑定属性和事件。
- **普通组件**：可以使用 `$attrs` 来传递非 prop 属性，但在 functional 组件中应使用 `data.attrs`。

## 什么是函数式组件，什么场景使用？

### 函数式组件简介

**函数式组件（Functional Component）** 是 Vue 中的一种特殊类型的组件，它没有实例，也不包含响应式数据、生命周期钩子或状态管理。

函数式组件的主要特点是它们是无状态的（stateless）和无实例的（instance-less），因此性能更高，适合用于简单的展示型组件。

#### 函数式组件的特点：

1. **无状态**：函数式组件不维护任何内部状态。
2. **无实例**：不会创建 Vue 实例，因此没有 `this` 上下文。
3. **纯渲染逻辑**：只负责根据传入的 props 和 children 渲染 DOM 结构。
4. **高性能**：由于没有实例开销，性能更好，适合频繁更新的场景。

### 使用场景

函数式组件适用于以下几种场景：

1. **简单展示型组件**：
    - 仅用于展示内容，不需要维护状态或处理复杂逻辑。例如分割线、图标、标签等。

2. **高频率更新的组件**：
    - 需要频繁更新但不涉及复杂的状态管理。例如列表项、表格行等。

3. **递归组件**：
    - 当组件需要递归调用自身时，函数式组件可以避免不必要的实例化开销。例如树形结构的节点。

4. **辅助性组件**：
    - 作为其他组件的辅助部分，提供一些简单的功能或样式封装。例如布局组件、装饰器组件等。

5. **性能优化**：
    - 在需要优化性能的场景中，使用函数式组件可以减少内存占用和渲染时间。

### 示例代码

```vue

<template functional>
  <div
      v-bind="data.attrs"
      v-on="listeners"
      :class="[data.staticClass, 'el-divider', `el-divider--${props.direction}`]"
  >
    <div
        v-if="slots().default && props.direction !== 'vertical'"
        :class="['el-divider__text', `is-${props.contentPosition}`]"
    >
      <slot/>
    </div>
  </div>
</template>

<script>
  export default {
    props: {
      direction: {
        type: String,
        default: 'horizontal',
        validator(val) {
          return ['horizontal', 'vertical'].indexOf(val) !== -1;
        }
      },
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
```

### 总结

- **函数式组件**：适用于简单展示型组件、高频率更新的组件、递归组件、辅助性组件以及需要性能优化的场景。
- **普通组件**：适用于需要维护状态、处理复杂逻辑或使用生命周期钩子的场景。

通过合理选择组件类型，可以更好地优化应用性能并简化代码逻辑。

