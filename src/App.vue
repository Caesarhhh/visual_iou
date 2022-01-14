<template>
  <div id="app">
    <videoPlayer/>
  </div>
</template>

<script>
import videoPlayer from './components/videoPlayer.vue'

export default {
  name: 'App',
  components: {
    videoPlayer
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
