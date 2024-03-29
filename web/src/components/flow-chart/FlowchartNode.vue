<template>
  <div
    class="flowchart-node"
    :style="nodeStyle"
    @mousedown="handleMousedown"
    @mouseover="handleMouseOver"
    @mouseleave="handleMouseLeave"
    :class="{
      'node-incident': type === 'incident',
      'node-asset': type === 'asset',
      'node-critical': state >= 0.8,
      'node-danger': state >= 0.6 && state < 0.8,
      'node-warning': state >= 0.3 && state < 0.6,
      'node-normal': state >= 0 && state < 0.3,
    }"
  >
    <div
      v-show="type !== 'incident'"
      class="node-port node-input"
      @mousedown="inputMouseDown"
      @mouseup="inputMouseUp"
    ></div>
    <div class="node-main">
      <div v-text="getTypeName(type)" class="node-type"></div>
      <div v-text="label" class="node-label"></div>
      <div v-if="type === 'asset'" v-text="state" class="node-label"></div>
      <div
        v-if="type === 'incident'"
        v-text="'Критичность: ' + level"
        class="node-label"
      ></div>
    </div>
    <div class="node-port node-output" @mousedown="outputMouseDown"></div>
    <div v-show="show.delete" class="node-delete">&times;</div>
  </div>
</template>

<script>
export default {
  name: "FlowchartNode",
  props: {
    id: {
      type: Number,
      default: 1000,
      validator(val) {
        return typeof val === "number";
      },
    },
    x: {
      type: Number,
      default: 0,
      validator(val) {
        return typeof val === "number";
      },
    },
    y: {
      type: Number,
      default: 0,
      validator(val) {
        return typeof val === "number";
      },
    },
    type: {
      type: String,
      default: "Default",
    },
    label: {
      type: String,
      default: "input name",
    },
    options: {
      type: Object,
      default() {
        return {
          centerX: 1024,
          scale: 1,
          centerY: 140,
        };
      },
    },
    color: {
      type: String,
      default: "rgb(255, 136, 85)",
    },
    level: {
      type: Number,
      default: 0,
    },
    state: {
      type: Number,
      default: 0,
    },
  },
  data() {
    return {
      show: {
        delete: false,
      },
    };
  },
  mounted() {},
  computed: {
    nodeStyle() {
      return {
        top: this.options.centerY + this.y * this.options.scale + "px", // remove: this.options.offsetTop +
        left: this.options.centerX + this.x * this.options.scale + "px", // remove: this.options.offsetLeft +
        transform: `scale(${this.options.scale})`,
      };
    },
  },
  methods: {
    getLabel(label, type, state) {
      if (type === "incident") {
        return label;
      }

      return `${label}<br>Состояние: ${state}`;
    },
    getTypeName(type) {
      const typeNames = {
        incident: "Инцидент",
        asset: "Актив",
      };

      return typeNames[type];
    },
    handleMousedown(e) {
      const target = e.target || e.srcElement;
      // console.log(target);
      if (
        target.className.indexOf("node-input") < 0 &&
        target.className.indexOf("node-output") < 0
      ) {
        this.$emit("nodeSelected", e);
      }
      e.preventDefault();
    },
    handleMouseOver() {
      this.show.delete = true;
    },
    handleMouseLeave() {
      this.show.delete = false;
    },
    outputMouseDown(e) {
      this.$emit("linkingStart");
      e.preventDefault();
    },
    inputMouseDown(e) {
      e.preventDefault();
    },
    inputMouseUp(e) {
      this.$emit("linkingStop");
      e.preventDefault();
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
$themeColor: darkgray;
//  rgb(255, 136, 85);
$portSize: 12;

.flowchart-node {
  margin: 0;
  width: 120px;
  height: 80px;
  position: absolute;
  box-sizing: border-box;
  border: none;
  background: white;
  z-index: 1;
  opacity: 0.9;
  cursor: move;
  transform-origin: top left;
  box-shadow: 0 0 0 2px $themeColor;

  &.node-incident {
    box-shadow: none;
    .node-type {
      background: blue;
    }
  }
  &.node-asset {
    &.node-critical {
      box-shadow: 0 0 0 2px red;
      .node-type {
        background: red;
      }
    }
    &.node-danger {
      box-shadow: 0 0 0 2px orange;
      .node-type {
        background: orange;
      }
    }
    &.node-warning {
      box-shadow: 0 0 0 2px goldenrod;
      .node-type {
        background: goldenrod;
      }
    }

    .node-type {
      background: $themeColor;
    }
  }
  .node-main {
    text-align: center;
    .node-type {
      color: white;
      font-size: 13px;
      padding: 6px;
    }
    .node-label {
      font-size: 13px;
    }
  }
  .node-port {
    position: absolute;
    width: #{$portSize}px;
    height: #{$portSize}px;
    left: 50%;
    transform: translate(-50%);
    border: 1px solid #ccc;
    border-radius: 100px;
    background: white;
    &:hover {
      background: $themeColor;
      border: 1px solid $themeColor;
    }
  }
  .node-input {
    top: #{-2 + $portSize/-2}px;
  }
  .node-output {
    bottom: #{-2 + $portSize/-2}px;
  }
  .node-delete {
    position: absolute;
    right: -6px;
    top: -6px;
    font-size: 12px;
    width: 12px;
    height: 12px;
    color: $themeColor;
    cursor: pointer;
    background: white;
    border: 1px solid $themeColor;
    border-radius: 100px;
    text-align: center;
    &:hover {
      background: $themeColor;
      color: white;
    }
  }
}
.selected {
  box-shadow: 0 0 0 2px $themeColor;
}
</style>
