# Face-API.js Models

This directory should contain the face-api.js model files for face detection.

## Required Models

Download the following models from the face-api.js repository and place them in this directory:

1. **tiny_face_detector_model-weights_manifest.json**
2. **tiny_face_detector_model-shard1.bin**
3. **face_landmark_68_model-weights_manifest.json**
4. **face_landmark_68_model-shard1.bin**

## Download Instructions

You can download these models from:
https://github.com/justadudewhohacks/face-api.js/tree/master/weights

Or use the following commands:

```bash
cd public/models

# Download Tiny Face Detector
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-shard1.bin

# Download Face Landmarks
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-weights_manifest.json
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-shard1.bin
```

## Alternative Setup

If you prefer, you can also serve these models from a CDN or another location and update the `modelBasePath` in the ColorExtractionService.

The system will work without these models (using fallback color extraction), but face detection will not be available.
