// Install dependencies Done
// Import dependencies Done
// Setup webcam and canvas Done
// Define refrence to those Done
// Load Facemesh  Done
// Detect function Done
// Drawing utilities
// Load triangulation
// Setup triangle path
// Setup point drawing 
// Add drawMesh to detect funtion


import React, {useRef, useEffect} from 'react';
import './App.css';

//MediaPipe
import {Holistic} from "@mediapipe/holistic";
import * as holistic from "@mediapipe/holistic";
import {FaceMesh} from "@mediapipe/face_mesh";
import * as Facemesh from "@mediapipe/face_mesh";
import * as cam from "@mediapipe/camera_utils";
import { POSE_CONNECTIONS, FACEMESH_TESSELATION, HAND_CONNECTIONS} from "@mediapipe/holistic";
 

//Tensorflow
import * as tf from "@tensorflow/tfjs";
import * as facemesh from "@tensorflow-models/face-landmarks-detection";
import * as posenet from "@tensorflow-models/posenet";
import Webcam from 'react-webcam';
import { drawMesh } from "./utilities";
import { drawKeypoints,drawSkeleton } from "./utilities_posenet";


function App() {

  // Setup the reference
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  //MediaPipe Implementation
  var camera = null ;

  const connect = window.drawConnectors;
  const Landmark = window.drawLandmarks;


  //Holistic Implementation

  let activeEffect = 'mask';
  function onResults(results){
   
    canvasRef.current.width = webcamRef.current.video.videoWidth;
    canvasRef.current.height = webcamRef.current.video.videoHeight;

    const canvasElement = canvasRef.current;
    const canvasCtx = canvasElement.getContext("2d");
    canvasCtx.save();

    canvasCtx.clearRect(0,0,canvasElement.width,canvasElement.height);

    if (results.segmentationMask){

      canvasCtx.drawImage(
        results.segmentationMask,
        0,
        0,
        canvasElement.width,
        canvasElement.height
        );

        if (activeEffect === 'mask' || activeEffect === 'both'){

          // Only overwrite existing pixels.
           canvasCtx.globalCompositeOperation = 'source-in';
           canvasCtx.fillStyle = '#00FF007F';
           canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);

        }else {
 
          canvasCtx.globalCompositeOperation = 'source-out';
           canvasCtx.fillStyle = '#00FF007F';
           canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);
          

        }

        // Only overwrite missing pixels.
        canvasCtx.globalCompositeOperation = 'destination-atop';
        canvasCtx.drawImage(
        results.image, 0, 0, canvasElement.width, canvasElement.height);

 
      canvasCtx.globalCompositeOperation = 'source-over';
 
    }else  {

      canvasCtx.drawImage(
        results.image, 0, 0, canvasElement.width, canvasElement.height);

    }
  
  connect(canvasCtx, results.poseLandmarks, holistic.POSE_CONNECTIONS,
                 {color: 'white', lineWidth: 4});
  // Landmark(canvasCtx, results.poseLandmarks,
  //               {color: '#FF0000', lineWidth: 2});
  Landmark(canvasCtx, results.poseLandmarks, holistic.POSE_LANDMARKS_LEFT,
                  {color: 'white', lineWidth: 2, fillColor: 'rgb(255,138,0)'});
  Landmark(canvasCtx, results.poseLandmarks, holistic.POSE_LANDMARKS_RIGHT,
                  {color: 'white', lineWidth: 2, fillColor: 'rgb(0,217,231)'});                

  connect(canvasCtx, results.faceLandmarks, holistic.FACEMESH_TESSELATION,
                 {color: 'white', lineWidth: 1});
  connect(canvasCtx, results.leftHandLandmarks, holistic.HAND_CONNECTIONS,
                 {color: 'white', lineWidth: 5});
  Landmark(canvasCtx, results.leftHandLandmarks,
                {color: 'white', lineWidth: 2, fillColor: 'rgb(255,138,0)'});
  connect(canvasCtx, results.rightHandLandmarks, holistic.HAND_CONNECTIONS,
                 {color: 'white', lineWidth: 5});
  Landmark(canvasCtx, results.rightHandLandmarks,
                {color: 'white', lineWidth: 2, fillColor: 'rgb(0,217,231)'});
  
  canvasCtx.restore();

  }

  useEffect(()=>{
  
    const holiStic = new Holistic({
      locateFile:(file)=>{
     
        return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`;

      }
    });

    holiStic.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      smoothSegmentation: true,
      refineFaceLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
    holiStic.onResults(onResults);

    if (typeof webcamRef.current!=="undefined" && webcamRef.current!==null){
      camera = new cam.Camera(webcamRef.current.video,{
        onFrame:async()=>{
          await holiStic.send({image:webcamRef.current.video})
        },
        width:640,
        height:480

      })
      camera.start();
    }

  })   






  /* Facemesh Implementation

  function onResults(results){
   
    canvasRef.current.width = webcamRef.current.video.videoWidth;
    canvasRef.current.height = webcamRef.current.video.videoHeight;

    const canvasElement = canvasRef.current;
    const canvasCtx = canvasElement.getContext("2d")
    canvasCtx.save();

    canvasCtx.clearRect(0,0,canvasElement.width,canvasElement.height);
    canvasCtx.drawImage(
      results.image,
      0,
      0,
      canvasElement.width,
      canvasElement.height
      );

      if(results.multiFaceLandmarks){

        for (const landmarks of results.multiFaceLandmarks) {
          connect(canvasCtx, landmarks, Facemesh.FACEMESH_TESSELATION,
                         {color: '#C0C0C070', lineWidth: 0});
          connect(canvasCtx, landmarks, Facemesh.FACEMESH_RIGHT_EYE, {color: '#FF3030', lineWidth: 0});
          connect(canvasCtx, landmarks, Facemesh.FACEMESH_RIGHT_EYEBROW, {color: '#FF3030', lineWidth: 0});
          connect(canvasCtx, landmarks, Facemesh.FACEMESH_RIGHT_IRIS, {color: '#FF3030', lineWidth: 0});
          connect(canvasCtx, landmarks, Facemesh.FACEMESH_LEFT_EYE, {color: '#30FF30', lineWidth: 0});
          connect(canvasCtx, landmarks, Facemesh.FACEMESH_LEFT_EYEBROW, {color: '#30FF30', lineWidth: 0});
          connect(canvasCtx, landmarks, Facemesh.FACEMESH_LEFT_IRIS, {color: '#30FF30', lineWidth: 0});
          connect(canvasCtx, landmarks, Facemesh.FACEMESH_FACE_OVAL, {color: '#E0E0E0', lineWidth: 0});
          connect(canvasCtx, landmarks, Facemesh.FACEMESH_LIPS, {color: '#E0E0E0', lineWidth: 0});
        }

      }


  }

  useEffect(()=>{
  
    const faceMesh = new FaceMesh({
      locateFile:(file)=>{
     
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;

      }
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    faceMesh.onResults(onResults);

    if (typeof webcamRef.current!=="undefined" && webcamRef.current!==null){
      camera = new cam.Camera(webcamRef.current.video,{
        onFrame:async()=>{
          await faceMesh.send({image:webcamRef.current.video})
        },
        width:640,
        height:480

      })
      camera.start();
    }

  })  */

  
 








/*  Tensorflow codes

  //  Load posenet for pose detection
  const runPosenet = async () => {
    const net = await posenet.load({
      inputResolution: { width: 640, height: 480 },
      scale: 0.5,
    });

    setInterval(() => {
      detect(net);
    }, 100);

  } 



  //Load Facemesh
  //const runFacemesh = async () => {
    // OLD MODEL
    // const net = await facemesh.load({
    //   inputResolution: { width: 640, height: 480 },
    //   scale: 0.8,
    // });

    //  NEW MODEL
    // const net = await facemesh.load(facemesh.SupportedPackages.mediapipeFacemesh);
    
    // setInterval(() => {
    //   detect(net);
    // }, 100);
  // };

  const detect = async (net) => {
    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4
    ) {
      // Get Video Properties
      const video = webcamRef.current.video;
      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;

      // Set video width
      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;

      // Set canvas width
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      // Make Face Detections 
      // OLD MODEL
        //  const face = await net.estimateFaces(video);

      // NEW MODEL
      // const face = await net.estimateFaces({input:video});
      //    console.log(face);

      // Make Pose Detections
      const pose = await net.estimateSinglePose(video);
      console.log(pose);

      drawCanvas(pose, video, videoWidth, videoHeight, canvasRef);



      // Get canvas context for Drawing
      // const ctx = canvasRef.current.getContext("2d");
      // requestAnimationFrame(()=>{drawMesh(face, ctx)});
      //drawMesh(face, ctx);
    }
  };


  //runFacemesh();


  const drawCanvas = (pose, video, videoWidth, videoHeight, canvas) => {
    const ctx = canvas.current.getContext("2d");
    canvas.current.width = videoWidth;
    canvas.current.height = videoHeight;

    drawKeypoints(pose["keypoints"], 0.6, ctx);
    drawSkeleton(pose["keypoints"], 0.7, ctx);
  };

  runPosenet();

  // useEffect(()=>{runFacemesh()}, []);


 */ 

  return (
    <div className="App">
      <header className="App-header">
      <Webcam
          ref={webcamRef}
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            borderRadius:10,
            textAlign: "center",
            zindex: 9,
            width: 640,
            height: 480,
          }}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            borderRadius:10,
            textAlign: "center",
            zindex: 9,
            width: 640,
            height: 480,
          }}
        />
      </header>
    </div>
  );
}

export default App;
