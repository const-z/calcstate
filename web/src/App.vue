<template>
  <div id="app">
    <flow-chart />
  </div>
</template>

<script>
import FlowChart from "./components/FlowChart.vue";
import { server } from "./constants";

export default {
  name: "App",
  components: {
    FlowChart,
  },
  data: () => {
    return {
      msg: `Welcome to Your Vue.js App ${server.baseURL}`,
    };
  },
};
</script>

<style>
html,
body {
  height: 100%;
  width: 100%;
  margin: 0;
}

body {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: flex-start;
  align-items: stretch;
  align-content: stretch;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  flex: 1 1 auto;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: flex-start;
  align-items: stretch;
  align-content: stretch;
}
</style>
