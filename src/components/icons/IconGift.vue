<template>

  <TablerIconGift :size="size" :stroke-width="strokeWidth" :class="customClass" />

</template>



<script>

import { IconGift } from './IconHelper';



export default {

  name: 'IconGift',

  components: {

    TablerIconGift: IconGift

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



