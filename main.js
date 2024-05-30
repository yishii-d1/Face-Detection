

const video = document.getElementById("video")

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("./models"), //カメラの中の顔を探すmodule
  faceapi.nets.faceLandmark68Net.loadFromUri("./models"), //目、鼻、口を探すmodule
  faceapi.nets.faceRecognitionNet.loadFromUri("./models"), //顔付きボックス
  faceapi.nets.faceExpressionNet.loadFromUri("./models"), //表情を判断するmodule
  faceapi.nets.ageGenderNet.loadFromUri("./models"), //年齢性別を判断するmodule 
]).then(startVideo);

function startVideo() {
    navigator.mediaDevices.getUserMedia({ video: true })
    .then(function(stream){
        video.srcObject = stream;
    })
    .catch(function(err){
        console.log(err);
    });

}

video.addEventListener("play", () => {

  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);
  const displaySize = { width: video.width, height: video.height };

  faceapi.matchDimensions(canvas, displaySize);
  setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()) //カメラの中にいる顔をすべて認識
      .withFaceLandmarks() //目、鼻、口を探す
      .withFaceExpressions() ////表情を判断する
      .withAgeAndGender(); //年齢性別を判断する

    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height); //顔に付いて回るボックス
    faceapi.draw.drawDetections(canvas, resizedDetections); //顔に箱付きの表現
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections); //目鼻口点線表現
    faceapi.draw.drawFaceExpressions(canvas, resizedDetections); //感情情報表現
    resizedDetections.forEach((detection) => {
      //年齢、性別表現ボックス
      const box = detection.detection.box;
      const drawBox = new faceapi.draw.DrawBox(box, {
        label: Math.round(detection.age) + " year old " + detection.gender,
      });
      drawBox.draw(canvas);

      const Array = Object.entries(detection.expressions);
      const scoresArray = Array.map((i) => i[1]);
      const expressionsArray = Array.map((i) => i[0]);

      // 各表情の点数を比較・Maxを取得
      const scoreMax = Math.max.apply(null, scoresArray);
      // Maxの配列でのインデックスを取得。表情が格納された配列からインデックスで表情を取得
      const idx = scoresArray.findIndex((i) => i === scoreMax);
      const expression = expressionsArray[idx];

      const height = canvas.getAttribute("height");
      const width = canvas.getAttribute("width");

      // 画像をcnavas上に表示する
      const image = document.createElement("img");
      const imgWidth = width * 0.6;
      const imgHeight = height * 0.6;
      // const posX = width / 2;
      // const posY = height / 3;
      const posX = box._x;
      const posY = box._y;
      const ctx = canvas.getContext("2d");

      image.src = `./img/${expression}.jpg`;
      // document.body.appendChild(image);

      ctx.drawImage(image, posX, posY, imgWidth, imgHeight); 
      
      // setTimeout(function(){
      //   document.body.removeChild(image);
      // }, 1500);

    });
  }, 2000);
    

});







