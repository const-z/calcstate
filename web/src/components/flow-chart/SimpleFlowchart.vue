<template>
  <div
    class="flowchart-container"
    @mousemove="handleMove"
    @mouseup="handleUp"
    @mousedown="handleDown"
  >
    <!-- LINK EDITOR -->
    <div v-show="editLink" class="edit-link-tools" ref="editLinkTools">
      <div class="edit-link-tools-controls">
        <input
          id="weightValue"
          ref="weightValue"
          type="range"
          min="0"
          max="1"
          step="0.1"
          v-model="newLink.weight"
          :disabled="!newLink.useWeight"
        />
        <label for="weightValue">{{ newLink.weight }}</label>
      </div>
      <div class="edit-link-tools-buttons">
        <button title="Удалить" @click="linkDelete(newLink.id)">
          &#10005;
        </button>
        <div style="display: flex">
          <button
            title="Отменить"
            style="margin-right: 8px; font-weight: bold; transform: scaleX(-1)"
            @click="endEditLink"
          >
            &#10140;
          </button>
          <button title="Сохранить" @click="linkSave">&#10004;</button>
        </div>
      </div>
    </div>
    <!-- /LINK EDITOR -->

    <svg width="100%" :height="`${height}%`">
      <flowchart-link
        v-bind.sync="link"
        v-for="(link, index) in lines"
        :key="`link${index}`"
        :label="link.label"
        :ref="`link${link.id}`"
        @linkClick="startEditLink(link.id)"
      ></flowchart-link>
    </svg>
    <flowchart-node
      v-bind.sync="node"
      v-for="(node, index) in scene.nodes"
      :key="`node${index}`"
      :options="nodeOptions"
      :color="node.color"
      @linkingStart="linkingStart(node.id)"
      @linkingStop="linkingStop(node.id)"
      @nodeSelected="nodeSelected(node.id, $event)"
    >
    </flowchart-node>
  </div>
</template>

<script>
import FlowchartLink from "./FlowchartLink.vue";
import FlowchartNode from "./FlowchartNode.vue";
import { getMousePosition } from "./position";

