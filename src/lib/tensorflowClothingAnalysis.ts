import * as tf from "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import * as mobilenet from "@tensorflow-models/mobilenet";
import ColorThief from "colorthief";

// Interface definitions
export interface ClothingAnalysisResult {
  isClothing: boolean;
  category: string;
  style: string;
  colors: string[];
  occasions: string[];
  seasons: string[];
  tags: string[];
  confidence: number;
  reasoning: string;
}

interface Detection {
  bbox: [number, number, number, number];
  class: string;
  score: number;
}

// Category mapping from COCO-SSD to our wardrobe categories
const CATEGORY_MAP: { [key: string]: string } = {
  person: "ignore",
  tie: "accessories",
  handbag: "accessories",
  suitcase: "accessories",
  backpack: "accessories",
  umbrella: "accessories",
  // We'll need to infer clothing categories from context
  shirt: "tops",
  dress: "dresses",
  jacket: "outerwear",
  coat: "outerwear",
  sweater: "tops",
  pants: "bottoms",
  jeans: "bottoms",
  skirt: "bottoms",
  shoe: "shoes",
  sneaker: "shoes",
  boot: "shoes",
  sandal: "shoes",
  hat: "accessories",
  cap: "accessories",
  belt: "accessories",
  scarf: "accessories",
  glove: "accessories",
  sock: "accessories",
};

// Style mapping from MobileNet classifications to our style categories
const STYLE_MAP: { [key: string]: string } = {
  suit: "formal",
  tuxedo: "formal",
  gown: "formal",
  "cocktail dress": "elegant",
  "wedding dress": "formal",
  "business suit": "business",
  blazer: "business",
  casual: "casual",
  "polo shirt": "casual",
  "t-shirt": "casual",
  jeans: "casual",
  sneaker: "sporty",
  athletic: "sporty",
  tracksuit: "sporty",
  yoga: "sporty",
  vintage: "vintage",
  retro: "vintage",
  bohemian: "bohemian",
  boho: "bohemian",
  hippie: "bohemian",
  minimalist: "minimalist",
  simple: "minimalist",
  street: "streetwear",
  urban: "streetwear",
  "hip hop": "streetwear",
  elegant: "elegant",
  sophisticated: "elegant",
  chic: "elegant",
};

// Occasion inference mapping
const OCCASION_MAP: { [key: string]: string[] } = {
  tops: ["casual", "work"],
  bottoms: ["casual", "work"],
  dresses: ["casual", "work", "party", "formal"],
  outerwear: ["casual", "work", "travel"],
  shoes: ["casual", "work", "sport"],
  accessories: ["casual", "work", "party", "formal"],
};

export class TensorFlowClothingAnalyzer {
  private cocoModel: cocoSsd.ObjectDetection | null = null;
  private mobilenetModel: mobilenet.MobileNet | null = null;
  private colorThief: ColorThief | null = null;
  private isInitialized = false;

  constructor() {
    this.colorThief = new ColorThief();
  }

  /**
   * Initialize TensorFlow.js models
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log("Loading TensorFlow.js models...");

      // Set backend to webgl for better performance
      await tf.setBackend("webgl");

      // Load models in parallel for faster initialization
      const [cocoModel, mobilenetModel] = await Promise.all([
        cocoSsd.load({
          modelUrl:
            "https://tfhub.dev/tensorflow/tfjs-model/ssd_mobilenet_v2/1/default/1",
          base: "mobilenet_v2",
        }),
        mobilenet.load({
          version: 2,
          alpha: 1.0,
        }),
      ]);

      this.cocoModel = cocoModel;
      this.mobilenetModel = mobilenetModel;
      this.isInitialized = true;

      console.log("TensorFlow.js models loaded successfully");
    } catch (error) {
      console.error("Failed to load TensorFlow.js models:", error);
      throw new Error("Model initialization failed");
    }
  }

  /**
   * Analyze clothing item from image file or URL
   */
  async analyzeClothing(input: File | string): Promise<ClothingAnalysisResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const imageElement = await this.preprocessImage(input);

