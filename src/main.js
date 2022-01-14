// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import 'babel-polyfill'
import Vue from 'vue'
import App from './App'
import axios from 'axios'
import VideoPlayer from 'vue-video-player'
import 'vue-video-player/src/custom-theme.css'
import 'ant-design-vue/dist/antd.css';
import 'video.js/dist/video-js.css'
import { Modal,Form,Button,Input,Icon,Upload,Select,Switch,InputNumber } from 'ant-design-vue'
Vue.use(Icon)
Vue.use(Upload)
Vue.use(Input)
Vue.use(Button)
Vue.use(Select)
Vue.use(Form)
Vue.use(Modal)
Vue.use(Switch)
Vue.use(InputNumber)
Vue.use(VideoPlayer)
Vue.prototype.$axios = axios
Vue.config.productionTip = false
/* eslint-disable no-new */
new Vue({
  el: '#app',
  components: { App },
  template: '<App/>'
})
