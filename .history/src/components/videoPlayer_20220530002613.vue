<template>
  <div>
    <!-- <div class="box">
      <div
        v-for="item in framePoints"
        class="point"
        @click="updateProgress(item.start, item.end)"
        :style="[pointPos(item[0], item[1], item[2])]"
      ></div>
    </div> -->
    <a-button icon="setting" class="setting" @click="openSetting"> </a-button>
    <div class="centerLabel">
      <div class="labels">
        <div class="truthLabel" />
        <div class="truthText">实际值</div>
        <div class="resultLabel" />
        <div class="resultText">预测值</div>
      </div>
      <div class="labels">
        <div class="switchStart">
          <span>点击标签开始时暂停</span>
          <a-switch :default-checked="ifStartPause" @change="setIfStartPause" />
        </div>
        <div class="switchEnd">
          <span>点击标签结束时暂停</span>
          <a-switch :default-checked="ifEndPause" @change="setIfEndPause" />
        </div>
        <div class="switchTxt">
          <a-select :defaultValue="txtSelected" @change="txtChange">
            <a-select-option v-for="(value,key,index) in txtDict" :key="key">
              {{ key }}
            </a-select-option>
          </a-select>
        </div>
      </div>
    </div>
    <h2>{{ selectedName }}</h2>
    <div @click="togglePause" class="videoBox"></div>
    <video-player
      class="video-player vjs-custom-skin videoPlay"
      ref="videoPlayer"
      :playsinline="true"
      :options="playerOptions"
      @timeupdate="onPlayerTimeupdate($event)"
    >
    </video-player>
    <a-modal
      title="设置"
      :visible="settingVisable"
      @ok="settingOk"
      @cancel="settingCancel"
    >
      <a-form :form="form" :label-col="{ span: 5 }" :wrapper-col="{ span: 12 }">
        <a-form-item label="Video Name">
          <a-select :defaultValue="selectedName" @change="videoChange">
            <a-select-option v-for="i in videoNameList" :key="i">
              {{ i }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="Nums">
          <a-input-number v-model="iouTh" />
        </a-form-item>
        <a-form-item label="Result">
          <a-upload :beforeUpload="beforeUpload" name="logo">
            <a-button> <a-icon type="upload" /> Click to upload </a-button>
          </a-upload>
        </a-form-item>
      </a-form>
    </a-modal>
    <progressBar
      v-for="(item, index) in gtAreas"
      @click="clicked"
      class="line"
      :progress.sync="progress"
      :ifStartPause="ifStartPause"
      :ifEndPause="ifEndPause"
      :gtArea="item.areas"
      :iouTh="iouTh"
      :resultArea="
        resultAreas[index] === undefined ? [] : resultAreas[index].areas
      "
      :name="item.name"
    />
  </div>
</template>

<script>
import "video.js/dist/video-js.css";
import progressBar from "./progressBar";
import pointsCanv from "./pointsCanv";
export default {
  components: {
    progressBar,
    pointsCanv,
  },
  computed: {
    pointPos() {
      return function (x, y, type) {
        return {
          left: 450 * x - 2.5 + "px",
          top: 450 * y - 2.5 + "px",
          "background-color": this.pointColorDict[type],
        };
      };
    },
    playerOptions() {
      return {
        playbackRates: [0.0625, 0.25, 0.5, 1.0, 2.0],
        autoplay: false,
        muted: false,
        loop: false,
        preload: "auto",
        language: "zh-CN",
        aspectRatio: "16:9",
        fluid: true,
        sources: [
          {
            type: "video/mp4",
            src: this.ossBase + "txt/mp4/" + this.selectedName + ".mp4",
          },
        ],
        poster: "",
        notSupportedMessage: "此视频暂无法播放，请稍后再试",
        controlBar: {
          timeDivider: false,
          durationDisplay: true,
          remainingTimeDisplay: false,
          fullscreenToggle: true,
        },
      };
    },
  },
  methods: {
    setPause(val) {
      this.videoPau = val;
    },
    togglePause() {
      this.videoPau = !this.videoPau;
      if (this.videoPau) {
        this.videoPause();
      } else {
        this.videoPlay();
      }
    },
    settingOk() {
      this.settingVisable = false;
    },
    settingCancel() {
      this.settingVisable = false;
    },
    setIfStartPause(value) {
      this.ifStartPause = value;
    },
    setIfEndPause(value) {
      this.ifEndPause = value;
    },
    openSetting() {
      this.settingVisable = true;
    },
    setVideoPauseProgress(progress) {
      this.videoPauseProgress = progress;
    },
    videoPause() {
      this.$refs.videoPlayer.player.pause();
    },
    videoPlay() {
      this.$refs.videoPlayer.player.play();
    },
    videoChange(value) {
      this.selectedName = value;
      this.refreshResult();
      this.refreshGt();
      //this.refreshPoints();
    },
    async txtChange(value){
      this.txtSelected=value
      await this.initResult();
      this.calIoU();
      this.refreshResult();
      //this.refreshPoints();
    },
    xmlToJson(xml) {
      var obj = {};
      if (xml.nodeType == 1) {
        if (xml.attributes.length > 0) {
          obj["@attributes"] = {};
          for (var j = 0; j < xml.attributes.length; j++) {
            var attribute = xml.attributes.item(j);
            obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
          }
        }
      } else if (xml.nodeType == 3) {
        obj = xml.nodeValue;
      }

      if (xml.hasChildNodes()) {
        for (var i = 0; i < xml.childNodes.length; i++) {
          var item = xml.childNodes.item(i);
          var nodeName = item.nodeName;
          if (typeof obj[nodeName] == "undefined") {
            obj[nodeName] = this.xmlToJson(item);
          } else {
            if (typeof obj[nodeName].push == "undefined") {
              var old = obj[nodeName];
              obj[nodeName] = [];
              obj[nodeName].push(old);
            }
            obj[nodeName].push(this.xmlToJson(item));
          }
        }
      }
      return obj;
    },
    async getActionTimes() {
      let that = this;
      await this.$axios
        .get(
          "https://swallow-videos.oss-cn-beijing.aliyuncs.com/actionTimes.json"
        )
        .then((res) => {
          this.actionTimes = res.data;
        });
      await this.$axios
        .get(
          "https://swallow-videos.oss-cn-beijing.aliyuncs.com/annotations.xml"
        )
        .then((res) => {
          let tempActionPoints = {};
          var parser = new DOMParser(); //创建文档对象
          var xmldoc = parser.parseFromString(res.data, "text/xml");
          let jsons = that.xmlToJson(xmldoc);
          let tasks = jsons.annotations.meta.project.tasks.task;
          let tempTasks = {};
          for (let ii = 0; ii < jsons.annotations.track.length; ii++) {
            let temp = jsons.annotations.track[ii];
            if (tempTasks[temp["@attributes"].task_id] === undefined) {
              tempTasks[temp["@attributes"].task_id] = [temp];
            } else {
              tempTasks[temp["@attributes"].task_id].push(temp);
            }
          }
          for (let ii = 0; ii < tasks.length; ii++) {
            let videoName = tasks[ii].name["#text"];
            let typePoints = {};
            let tracks = tempTasks[tasks[ii]["id"]["#text"]];
            if (tracks === undefined) {
              continue;
            }
            for (let i = 0; i < tracks.length; i++) {
              let type = tracks[i]["@attributes"].label;
              let points = tracks[i].points;
              let pointList = [];
              for (let j = 0; j < points.length; j++) {
                let temp_att = {
                  frame: j + 1,
                  points: [
                    parseFloat(
                      points[j]["@attributes"].points.split(",")[0] / 612
                    ),
                    parseFloat(
                      points[j]["@attributes"].points.split(",")[1] / 612
                    ),
                  ],
                };
                pointList.push(temp_att);
              }
              typePoints[type] = pointList;
            }
            tempActionPoints[videoName] = typePoints;
          }
          that.actionPoints = tempActionPoints;
        });
    },
    beforeUpload(file, UpFileList) {
      const reader = new FileReader();
      reader.readAsText(file, "utf-8");
      let that = this;
      reader.onload = function () {
        that.resultDatas = that.getTruth(this.result);
        that.refreshResult();
      };
    },
    async initResult() {
      let fileName = this.txtDict[this.txtSelected];
      let url = this.ossBase + "txt/test0523/" + fileName;
      let that = this;
      await this.$axios.get(url).then((res) => {
        that.resultDatas = this.getTruth(res.data);
      });
    },
    refreshResult() {
      let temp_Area = [];
      for (let gt in this.gtLabel) {
        let datas = this.resultDatas[gt][this.selectedName];
        let tempAreas = [];
        for (let i = 0; i < datas.length; i++) {
          let data = datas[i];
          tempAreas.push({
            start: data[0],
            end: data[1],
            score: data[2],
          });
        }
        temp_Area.push({
          name: this.gtLabel[gt][1],
          areas: tempAreas,
        });
      }
      this.resultAreas = temp_Area;
    },
    getTruth(txt) {
      let labelData = txt.split("\n");
      let datadict = {};
      let tempNameList = [];
      for (let i = 0; i < labelData.length; i++) {
        let datas = labelData[i].split(" ");
        let time = datas[0].split("_");
        time = time[time.length - 1];
        tempNameList.push(datas[0]);
        let type = this.gtLabelReverse[datas[3]];
        if (datadict[type] === undefined) {
          datadict[type] = {};
          datadict[type][datas[0]] = [
            [datas[1] / time, datas[2] / time, datas[4]],
          ];
        } else {
          if (datadict[type][datas[0]] === undefined) {
            datadict[type][datas[0]] = [
              [datas[1] / time, datas[2] / time, datas[4]],
            ];
          } else {
            datadict[type][datas[0]].push([
              datas[1] / time,
              datas[2] / time,
              datas[4],
            ]);
          }
        }
      }
      this.videoNameList = Array.from(new Set(tempNameList));
      return datadict;
    },
    async getGt() {
      for (let gt in this.gtLabel) {
        let fileName = gt + "_test.txt";
        let url = this.ossBase + "txt/test0523/" + fileName;
        await this.$axios.get(url).then((res) => {
          let labelData = res.data.split("\n");
          let datadict = {};
          for (let i = 0; i < labelData.length; i++) {
            let datas = labelData[i].split(" ");
            let time = datas[0].split("_");
            time = time[time.length - 1];
            if (datadict[datas[0]] === undefined) {
              datadict[datas[0]] = [[datas[1] / time, datas[2] / time]];
            } else {
              datadict[datas[0]].push([datas[1] / time, datas[2] / time]);
            }
          }
          this.gtDatas[gt] = datadict;
        });
      }
      this.refreshGt();
    },
    refreshGt() {
      let temp_gtArea = [];
      for (let gt in this.gtLabel) {
        let datas = this.gtDatas[gt][this.selectedName];
        let tempAreas = [];
        for (let i = 0; i < datas.length; i++) {
          let data = datas[i];
          tempAreas.push({
            start: data[0],
            end: data[1],
          });
        }
        temp_gtArea.push({
          name: this.gtLabel[gt][1],
          gt: gt,
          areas: tempAreas,
        });
      }
      this.gtAreas = temp_gtArea;
      this.iouTh = this.gtAreas[0].areas.length;
    },
    getProgresss() {
      return this.$refs.videoPlayer.player.cache_.currentTime;
    },
    onPlayerTimeupdate(player) {
      const cache_time = player.cache_.currentTime;
      let frame_cnt = parseInt(
        (cache_time + 0.08 * player.cache_.lastPlaybackRate) * 29.97
      );
      if (this.anchorPoints[frame_cnt] !== undefined) {
        this.framePoints = this.anchorPoints[frame_cnt];
        this.videoPause();
      } else {
        this.framePoints = [];
      }
      this.progress = player.cache_.currentTime / player.cache_.duration;
      this.duration = player.cache_.duration;
      if (this.videoPauseProgress != -1) {
        if (
          this.videoPauseProgress <=
          (player.cache_.currentTime + 0.15 * player.cache_.lastPlaybackRate) /
            player.cache_.duration
        ) {
          if (this.ifEndPause) {
            this.videoPau = true;
            this.videoPause();
          }
          this.videoPauseProgress = -1;
        }
      }
      if (!this.videoPau && this.anchorPoints[frame_cnt] !== undefined) {
        this.videoPlay();
      }
    },
    setVideoTime(progress) {
      this.progress = progress;
      this.$refs.videoPlayer.player.currentTime(progress * this.duration);
    },
    findMaxIoU(videoName, type) {
      let gts = this.gtDatas[type][videoName];
      let results = this.resultDatas[type][videoName];
      let IoUList = [];
      for (let i in results) {
        let temp = 0;
        for (let j in gts) {
          if (results[i][1] <= gts[j][0] || gts[j][1] <= results[i][0]) {
            continue;
          }
          temp = Math.max(
            (Math.min(gts[j][1], results[i][1]) -
              Math.max(gts[j][0], results[i][0])) /
              (Math.max(gts[j][1], results[i][1]) -
                Math.min(gts[j][0], results[i][0])),
            temp
          );
        }
        IoUList.push(temp);
      }
      if (results == undefined) {
        return 0;
      }
      for (let i = 0; i < results.length; i++) {
        for (let j = 0; j < results.length - 1; j++) {
          if (IoUList[j] < IoUList[j + 1]) {
            let temp = IoUList[j];
            IoUList[j] = IoUList[j + 1];
            IoUList[j + 1] = temp;
            temp = results[j];
            results[j] = results[j + 1];
            results[j + 1] = temp;
          }
        }
      }
      this.resultDatas[type][videoName] = results;
      return IoUList[0];
    },
    calIoU() {
      for (let i in this.videoNameList) {
        let name = this.videoNameList[i];
        if (name.length == 0) continue;
        let sum = 0;
        for (let label in this.gtLabel) {
          sum += this.findMaxIoU(name, label);
        }
        let avg = sum / 1;
        this.IoU_list[name] = avg;
      }
    },
    sortNameListByIoU() {
      for (let i = 0; i < this.videoNameList.length; i++) {
        for (let j = 0; j < this.videoNameList.length - 1; j++) {
          if (
            this.IoU_list[this.videoNameList[j]] <
            this.IoU_list[this.videoNameList[j + 1]]
          ) {
            let temp = this.videoNameList[j];
            this.$set(this.videoNameList, j, this.videoNameList[j + 1]);
            this.$set(this.videoNameList, j + 1, temp);
          }
        }
      }
      if(this.txtSelected==="stage2lgte_slide" || this.txtSelected==="stage2lgte_slide.txt"){
        this.selectedName = this.videoNameList[0];
      }
      //this.selectedName="12_240_2020070302_li3zhi2_jian4kang1cha2ti3_2020_07_03_104325_64"
      this.refreshResult();
      this.refreshGt();
    },
    async refreshPoints() {
      const actions = this.actionTimes[this.selectedName.split("_")[3]];
      const startT = parseInt(this.selectedName.split("_")[1]);
      const startF = parseInt(startT * 29.97);
      const endT =
        parseInt(
          this.selectedName.split("_")[this.selectedName.split("_").length - 1]
        ) + parseInt(startT);
      let temp_points = {};
      console.log(actions)
      for (let i = 0; i < actions.length; i++) {
        if (startT <= actions[i][1] && endT >= actions[i][2]) {
          let newName =
            actions[i][0] +
            "_" +
            this.selectedName.substring(this.selectedName.indexOf("_", 3) + 1);
          newName = newName.substring(0, newName.length - 3);
          let actionData = this.actionPoints[newName];
          if (actionData !== undefined) {
            for (let tyin in this.pointTypes) {
              let type = this.pointTypes[tyin];
              for (let action_index in actionData[type]) {
                let actionPoint = actionData[type][action_index];
                let pointPos =
                  -startF +
                  parseInt(actionPoint.frame) +
                  parseInt(29.97 * actions[i][1]);
                if (temp_points[pointPos] === undefined) {
                  temp_points[pointPos] = [];
                }
                actionPoint.points.push(type);
                temp_points[pointPos].push(actionPoint.points);
              }
            }
          }
          //await this.$axios.get(url)
        }
      }
      this.anchorPoints = temp_points;
    },
    clicked() {
      this.setVideoTime(0.8);
    },
    async initDatas() {
      //await this.getActionTimes();
      await this.getGt();
      await this.initResult();
      this.calIoU();
      this.sortNameListByIoU();
      //this.refreshPoints();
    },
  },
  mounted() {
    this.initDatas();
  },
  data() {
    return {
      videoPau: true,
      framePoints: [],
      anchorPoints: {},
      pointTypes: [
        "hyoid_bone_top",
        "hyoid_bone_left",
        "hyoid_bone_down",
        "backbone_2",
        "backbone_4",
        "soft_palate_left",
        "soft_palate_right",
        "soft_palate_peak",
      ],
      txtDict:{
        stage1:"stage1.txt",
        stage2:"stage2.txt",
        stage2lgte:"stage2lgte.txt",
        stage2lgte_slide:"stage2lgte_slide.txt"
      },
      txtSelected:"stage2lgte_slide",
      pointColorDict: {
        hyoid_bone_top: "red",
        hyoid_bone_left: "red",
        hyoid_bone_down: "red",
        backbone_2: "orange",
        backbone_4: "orange",
        soft_palate_left: "skyblue",
        soft_palate_right: "skyblue",
        soft_palate_peak: "skyblue",
      },
      ifStartPause: false,
      ifEndPause: false,
      actionTimes: {},
      actionPoints: {},
      videoPauseProgress: -1,
      resultAreas: [],
      gtAreas: [],
      gtLabel: {
        OralDelivery: [1, "口腔运送"],
        SoftPalateLift: [2, "软腭上抬"],
        HyoidExercise: [3, "舌骨运动"],
        UESOpen: [4, "UES open"],
        ThroatSwallow: [5, "咽期吞咽启动"],
        ThroatTransport: [6, "咽腔运送"],
        LaryngealVestibuleClosure: [7, "喉前庭关闭"],
        //AllTime: [8, "整体"],
      },
      gtLabelReverse: {
        1: "OralDelivery",
        2: "SoftPalateLift",
        3: "HyoidExercise",
        4: "UESOpen",
        5: "ThroatSwallow",
        6: "ThroatTransport",
        7: "LaryngealVestibuleClosure",
        //8: "AllTime",
      },
      //gtLabel:{
      //  "SoftPalateLift":[1,"软腭上抬"],
      //},
      //gtLabelReverse:{
      //  1:"SoftPalateLift"
      //},
      gtDatas: {
        OralDelivery: [],
        SoftPalateLift: [],
        HyoidExercise: [],
        UESOpen: [],
        ThroatSwallow: [],
        ThroatTransport: [],
        LaryngealVestibuleClosure: [],
      },
      resultDatas: {
        OralDelivery: [],
        SoftPalateLift: [],
        HyoidExercise: [],
        UESOpen: [],
        ThroatSwallow: [],
        ThroatTransport: [],
        LaryngealVestibuleClosure: [],
        //AllTime: []
      },
      iouTh: 1,
      videoNameList: [
        "1_0.0_2021062302_nie4fang1_jian4kang1cha2ti3_2021_06_23_105123_64",
      ],
      selectedName:
        "1_0.0_2021062302_nie4fang1_jian4kang1cha2ti3_2021_06_23_105123_64",
      progress: 0,
      duration: 0,
      ossBase: "https://swallow-videos.oss-cn-beijing.aliyuncs.com/",
      settingVisable: false,
      form: this.$form.createForm(this, { name: "coordinated" }),
      IoU_list: [],
    };
  },
};
</script>

<style scoped>
.videoBox {
  position: absolute;
  width: 800px;
  height: 410px;
  left: 50%;
  margin-left: -400px;
  margin-top: 10px;
  z-index: 101;
}
.box {
  position: absolute;
  left: 50%;
  z-index: 100;
  top: 164px;
  margin-left: -225px;
  width: 1px;
  height: 1px;
}
.point {
  width: 5px;
  height: 5px;
  position: absolute;
  border-radius: 5px;
}
.setting {
  left: 400px;
  top: -30px;
}
.videoPlay {
  width: 800px;
  margin: 20px auto;
}
.line {
  margin: 20px auto;
}
.truthLabel {
  background: green;
  width: 15px;
  height: 15px;
  top: 6px;
  position: absolute;
}
.resultLabel {
  background: orange;
  width: 15px;
  height: 15px;
  top: 36px;
  position: absolute;
}
.truthText {
  width: 60px;
  left: 20px;
  position: absolute;
}
.resultText {
  width: 60px;
  left: 20px;
  top: 30px;
  position: absolute;
}
.centerLabel {
  margin: 20px auto;
  width: 150px;
  position: relative;
}
.labels {
  font-family: "STKaiti";
  font-size: 20px;
  font-weight: bold;
  position: absolute;
  width: 150px;
  left: -330px;
  top: -60px;
}
.switchStart {
  position: absolute;
  width: 300px;
  left: 100px;
  top: 10px;
}
.switchEnd {
  position: absolute;
  width: 300px;
  left: 350px;
  top: 10px;
}

.switchTxt{
  position:absolute;
  width: 300px;
  left: 600px;
  top: 10px;
}
</style>
