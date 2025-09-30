<template>
  <TablerIconTelegram :size="size" :stroke-width="strokeWidth" :class="customClass" />
</template>

<script>
import { IconTelegram } from './IconHelper';

export default {
  name: 'IconBrandTelegram',
  components: {
    TablerIconTelegram: IconTelegram
  },
  props: {
    size: {
      type: [Number, String],
      default: 24
    },
    strokeWidth: {
      type: [Number, String],
      default: 2
    },
    customClass: {
      type: String,
      default: ''
    }
  }
};
</script>
