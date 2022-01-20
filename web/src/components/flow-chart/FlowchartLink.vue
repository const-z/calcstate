<template>
  <g
    @mouseover="handleMouseOver"
    @mouseleave="handleMouseLeave"
    @click="linkClick"
  >
    <path :d="dAttr" :style="pathStyle"></path>

    <text
      v-show="useWeight"
      text-anchor="middle"
      class="lines-label"
      :transform="labelTransform"
    >
      {{ label }}
    </text>

    <path
      d="M -1 -1 L 0 1 L 1 -1 z"
      :style="arrowStyle"
      :transform="arrowTransform"
    ></path>

    <a v-if="show.delete">
      <text
        text-anchor="middle"
        :transform="editButtonTransform"
        font-size="22"
      >
        &#9997;
      </text>
    </a>
  </g>
</template>

<script>
export default {
  name: "FlowchartLink",
  props: {
    // start point position [x, y]
    start: {
      type: Array,
      default: () => [0, 0],
    },
    // end point position [x, y]
    end: {
      type: Array,
      default: () => [0, 0],
    },
    id: Number,
    label: {
      type: String,
      default: () => "",
    },
    useWeight: {
      type: Boolean,
      default: () => false,
    },
  },
  data() {
    return {
      show: {
        delete: false,
        mouseOver: false,
      },
    };
  },
  methods: {
    linkClick() {
      this.$emit("linkClick");
    },
    handleMouseOver() {
      this.show.mouseOver = true;
    },
    handleMouseLeave() {
      this.show.delete = false;
      this.show.mouseOver = false;
    },
    caculateCenterPoint() {
      // caculate arrow position: the center point between start and end
      const dx = (this.end[0] - this.start[0]) / 2;
      const dy = (this.end[1] - this.start[1]) / 2;
      return [this.start[0] + dx, this.start[1] + dy];
    },
    caculateRotation() {
      // caculate arrow rotation
      const angle = -Math.atan2(
        this.end[0] - this.start[0],
        this.end[1] - this.start[1]
      );
      const degree = (angle * 180) / Math.PI;
      return degree < 0 ? degree + 360 : degree;
    },
    deleteLink() {
      this.$emit("deleteLink");
    },
  },
  computed: {
    pathStyle() {
      if (this.show.mouseOver) {
        return {
          stroke: "rgb(255, 136, 85)",
          strokeWidth: 4.73205,
          fill: "transparent",
        };
      } else {
        return {
          stroke: "rgb(255, 136, 85)",
          strokeWidth: 2.73205,
          fill: "transparent",
        };
      }
    },
    arrowStyle() {
      return {
        stroke: "rgb(255, 136, 85)",
        strokeWidth: 5.73205,
        fill: "none",
      };
    },
    arrowTransform() {
      const [arrowX, arrowY] = this.caculateCenterPoint();
      const degree = this.caculateRotation();
      return `translate(${arrowX}, ${arrowY}) rotate(${degree})`;
    },
    labelTransform() {
      const [x, y] = this.caculateCenterPoint();
      return `translate(${x}, ${y - 10})`;
    },
    editButtonTransform() {
      const [x, y] = this.caculateCenterPoint();
      return `translate(${x}, ${y})`;
    },
    dAttr() {
      let cx = this.start[0],
        cy = this.start[1],
        ex = this.end[0],
        ey = this.end[1];
      let x1 = cx,
        y1 = cy + 50,
        x2 = ex,
        y2 = ey - 50;
      return `M ${cx}, ${cy} C ${x1}, ${y1}, ${x2}, ${y2}, ${ex}, ${ey}`;
    },
  },
};
</script>

<style scoped lang="scss">
g {
  cursor: pointer;
  // .lines-label {
  //   cursor: text;
  // }
}
</style>