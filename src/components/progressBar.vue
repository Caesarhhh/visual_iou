<template>
  <div>
    <div class="label">{{name}}</div>
    <div class="line" ref="line">
        <div class="long" @click="setProgress($event)"/>
        <div class="bar" :style="[barPos]"></div>
        <div v-for="item in gtArea" class="gtArea" @click="updateProgress(item.start,item.end)" :style="[gtAreas(item.start,item.end)]"></div>
        <div v-for="item,index in resultArea" class="resultArea" v-if="index < iouTh" @click="updateProgress(item.start,item.end)" :style="[gtAreas(item.start,item.end)]"></div>
    </div>
  </div>
</template>

<script>
    export default {
      methods:{
          updateProgress(newProgress,pauseProgress){
              this.$parent.setVideoTime(newProgress)
              if(this.ifStartPause){
                 this.$parent.videoPause()
                 this.$parent.setPause(true)
              }
              this.$parent.setVideoPauseProgress(pauseProgress)
          },
          setProgress(event){
              var e = event || window.event;
 	          var left = event.currentTarget.getBoundingClientRect().left;
 	          var right = event.currentTarget.getBoundingClientRect().right;
              let x=e.clientX
              let newProgress=(x-left)/(right-left)
              this.updateProgress(newProgress)
          }
      },
      props:['name','gtArea','progress','resultArea','iouTh',"ifStartPause","ifEndPause"],
      data() {
        return {
        }
      },
      computed:{
          barPos(){
              let left=this.progress
              if(left<0){
                  left=0
              }
              if(left>1){
                  left=1
              }
              return {
              "left":left*498+"px"
             }
          },
          gtAreas(){
              return function(start,end){
                  return {
                  "left":498*start+"px",
                  "width":498*(end-start)+"px"
              } 
              }
          }
      }
    }
</script>

<style scoped>
.label{
    position: absolute;
    margin-left:-210px;
    width:200px;
    text-align: right;
    font-family: 'STKaiti';
    font-size:20px;
    font-weight: bold;
}
.gtArea{
    height:10px;
    background-color: green;
    position: absolute;
    cursor: pointer;
}
.resultArea{
    height:10px;
    bottom:0px;
    background-color: orange;
    position: absolute;
    cursor: pointer;
}
.line{
    width:500px;
    height: 20px;
    position: relative;
}
.long{
    background-color: rgb(6, 142, 196);
    position: absolute;
    border-radius: 3px;
    width:500px;
    height: 6px;
    top: 7px;
    cursor: pointer;
}
.bar{
    width:2px;
    height: 20px;
    position: absolute;
    background-color: rgb(224, 12, 12);
    z-index: 100;
}
.bar:hover{
    border:solid;
    cursor: pointer;
    border-color: rgb(224, 12, 12);
    border-width: 1px;
    margin-left:-1px;
    margin-top:-1px;
}
</style>
