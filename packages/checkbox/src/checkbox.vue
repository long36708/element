<template>
  <label
    class="el-checkbox"
    :class="[
      border && checkboxSize ? 'el-checkbox--' + checkboxSize : '',
      { 'is-disabled': isDisabled },
      { 'is-bordered': border },
      { 'is-checked': isChecked }
    ]"
    :id="id"
  >
    <span class="el-checkbox__input"
      :class="{
        'is-disabled': isDisabled,
        'is-checked': isChecked,
        'is-indeterminate': indeterminate,
        'is-focus': focus
      }"
      :tabindex="indeterminate ? 0 : false"
      :role="indeterminate ? 'checkbox' : false"
      :aria-checked="indeterminate ? 'mixed' : false"
    >
      <span class="el-checkbox__inner"></span>
      <input
        v-if="trueLabel || falseLabel"
        class="el-checkbox__original"
        type="checkbox"
        :aria-hidden="indeterminate ? 'true' : 'false'"
        :name="name"
        :disabled="isDisabled"
        :true-value="trueLabel"
        :false-value="falseLabel"
        v-model="model"
        @change="handleChange"
        @focus="focus = true"
        @blur="focus = false">
      <input
        v-else
        class="el-checkbox__original"
        type="checkbox"
        :aria-hidden="indeterminate ? 'true' : 'false'"
        :disabled="isDisabled"
        :value="label"
        :name="name"
        v-model="model"
        @change="handleChange"
        @focus="focus = true"
        @blur="focus = false">
    </span>
    <span class="el-checkbox__label" v-if="$slots.default || label">
      <slot></slot>
      <template v-if="!$slots.default">{{label}}</template>
    </span>
  </label>