    try {
      // Step 1: Detect objects in the image
      console.log("Step 1: Detecting objects...");
      const detections = await this.detectObjects(imageElement);

      // Step 2: Filter for clothing items
      console.log("Step 2: Filtering clothing items...");
      const clothingDetections = this.filterClothingDetections(detections);

      if (clothingDetections.length === 0) {
        return {
          isClothing: false,
          category: "other",
          style: "unknown",
          colors: ["unknown"],
          occasions: ["casual"],
          seasons: this.getCurrentSeasons(),
          tags: [],
          confidence: 0.1,
          reasoning: "No clothing items detected in the image",
        };
      }

      // Step 3: Determine category from largest clothing detection
      console.log("Step 3: Determining category...");
      const mainDetection = clothingDetections[0]; // Largest by default
      const category = this.mapToCategory(mainDetection.class);

      // Step 4: Parallel feature extraction
      console.log("Step 4: Extracting features...");
      const [style, colors, customTags] = await Promise.all([
        this.analyzeStyle(imageElement),
        this.extractColors(imageElement),
        this.generateTags(imageElement),
      ]);

      // Step 5: Infer occasions and seasons
      console.log("Step 5: Inferring context...");
      const occasions = this.inferOccasions(category, style);
      const seasons = this.inferSeasons();

      const confidence = this.calculateConfidence(
        clothingDetections,
        style,
        colors,
      );

      return {
        isClothing: true,
        category,
        style,
        colors,
        occasions,
        seasons,
        tags: [],
        confidence,
        reasoning: `Detected ${mainDetection.class} with ${Math.round(mainDetection.score * 100)}% confidence. Classified as ${category} in ${style} style.`,
      };
    } catch (error) {
      console.error("Analysis failed:", error);

      // Fallback analysis
      return this.performFallbackAnalysis(imageElement);
    }
  }

  /**
   * Preprocess image for analysis
   */
  private async preprocessImage(
    input: File | string,
  ): Promise<HTMLImageElement> {
    const imageElement = new Image();
    imageElement.crossOrigin = "anonymous";

    return new Promise((resolve, reject) => {
      imageElement.onload = () => {
        // Resize if too large (max 512px for performance)
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const maxSize = 640; // Slightly larger for better accuracy
        let { width, height } = imageElement;

        if (width > maxSize || height > maxSize) {
          const scale = Math.min(maxSize / width, maxSize / height);
          width *= scale;
          height *= scale;
        }

        canvas.width = width;
        canvas.height = height;

        if (ctx) {
          ctx.drawImage(imageElement, 0, 0, width, height);
          // Convert back to image for consistent processing
          const resizedImage = new Image();
          resizedImage.crossOrigin = "anonymous";
          resizedImage.onload = () => resolve(resizedImage);
          resizedImage.src = canvas.toDataURL("image/jpeg", 0.9);
        } else {
          resolve(imageElement);
        }
      };

      imageElement.onerror = reject;

      if (typeof input === "string") {
        imageElement.src = input;
      } else {
        imageElement.src = URL.createObjectURL(input);
      }
    });
  }

  /**
   * Detect objects using COCO-SSD
   */
  private async detectObjects(
    imageElement: HTMLImageElement,
  ): Promise<Detection[]> {
    if (!this.cocoModel) throw new Error("COCO model not loaded");

    const predictions = await this.cocoModel.detect(imageElement);

    return predictions
      .map((pred) => ({
        bbox: pred.bbox,
        class: pred.class,
        score: pred.score,
      }))
      .sort((a, b) => b.score - a.score); // Sort by confidence
  }

  /**
   * Filter detections for clothing-related items
   */
  private filterClothingDetections(detections: Detection[]): Detection[] {
    const clothingKeywords = [
      "tie",
      "handbag",
      "suitcase",
      "backpack",
      "shirt",
      "dress",
      "jacket",
      "coat",
      "sweater",
      "pants",
      "jeans",
      "skirt",
      "shoe",
      "sneaker",
      "boot",
      "sandal",
      "hat",
      "cap",
      "belt",
      "scarf",
      "glove",
      "sock",
    ];

    return detections.filter(
      (detection) =>
        clothingKeywords.some((keyword) =>
          detection.class.toLowerCase().includes(keyword),
        ) && detection.score > 0.5, // Higher confidence threshold for better accuracy
    );
  }

  /**
   * Map detected object to our category system
   */
  private mapToCategory(detectedClass: string): string {
    const className = detectedClass.toLowerCase();

    // Direct mapping
    if (CATEGORY_MAP[className]) {
      return CATEGORY_MAP[className];
    }

    // Fuzzy matching for clothing terms
    if (
      className.includes("shirt") ||
      className.includes("blouse") ||
      className.includes("top") ||
      className.includes("sweater")
    ) {
      return "tops";
    }
    if (
      className.includes("pant") ||
      className.includes("jean") ||
      className.includes("trouser") ||
      className.includes("short")
    ) {
      return "bottoms";
    }
    if (className.includes("dress") || className.includes("gown")) {
      return "dresses";
    }
    if (
      className.includes("jacket") ||
      className.includes("coat") ||
      className.includes("blazer")
    ) {
      return "outerwear";
    }
    if (
      className.includes("shoe") ||
      className.includes("boot") ||
      className.includes("sneaker") ||
      className.includes("sandal")
    ) {
      return "shoes";
    }
    if (
      className.includes("bag") ||
      className.includes("hat") ||
      className.includes("cap") ||
      className.includes("scarf") ||
      className.includes("belt") ||
      className.includes("tie")
    ) {
      return "accessories";
    }

    // Default fallback
    return "tops";
  }

  /**
   * Analyze style using MobileNet classifications
   */
  private async analyzeStyle(imageElement: HTMLImageElement): Promise<string> {
    if (!this.mobilenetModel) return "casual";

    try {
      const predictions = await this.mobilenetModel.classify(imageElement);

      // Look for style-related terms in top predictions with higher confidence
      for (const prediction of predictions
        .slice(0, 3)
        .filter((p) => p.probability > 0.1)) {
        const className = prediction.className.toLowerCase();

        for (const [keyword, style] of Object.entries(STYLE_MAP)) {
          if (className.includes(keyword)) {
            return style;
          }
        }
      }

      // Fallback style inference based on prediction terms
      const topPrediction = predictions[0]?.className.toLowerCase() || "";

      if (
        topPrediction.includes("formal") ||
        topPrediction.includes("suit") ||
        topPrediction.includes("tuxedo") ||
        topPrediction.includes("gown")
      ) {
        return "formal";
      }
      if (
        topPrediction.includes("sport") ||
        topPrediction.includes("athletic") ||
        topPrediction.includes("gym")
      ) {
        return "sporty";
      }
      if (
        topPrediction.includes("elegant") ||
        topPrediction.includes("chic") ||
        topPrediction.includes("sophisticated")
      ) {
        return "elegant";
      }

      return "casual";
    } catch (error) {
      console.warn("Style analysis failed:", error);
      return "casual";
    }
  }

  /**
   * Extract dominant colors from the image
   */
  private async extractColors(
    imageElement: HTMLImageElement,
  ): Promise<string[]> {
    try {
      if (!this.colorThief) return ["neutral"];

      // Get dominant color palette
      const palette = this.colorThief.getPalette(imageElement, 3);

      return palette
        .map((color: number[]) => {
          const [r, g, b] = color;
          return this.rgbToColorName(r, g, b);
        })
        .filter(
          (color: string, index: number, array: string[]) =>
            array.indexOf(color) === index, // Remove duplicates
        );
    } catch (error) {
      console.warn("Color extraction failed:", error);
      return ["neutral"];
    }
  }

  /**
   * Convert RGB values to color names
   */
  private rgbToColorName(r: number, g: number, b: number): string {
    // Simple color name mapping based on RGB values
    const colorRanges = {
      black: { r: [0, 50], g: [0, 50], b: [0, 50] },
      white: { r: [200, 255], g: [200, 255], b: [200, 255] },
      red: { r: [150, 255], g: [0, 100], b: [0, 100] },
      blue: { r: [0, 100], g: [0, 150], b: [150, 255] },
      green: { r: [0, 100], g: [150, 255], b: [0, 100] },
      yellow: { r: [200, 255], g: [200, 255], b: [0, 100] },
      orange: { r: [200, 255], g: [100, 200], b: [0, 100] },
      purple: { r: [100, 200], g: [0, 100], b: [150, 255] },
      pink: { r: [200, 255], g: [100, 200], b: [150, 255] },
      brown: { r: [100, 150], g: [50, 100], b: [20, 80] },
      gray: { r: [80, 180], g: [80, 180], b: [80, 180] },
      navy: { r: [0, 50], g: [0, 50], b: [100, 150] },
      beige: { r: [200, 255], g: [180, 220], b: [140, 180] },
    };

    for (const [colorName, ranges] of Object.entries(colorRanges)) {
      if (
        r >= ranges.r[0] &&
        r <= ranges.r[1] &&
        g >= ranges.g[0] &&
        g <= ranges.g[1] &&
        b >= ranges.b[0] &&
        b <= ranges.b[1]
      ) {
        return colorName;
      }
    }

    return "neutral";
  }

  /**
   * Generate custom tags from MobileNet predictions
   */
  private async generateTags(
    imageElement: HTMLImageElement,
  ): Promise<string[]> {
    // Return empty tags as requested
    return [];
  }

  /**
   * Infer occasions based on category and style
   */
  private inferOccasions(category: string, style: string): string[] {
    const baseOccasions = OCCASION_MAP[category] || ["casual"];

    // Add style-specific occasions
    if (style === "formal") {
      return [...baseOccasions, "formal", "business"];
    }
    if (style === "sporty") {
      return [...baseOccasions, "sport", "gym"];
    }
    if (style === "elegant") {
      return [...baseOccasions, "party", "date"];
    }
    if (style === "business") {
      return [...baseOccasions, "work", "business"];
    }

    return baseOccasions;
  }

  /**
   * Infer seasons based on current month (with some intelligent defaults)
   */
  private inferSeasons(): string[] {
    const currentMonth = new Date().getMonth() + 1; // 1-12

    if (currentMonth >= 3 && currentMonth <= 5) {
      return ["spring", "fall"]; // Transitional seasons
    }
    if (currentMonth >= 6 && currentMonth <= 8) {
      return ["summer", "spring"];
    }
    if (currentMonth >= 9 && currentMonth <= 11) {
      return ["fall", "winter"];
    }
    return ["winter", "spring"]; // Dec, Jan, Feb
  }

  /**
   * Get current seasons for fallback
   */
  private getCurrentSeasons(): string[] {
    return this.inferSeasons();
  }

  /**
   * Calculate overall confidence score
   */
  private calculateConfidence(
    clothingDetections: Detection[],
    style: string,
    colors: string[],
  ): number {
    let confidence = 0.5; // Base confidence

    // Detection confidence
    if (clothingDetections.length > 0) {
      const avgDetectionScore =
        clothingDetections.reduce((sum, det) => sum + det.score, 0) /
        clothingDetections.length;
      confidence += avgDetectionScore * 0.3;
    }

    // Style confidence (non-default styles get bonus)
    if (style !== "casual") {
      confidence += 0.1;
    }

    // Color confidence (more colors = better analysis)
    if (colors.length > 1 && !colors.includes("neutral")) {
      confidence += 0.1;
    }

    return Math.min(0.95, Math.max(0.2, confidence));
  }

  /**
   * Fallback analysis when TensorFlow analysis fails
   */
  private async performFallbackAnalysis(
    imageElement: HTMLImageElement,
  ): Promise<ClothingAnalysisResult> {
    console.log("Performing fallback analysis...");

    try {
      // Try to extract colors at least
      const colors = await this.extractColors(imageElement);

      return {
        isClothing: true,
        category: "tops", // Safe default
        style: "casual",
        colors: colors.length > 0 ? colors : ["neutral"],
        occasions: ["casual"],
        seasons: this.getCurrentSeasons(),
        tags: [],
        confidence: 0.3,
        reasoning: "Fallback analysis used due to detection failure",
      };
    } catch (error) {
      console.error("Fallback analysis also failed:", error);

      return {
        isClothing: true,
        category: "tops",
        style: "casual",
        colors: ["neutral"],
        occasions: ["casual"],
        seasons: ["spring", "summer", "fall", "winter"],
        tags: [],
        confidence: 0.1,
        reasoning: "Basic fallback used - manual review recommended",
      };
    }
  }
}

// Export a singleton instance
export const tensorflowClothingAnalyzer = new TensorFlowClothingAnalyzer();
