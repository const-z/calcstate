<template>
  <div class="flowchart-panel">
    <div class="save-button" :class="{ changed: this.changed }">
      <button @click="save" title="Сохранить">&#128427;</button>
    </div>

    <div v-show="!addingNode" class="show-add-node-tools">
      <button @click="addingNode = true" title="Добавить">&plus;</button>
    </div>

    <div v-show="!addingNode" class="calc-button">
      <button @click="calc" title="Расчитать">&sum;</button>
    </div>

    <div v-show="addingNode" class="add-node-tools">
      <div class="tool-control">
        <label for="node-type">Тип</label>
        <select id="node-type" v-model="newNode.type">
          <option
            v-for="(item, index) in nodeCategory"
            :key="index"
            :value="item"
          >
            {{ getTypeName(item) }}
          </option>
        </select>
      </div>

      <div class="tool-control">
        <label for="node-label">Имя</label>
        <input id="node-label" type="text" v-model="newNode.label" />
      </div>

      <div v-if="newNode.type === 'incident'" class="tool-control">
        <label for="node-label">Критичность:</label>
        <select id="node-incident-level" v-model="newNode.incidentLevel">
          <option
            v-for="(item, index) in nodeIncidentsLevels"
            :key="index"
            :value="item"
          >
            {{ item }}
          </option>
        </select>
      </div>

      <div class="tool-buttons">
        <div style="display: flex; justify-content: end">
          <button
            title="Отменить"
            style="margin-right: 8px; font-weight: bold; transform: scaleX(-1)"
            @click="cancel"
          >
            &#10140;
          </button>
          <button title="Добавить" @click="addNode">&#10004;</button>
        </div>
      </div>
    </div>

    <simple-flowchart :scene.sync="scene" />
  </div>
</template>

<script>
import axios from "axios";

import SimpleFlowchart from "./flow-chart/SimpleFlowchart.vue";
import { server } from "../constants";

export default {
  name: "FlowChart",
  components: {
    SimpleFlowchart,
  },
  methods: {
    getTypeName(type) {
      const typeNames = {
        incident: "Инцидент",
        asset: "Актив",
      };

      return typeNames[type];
    },
    addNode() {
      let maxID = Math.max(0, ...this.scene.nodes.map((n) => n.id));

      const node = {
        id: maxID + 1,
        x: -400,
        y: 50,
        type: this.newNode.type,
        label: this.newNode.label ? this.newNode.label : `test${maxID + 1}`,
      };

      if (node.type === "incident") {
        node.level = this.newNode.incidentLevel;
      }

      this.scene.nodes.push(node);
      this.cancel();
    },
    save: async function (doCancel = true) {
      const { pathname } = new URL(location.href);
      const data = {
        nodes: this.scene.nodes,
        links: this.scene.links,
      };
      await axios.post(`${server.baseURL}/api/data${pathname}`, data);

      this.changed = false;

      if (doCancel) {
        this.cancel();
      }
    },
    cancel: function () {
      this.addingNode = false;
      this.newNode = {
        label: "",
        type: "asset",
        incidentLevel: 0.5,
      };
    },
    loadData: async function () {
      const { pathname } = new URL(location.href);
      const response = await axios.get(`${server.baseURL}/api/data${pathname}`);
      this.scene = {
        ...this.scene,
        ...response.data,
      };
      setTimeout(() => {
        this.dataLoaded = true;
      }, 300);
      console.log(`Data loaded from ${pathname}`);
    },
    calc: async function () {
      const { pathname } = new URL(location.href);

      if (this.changed) {
        await this.save(false);
      }

      await axios.post(`${server.baseURL}/api/calc${pathname}`);
      await this.loadData();
    },
  },
  data: () => {
    return {
      scene: {
        centerX: 1024,
        centerY: 140,
        scale: 1,
        nodes: [],
        links: [],
      },
      addingNode: false,
      newNode: {
        label: "",
        type: "asset",
        incidentLevel: 0.5,
      },
      nodeCategory: ["asset", "incident"],
      nodeIncidentsLevels: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
      changed: false,
      dataLoaded: false,
    };
  },
  async mounted() {
    await this.loadData();

    this.saveInterval = setInterval(async () => {
      if (this.changed) {
        console.log(`${new Date().toISOString()} - save`);
        await this.save(false);
      }
    }, 5000);
  },

  unmounted() {
    clearInterval(this.saveInterval);
  },

  watch: {
    scene: {
      handler() {
        if (!this.changed) {
          console.log("Data changed");
        }

        this.changed = this.dataLoaded;
      },
      deep: true,
    },
  },
};
</script>

<style lang="scss" scoped>
label {
  font-size: 12px;
}
.flowchart-panel {
  flex: 1 1 auto;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: flex-start;
  align-items: stretch;
  align-content: stretch;
}
.show-add-node-tools {
  display: flex;
  flex-direction: row;
  align-items: center;
  position: absolute;
  left: 20px;
  top: 100px;
  z-index: 100;
  background-color: white;
  padding: 8px;
  border-radius: 4px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  border-radius: 36px;
  height: 36px;
  width: 36px;
  cursor: pointer;

  button {
    background: none;
    border: none;
    font-size: 42px;
    cursor: pointer;
  }
}

.calc-button,
.save-button {
  display: flex;
  flex-direction: row;
  align-items: center;
  position: absolute;
  left: 20px;
  top: 180px;
  z-index: 100;
  background-color: white;
  padding: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  border-radius: 36px;
  height: 36px;
  width: 36px;
  cursor: pointer;

  button {
    background: none;
    border: none;
    font-size: 22pt;
    cursor: pointer;
  }
}

.save-button {
  top: 20px;
  color: green;
  box-shadow: 0 0 10px 5px rgb(0, 200, 0);

  &.changed {
    color: red;
    box-shadow: 0 0 10px 5px rgb(200, 0, 0);
  }
}

.add-node-tools {
  display: flex;
  flex-direction: column;
  position: absolute;
  left: 20px;
  top: 20px;
  z-index: 100;
  background-color: white;
  padding: 8px;
  border-radius: 4px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
}
.tool-control {
  display: flex;
  flex-direction: column;
}
.add-node-tools > .tool-control {
  margin-bottom: 8px;
}
.tool-buttons {
  padding-top: 8px;
  border-top: 1px solid darkgrey;
  display: flex;
  flex-direction: column;
  display: flex;
}
.tool-buttons > * {
  margin-bottom: 8px;
}
</style>