export default {
  name: "VueFlowchart",
  props: {
    scene: {
      type: Object,
      default() {
        return {
          centerX: 1024,
          scale: 1,
          centerY: 140,
          nodes: [],
          links: [],
        };
      },
    },
    height: {
      type: Number,
      default: 100,
    },
  },
  data() {
    return {
      editLink: false,
      newLink: {
        id: null,
        weight: 0,
        useWeight: true,
      },
      action: {
        linking: false,
        dragging: false,
        scrolling: false,
        selected: 0,
      },
      mouse: {
        x: 0,
        y: 0,
        lastX: 0,
        lastY: 0,
      },
      draggingLink: null,
      rootDivOffset: {
        top: 0,
        left: 0,
      },
    };
  },
  components: {
    FlowchartLink,
    FlowchartNode,
  },
  computed: {
    nodeOptions() {
      return {
        centerY: this.scene.centerY,
        centerX: this.scene.centerX,
        scale: this.scene.scale,
        offsetTop: this.rootDivOffset.top,
        offsetLeft: this.rootDivOffset.left,
        selected: this.action.selected,
      };
    },
    lines() {
      const lines = this.scene.links.map((link) => {
        const fromNode = this.findNodeWithID(link.from);
        const toNode = this.findNodeWithID(link.to);
        let x, y, cy, cx, ex, ey;
        x = this.scene.centerX + fromNode.x;
        y = this.scene.centerY + fromNode.y;
        [cx, cy] = this.getPortPosition("bottom", x, y);
        x = this.scene.centerX + toNode.x;
        y = this.scene.centerY + toNode.y;
        [ex, ey] = this.getPortPosition("top", x, y);
        return {
          start: [cx, cy],
          end: [ex, ey],
          id: link.id,
          label: link.weight !== undefined ? `${link.weight}` : undefined,
          useWeight: ![fromNode.type, toNode.type].includes("incident"),
        };
      });
      if (this.draggingLink) {
        let x, y, cy, cx;
        const fromNode = this.findNodeWithID(this.draggingLink.from);
        x = this.scene.centerX + fromNode.x;
        y = this.scene.centerY + fromNode.y;
        [cx, cy] = this.getPortPosition("bottom", x, y);
        lines.push({
          start: [cx, cy],
          end: [this.draggingLink.mx, this.draggingLink.my],
        });
      }
      return lines;
    },
  },
  mounted() {
    this.rootDivOffset.top = this.$el ? this.$el.offsetTop : 0;
    this.rootDivOffset.left = this.$el ? this.$el.offsetLeft : 0;
  },
  methods: {
    endEditLink() {
      this.editLink = false;
      this.newLink.id = null;
      this.newLink.weight = 1;
      this.newLink.useWeight = true;
    },
    startEditLink(id) {
      const link = this.scene.links.find((item) => item.id === id);
      const line = this.$refs[`link${id}`][0];
      const center = line.caculateCenterPoint();
      const labelBox = line.$el.children[1].getBBox();
      const x = center[0] + labelBox.x;
      const y = center[1] + labelBox.y;

      this.newLink.weight = link.weight || 1;
      this.newLink.id = id;
      this.$refs.editLinkTools.style.left = `${x}px`;
      this.$refs.editLinkTools.style.top = `${y}px`;
      this.editLink = true;

      const fromNode = this.findNodeWithID(link.from);
      const toNode = this.findNodeWithID(link.to);

      if ([fromNode.type, toNode.type].includes("incident")) {
        this.newLink.useWeight = false;
        this.newLink.weight = 1;
      }
    },
    findNodeWithID(id) {
      return this.scene.nodes.find((item) => {
        return id === item.id;
      });
    },
    getPortPosition(type, x, y) {
      if (type === "top") {
        return [x + 60, y];
      } else if (type === "bottom") {
        return [x + 60, y + 80];
      }
    },
    linkingStart(index) {
      this.action.linking = true;
      this.draggingLink = {
        from: index,
        mx: 0,
        my: 0,
      };
    },
    linkingStop(index) {
      // add new Link
      if (this.draggingLink && this.draggingLink.from !== index) {
        // check link existence
        const existed = this.scene.links.find((link) => {
          return link.from === this.draggingLink.from && link.to === index;
        });
        if (!existed) {
          let maxID = Math.max(
            0,
            ...this.scene.links.map((link) => {
              return link.id;
            })
          );
          const newLink = {
            id: maxID + 1,
            from: this.draggingLink.from,
            to: index,
          };
          this.scene.links.push(newLink);
          this.$emit("linkAdded", newLink);
        }
      }
      this.draggingLink = null;
    },
    linkSave() {
      const id = this.newLink.id;
      const link = this.scene.links.find((item) => {
        return item.id === id;
      });
      const fromNode = this.findNodeWithID(link.from);
      const toNode = this.findNodeWithID(link.to);

      if (![fromNode.type, toNode.type].includes("incident")) {
        this.$set(link, "weight", this.newLink.weight);
      }

      this.endEditLink();
    },
    linkDelete(id) {
      const deletedLink = this.scene.links.find((item) => {
        return item.id === id;
      });
      if (deletedLink) {
        this.scene.links = this.scene.links.filter((item) => {
          return item.id !== id;
        });
        this.$emit("linkBreak", deletedLink);
      }
      this.endEditLink();
    },
    nodeSelected(id, e) {
      this.action.dragging = id;
      this.action.selected = id;
      this.$emit("nodeClick", id);
      this.mouse.lastX =
        e.pageX || e.clientX + document.documentElement.scrollLeft;
      this.mouse.lastY =
        e.pageY || e.clientY + document.documentElement.scrollTop;
    },
    handleMove(e) {
      if (this.action.linking) {
        [this.mouse.x, this.mouse.y] = getMousePosition(this.$el, e);
        [this.draggingLink.mx, this.draggingLink.my] = [
          this.mouse.x,
          this.mouse.y,
        ];
      }
      if (this.action.dragging) {
        this.mouse.x =
          e.pageX || e.clientX + document.documentElement.scrollLeft;
        this.mouse.y =
          e.pageY || e.clientY + document.documentElement.scrollTop;
        let diffX = this.mouse.x - this.mouse.lastX;
        let diffY = this.mouse.y - this.mouse.lastY;

        this.mouse.lastX = this.mouse.x;
        this.mouse.lastY = this.mouse.y;
        this.moveSelectedNode(diffX, diffY);
      }
      if (this.action.scrolling) {
        [this.mouse.x, this.mouse.y] = getMousePosition(this.$el, e);
        let diffX = this.mouse.x - this.mouse.lastX;
        let diffY = this.mouse.y - this.mouse.lastY;

        this.mouse.lastX = this.mouse.x;
        this.mouse.lastY = this.mouse.y;

        this.scene.centerX += diffX;
        this.scene.centerY += diffY;

        // this.hasDragged = true
      }
    },
    handleUp(e) {
      const target = e.target || e.srcElement;
      if (this.$el.contains(target)) {
        if (
          typeof target.className !== "string" ||
          target.className.indexOf("node-input") < 0
        ) {
          this.draggingLink = null;
        }
        if (
          typeof target.className === "string" &&
          target.className.indexOf("node-delete") > -1
        ) {
          // console.log('delete2', this.action.dragging);
          this.nodeDelete(this.action.dragging);
        }
      }
      this.action.linking = false;
      this.action.dragging = null;
      this.action.scrolling = false;
    },
    handleDown(e) {
      const target = e.target || e.srcElement;
      // console.log('for scroll', target, e.keyCode, e.which)
      if (
        (target === this.$el || target.matches("svg, svg *")) &&
        e.which === 1
      ) {
        this.action.scrolling = true;
        [this.mouse.lastX, this.mouse.lastY] = getMousePosition(this.$el, e);
        this.action.selected = null; // deselectAll
      }
      this.$emit("canvasClick", e);
    },
    moveSelectedNode(dx, dy) {
      let index = this.scene.nodes.findIndex((item) => {
        return item.id === this.action.dragging;
      });
      let left = this.scene.nodes[index].x + dx / this.scene.scale;
      let top = this.scene.nodes[index].y + dy / this.scene.scale;
      this.$set(
        this.scene.nodes,
        index,
        Object.assign(this.scene.nodes[index], {
          x: left,
          y: top,
        })
      );
    },
    nodeDelete(id) {
      this.scene.nodes = this.scene.nodes.filter((node) => {
        return node.id !== id;
      });
      this.scene.links = this.scene.links.filter((link) => {
        return link.from !== id && link.to !== id;
      });
      this.$emit("nodeDelete", id);
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.flowchart-container {
  margin: 0;
  background: #ddd;
  position: relative;
  overflow: hidden;
  flex: 1 1 auto;
  svg {
    cursor: grab;
  }
}

.edit-link-tools {
  position: absolute;
  display: flex;
  padding: 8px;
  width: 200px;
  z-index: 100;
  background-color: white;
  flex-direction: column;
  border-radius: 4px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);

  .edit-link-tools-controls {
    display: flex;
    flex-direction: row;
    margin-bottom: 8px;

    input {
      flex: 1;
    }

    label {
      flex: 0;
      align-self: center;
    }
  }

  .edit-link-tools-buttons {
    padding-top: 8px;
    border-top: 1px solid darkgray;
    display: flex;
    justify-content: space-between;

    button {
      width: 30px;
      height: 30px;
    }
  }
}
</style>
