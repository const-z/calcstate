<template>
  <div class="flowchart-panel">
    <!-- <div class="tool-wrapper">TEXT</div> -->
    <div class="tool-wrapper">
      <div class="tool-control">
        <label for="node-type">Тип</label>
        <select id="node-type" v-model="newNodeType">
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
        <input id="node-label" type="text" v-model="newNodeLabel" />
      </div>

      <div v-if="newNodeType === 'incident'" class="tool-control">
        <label for="node-label">Критичность:</label>
        <select id="node-incident-level" v-model="newNodeIncidentLevel">
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
        <button @click="addNode">Добавить</button>
        <button v-show="false" @click="save">SAVE</button>
        <button @click="calc">Расчитать</button>
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
        type: this.newNodeType,
        label: this.newNodeLabel ? this.newNodeLabel : `test${maxID + 1}`,
      };

      if (node.type === "incident") {
        node.level = this.newNodeIncidentLevel;
      }

      this.scene.nodes.push(node);
    },
    save: async function () {
      const data = {
        nodes: this.scene.nodes,
        links: this.scene.links,
      };
      await axios.post(`${server.baseURL}/api/data`, data);
    },
    calc: async function () {
      const data = {
        nodes: this.scene.nodes,
        links: this.scene.links,
      };
      data.nodes.forEach((n) => {
        delete n.state;
      });
      const response = await axios.post(`${server.baseURL}/api/calc`, data);
      this.scene = {
        ...this.scene,
        ...response.data,
      };
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
      newNodeType: "asset",
      newNodeLabel: "",
      newNodeIncidentLevel: 0.5,
      nodeCategory: ["asset", "incident"],
      nodeIncidentsLevels: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
    };
  },
  async mounted() {
    const response = await axios.get(`${server.baseURL}/api/data`);
    this.scene = {
      ...this.scene,
      ...response.data,
    };
  },
};
</script>

<style scoped>
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
.tool-wrapper {
  margin: 8px;
  display: flex;
  flex-direction: column;
}
.tool-control {
  display: flex;
  flex-direction: column;
}
.tool-wrapper > .tool-control {
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

