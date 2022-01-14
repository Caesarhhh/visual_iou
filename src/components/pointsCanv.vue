<template>
    <div class="box">
        <div v-for="item in points" class="point" @click="updateProgress(item.start,item.end)" :style="[pointPos(item[0],item[1],"red")]">
        </div>
    </div>
</template>

<script>
    export default {
      methods:{
      },
      props:["points"],
      data() {
        return {
        }
      },
      computed:{
          pointPos(){
              return function(x,y,type){
                  return {
                  "left":450*x-2.5+"px",
                  "top":450*y-2.5+"px",
              } 
              }
          }
      }
    }
</script>

<style scoped>
.box{
    position: absolute;
    left:50%;
    z-index: 100;
    top:164px;
    margin-left:-225px;
    width:1px;
    height:1px;
}
.point{
    width:5px;
    height:5px;
    position: absolute;
    background-color: green;
    border-radius: 5px;
}
</style>