</template>
<script>
  import Emitter from 'element-ui/src/mixins/emitter';

  export default {
    name: 'ElCheckbox',

    mixins: [Emitter],

    inject: {
      elForm: {
        default: ''
      },
      elFormItem: {
        default: ''
      }
    },

    componentName: 'ElCheckbox',

    data() {
      return {
        selfModel: false, // 标识是否是内部维护的 model
        focus: false,
        isLimitExceeded: false
      };
    },

    computed: {
      model: {
        /**
         * 获取当前复选框的值
         *
         * 此方法根据不同的条件返回相应的值：
         * - 如果是复选框组（isGroup为true），则返回store的值
         * - 如果value不为undefined，则返回value的值
         * - 否则，返回selfModel的值
         *
         * @returns {any} 复选框的当前值
         */
        get() {
          return this.isGroup
            ? this.store : this.value !== undefined
              ? this.value : this.selfModel;
        },

        /**
         * 设置当前复选框的值
         *
         * 此方法根据是否是复选框组来处理值的设置：
         * - 如果是复选框组，会检查值的长度是否符合限制条件（min和max）
         *   如果超过限制，则不进行任何操作；如果未超过限制，则派发'input'事件，传递新的值
         * - 如果不是复选框组，直接触发'input'事件，传递新的值，并更新selfModel
         *
         * @param {any} val 新的复选框值
         */
        set(val) {
          if (this.isGroup) {
            this.isLimitExceeded = false;
            (this._checkboxGroup.min !== undefined &&
              val.length < this._checkboxGroup.min &&
              (this.isLimitExceeded = true));

            (this._checkboxGroup.max !== undefined &&
              val.length > this._checkboxGroup.max &&
              (this.isLimitExceeded = true));

            this.isLimitExceeded === false &&
            this.dispatch('ElCheckboxGroup', 'input', [val]);
          } else {
            // 先通知父组件，然后更新内部状态，避免组件内部的状态和父组件传递的状态不同步
            this.$emit('input', val);
            this.selfModel = val;
          }
        }
      },

      /**
       * 检查当前项是否被选中
       *
       * 此函数旨在确定在不同数据类型的情况下，当前项是否应被视为选中
       * 它处理三种情况：布尔值，数组和其它类型（非空且定义良好）
       * 对于布尔值，直接返回其值；对于数组，检查当前标签是否存在于数组中；
       * 对于其他情况，检查模型是否等于trueLabel
       *
       * @returns {Boolean} 根据模型和标签的值，返回当前项是否被选中
       */
      isChecked() {
        // 检查模型是否为布尔值，并直接返回其值
        if ({}.toString.call(this.model) === '[object Boolean]') {
          return this.model;
          // 如果模型为数组，检查当前标签是否存在于数组中
        } else if (Array.isArray(this.model)) {
          return this.model.indexOf(this.label) > -1;
          // 如果模型是非空且已定义的值，检查它是否等于trueLabel
        } else if (this.model !== null && this.model !== undefined) {
          return this.model === this.trueLabel;
        }
      },

      isGroup() {
        let parent = this.$parent;
        while (parent) {
          if (parent.$options.componentName !== 'ElCheckboxGroup') {
            parent = parent.$parent;
          } else {
            this._checkboxGroup = parent;
            return true;
          }
        }
        return false;
      },

      store() {
        return this._checkboxGroup ? this._checkboxGroup.value : this.value;
      },

      /* used to make the isDisabled judgment under max/min props */
      /**
       * 判断是否禁用复选框
       *
       * 此函数通过检查当前复选框组的最大值(max)和最小值(min)设置情况，
       * 以及当前复选框的选中状态和model的长度，来决定是否禁用复选框
       * 禁用的条件为：
       * - 当设置了最大值，且当前选中的复选框数量达到或超过了最大值，且当前复选框未被选中
       * - 当设置了最小值，且当前选中的复选框数量达到或低于最小值，且当前复选框已被选中
       *
       * @returns {boolean} 返回一个布尔值，true表示禁用复选框，false表示不禁用
       */
      isLimitDisabled() {
        const { max, min } = this._checkboxGroup;
        return !!(max || min) &&
          (this.model.length >= max && !this.isChecked) ||
          (this.model.length <= min && this.isChecked);
      },

      /**
       * 判断复选框是否应被禁用。
       *
       * 该方法根据多个条件决定当前复选框是否应该被禁用。
       * 它会考虑复选框组（如果属于一个组）的禁用状态、单个复选框的禁用状态、所属表单（如果有）的禁用状态，以及是否达到了选择项的限制（如果在组中）。
       *
       * @returns {boolean} 返回 true 表示复选框应被禁用，返回 false 表示不应被禁用。
       */
      isDisabled() {
        // 如果复选框属于一个组，则其禁用状态还取决于组的禁用状态和是否达到选择项的限制。
        return this.isGroup
            ? this._checkboxGroup.disabled || this.disabled || (this.elForm || {}).disabled || this.isLimitDisabled
            : this.disabled || (this.elForm || {}).disabled;
      },

      _elFormItemSize() {
        return (this.elFormItem || {}).elFormItemSize;
      },

      checkboxSize() {
        const temCheckboxSize = this.size || this._elFormItemSize || (this.$ELEMENT || {}).size;
        return this.isGroup
          ? this._checkboxGroup.checkboxGroupSize || temCheckboxSize
          : temCheckboxSize;
      }
    },

    props: {
      value: {},
      label: {},
      indeterminate: Boolean,
      disabled: Boolean,
      checked: Boolean,
      name: String,
      trueLabel: [String, Number],
      falseLabel: [String, Number],
      id: String, /* 当indeterminate为真时，为controls提供相关连的checkbox的id，表明元素间的控制关系*/
      controls: String, /* 当indeterminate为真时，为controls提供相关连的checkbox的id，表明元素间的控制关系*/
      border: Boolean,
      size: String
    },

    methods: {
      addToStore() {
        if (
          Array.isArray(this.model) &&
          this.model.indexOf(this.label) === -1
        ) {
          this.model.push(this.label);
        } else {
          this.model = this.trueLabel || true;
        }
      },
      /**
       * 处理复选框状态变化事件
       * 当复选框的状态发生变化时，此函数会被调用
       * 它根据复选框的选中状态来决定发出的值，并确保在超出限制时不会有任何动作
       *
       * @param {Event} ev - 触发的事件对象，包含复选框的当前状态
       */
      handleChange(ev) {
        // 检查是否超过了预设的限制，如果超过，则不执行后续操作
        if (this.isLimitExceeded) return;

        let value;

        // 根据复选框的选中状态来决定发出的值
        if (ev.target.checked) {
          // 如果复选框被选中，使用trueLabel的值，如果未定义，则默认为true
          value = this.trueLabel === undefined ? true : this.trueLabel;
        } else {
          // 如果复选框未被选中，使用falseLabel的值，如果未定义，则默认为false
          value = this.falseLabel === undefined ? false : this.falseLabel;
        }

        // 触发change事件，传递当前计算出的值和原始事件对象
        this.$emit('change', value, ev);

        // 等待Vue完成对DOM的更新，然后执行回调函数,避免并发错误，状态不一致的情况
        this.$nextTick(() => {
          // 如果当前复选框是复选框组的一部分，则触发复选框组的change事件
          if (this.isGroup) {
            this.dispatch('ElCheckboxGroup', 'change', [this._checkboxGroup.value]);
          }
        });
      }

    },

    created() {
      this.checked && this.addToStore();
    },
    mounted() {
      // 为indeterminate元素 添加aria-controls 属性
      if (this.indeterminate) {
        this.$el.setAttribute('aria-controls', this.controls);
      }
    },

    watch: {
      value(value) {
        this.dispatch('ElFormItem', 'el.form.change', value);
      }
    }
  };
</script>
