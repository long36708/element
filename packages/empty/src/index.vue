<template>
  <div class="el-empty">
    <div class="el-empty__image" :style="imageStyle">
      <img v-if="image" :src="image" ondragstart="return false">
      <!--  自定义图片    -->
      <slot v-else name="image">
        <img-empty/>
      </slot>
    </div>
    <div class="el-empty__description">
      <!-- 	自定义描述文字     -->
      <slot v-if="$slots.description" name="description"></slot>
      <p v-else>{{ emptyDescription }}</p>
    </div>
    <!-- 自定义底部内容   -->
    <div v-if="$slots.default" class="el-empty__bottom">
      <slot></slot>
    </div>
  </div>
</template>

<script>
import ImgEmpty from './img-empty.vue';
import {t} from 'element-ui/src/locale';

export default {
  name: 'ElEmpty',
  components: {
    [ImgEmpty.name]: ImgEmpty
  },
  props: {
    // 图片地址
    image: {
      type: String,
      default: ''
    },
    // 图片大小（宽度）
    imageSize: Number,
    // 文本描述
    description: {
      type: String,
      default: ''
    }
  },
  computed: {
    emptyDescription() {
      return this.description || t('el.empty.description');
    },
    imageStyle() {
      return {
        width: this.imageSize ? `${this.imageSize}px` : ''
      };
    }
  }
};
</script>
