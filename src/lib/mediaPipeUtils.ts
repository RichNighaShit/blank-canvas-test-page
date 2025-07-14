import { Pose } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';

export interface PoseLandmarks {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface PoseResults {
  poseLandmarks: PoseLandmarks[];
  poseWorldLandmarks?: PoseLandmarks[];
}

export class MediaPipePoseDetector {
  private pose: Pose | null = null;
  private camera: Camera | null = null;
  private onResultsCallback: ((results: PoseResults) => void) | null = null;

  async initialize(onResults: (results: PoseResults) => void) {
    try {
      this.onResultsCallback = onResults;
      
      this.pose = new Pose({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        }
      });

      this.pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: true,
        smoothSegmentation: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      this.pose.onResults(this.handleResults.bind(this));

      return true;
    } catch (error) {
      console.error('Failed to initialize MediaPipe Pose:', error);
      return false;
    }
  }

  private handleResults(results: PoseResults) {
    if (this.onResultsCallback) {
      this.onResultsCallback(results);
    }
  }

  async startCamera(videoElement: HTMLVideoElement) {
    if (!this.pose) {
      throw new Error('Pose detector not initialized');
    }

    try {
      this.camera = new Camera(videoElement, {
        onFrame: async () => {
          if (videoElement) {
            await this.pose!.send({ image: videoElement });
          }
        },
        width: 640,
        height: 480
      });

      await this.camera.start();
      return true;
    } catch (error) {
      console.error('Failed to start camera:', error);
      return false;
    }
  }

  async processImage(imageElement: HTMLImageElement) {
    if (!this.pose) {
      throw new Error('Pose detector not initialized');
    }

    try {
      await this.pose.send({ image: imageElement });
      return true;
    } catch (error) {
      console.error('Failed to process image:', error);
      return false;
    }
  }

  stopCamera() {
    if (this.camera) {
      this.camera.stop();
      this.camera = null;
    }
  }

  destroy() {
    this.stopCamera();
    this.pose = null;
    this.onResultsCallback = null;
  }
}

// Utility functions for pose analysis
export const calculateBodyProportions = (landmarks: PoseLandmarks[]) => {
  if (landmarks.length === 0) return null;

  // MediaPipe Pose landmarks indices
  const LEFT_SHOULDER = 11;
  const RIGHT_SHOULDER = 12;
  const LEFT_HIP = 23;
  const RIGHT_HIP = 24;
  const LEFT_ELBOW = 13;
  const RIGHT_ELBOW = 14;
  const LEFT_WRIST = 15;
  const RIGHT_WRIST = 16;
  const LEFT_KNEE = 25;
  const RIGHT_KNEE = 26;
  const LEFT_ANKLE = 27;
  const RIGHT_ANKLE = 28;

  const leftShoulder = landmarks[LEFT_SHOULDER];
  const rightShoulder = landmarks[RIGHT_SHOULDER];
  const leftHip = landmarks[LEFT_HIP];
  const rightHip = landmarks[RIGHT_HIP];
  const leftKnee = landmarks[LEFT_KNEE];
  const rightKnee = landmarks[RIGHT_KNEE];

  if (!leftShoulder || !rightShoulder) return null;

  // Calculate key measurements
  const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);
  const shoulderCenterX = (leftShoulder.x + rightShoulder.x) / 2;
  const shoulderCenterY = (leftShoulder.y + rightShoulder.y) / 2;

  let torsoHeight = 0;
  if (leftHip && rightHip) {
    const hipCenterY = (leftHip.y + rightHip.y) / 2;
    torsoHeight = Math.abs(hipCenterY - shoulderCenterY);
  }

  let legLength = 0;
  if (leftKnee && rightKnee && leftHip && rightHip) {
    const kneeCenterY = (leftKnee.y + rightKnee.y) / 2;
    const hipCenterY = (leftHip.y + rightHip.y) / 2;
    legLength = Math.abs(kneeCenterY - hipCenterY);
  }

  return {
    shoulderWidth,
    shoulderCenterX,
    shoulderCenterY,
    torsoHeight,
    legLength,
    bodyHeight: torsoHeight + legLength
  };
};

export const getOptimalClothingPosition = (landmarks: PoseLandmarks[], clothingType: string) => {
  const proportions = calculateBodyProportions(landmarks);
  if (!proportions) return { x: 0, y: 0, scale: 1.0 };

  const { shoulderWidth, shoulderCenterX, shoulderCenterY, torsoHeight } = proportions;
  
  let targetY = shoulderCenterY;
  let targetScale = shoulderWidth * 0.8; // Scale based on shoulder width
  
  switch (clothingType) {
    case 'top':
      targetY = shoulderCenterY - shoulderWidth * 0.3;
      targetScale = shoulderWidth * 0.9;
      break;
    case 'bottom':
      targetY = shoulderCenterY + torsoHeight * 0.5;
      targetScale = shoulderWidth * 0.8;
      break;
    case 'dress':
      targetY = shoulderCenterY - shoulderWidth * 0.1;
      targetScale = shoulderWidth * 1.2;
      break;
    case 'outerwear':
      targetY = shoulderCenterY - shoulderWidth * 0.2;
      targetScale = shoulderWidth * 0.95;
      break;
  }
  
  return {
    x: shoulderCenterX,
    y: targetY,
    scale: targetScale
  };
};

export const applyThinPlateSplineWarping = (
  ctx: CanvasRenderingContext2D, 
  clothingImg: HTMLImageElement, 
  landmarks: PoseLandmarks[], 
  position: any,
  warpIntensity: number = 0.5
) => {
  if (landmarks.length === 0) return;
  
  const LEFT_SHOULDER = 11;
  const RIGHT_SHOULDER = 12;
  const LEFT_HIP = 23;
  const RIGHT_HIP = 24;
  
  const leftShoulder = landmarks[LEFT_SHOULDER];
  const rightShoulder = landmarks[RIGHT_SHOULDER];
  const leftHip = landmarks[LEFT_HIP];
  const rightHip = landmarks[RIGHT_HIP];
  
  if (!leftShoulder || !rightShoulder) return;
  
  // Calculate body proportions for warping
  const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);
  const bodyHeight = leftHip && rightHip ? 
    Math.abs((leftHip.y + rightHip.y) / 2 - (leftShoulder.y + rightShoulder.y) / 2) : 
    shoulderWidth * 2;
  
  // Apply perspective transformation based on pose
  ctx.save();
  
  // Calculate rotation based on shoulder angle
  const shoulderAngle = Math.atan2(
    rightShoulder.y - leftShoulder.y,
    rightShoulder.x - leftShoulder.x
  );
  
  ctx.translate(position.x, position.y);
  ctx.rotate(shoulderAngle);
  ctx.scale(position.scale / clothingImg.width, position.scale / clothingImg.height);
  
  // Apply warping intensity
  if (warpIntensity > 0) {
    // Simple warping effect based on body shape
    const centerX = clothingImg.width / 2;
    const centerY = clothingImg.height / 2;
    
    // Apply slight distortion to match body shape
    ctx.transform(
      1 + warpIntensity * 0.1, // Slight horizontal stretch
      0,
      0,
      1 + warpIntensity * 0.2, // Slight vertical stretch
      0,
      0
    );
  }
  
  ctx.drawImage(
    clothingImg,
    -clothingImg.width / 2,
    -clothingImg.height / 2
  );
  
  ctx.restore();
}; 