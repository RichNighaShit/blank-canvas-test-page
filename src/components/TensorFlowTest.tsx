import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  tensorflowClothingAnalyzer,
  ClothingAnalysisResult,
} from "@/lib/tensorflowClothingAnalysis";
import { useToast } from "@/hooks/use-toast";

export const TensorFlowTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ClothingAnalysisResult | null>(null);
  const { toast } = useToast();

  const testTensorFlow = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      // Test with a sample image URL (using a placeholder image service)
      const testImageUrl =
        "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80";

      console.log("Testing TensorFlow.js analysis...");
      const analysisResult =
        await tensorflowClothingAnalyzer.analyzeClothing(testImageUrl);

      setResult(analysisResult);

      toast({
        title: "TensorFlow.js Test Complete!",
        description: `Analysis completed with ${Math.round(analysisResult.confidence * 100)}% confidence`,
      });
    } catch (error) {
      console.error("TensorFlow.js test failed:", error);
      toast({
        title: "Test Failed",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const initializeModels = async () => {
    setIsLoading(true);

    try {
      await tensorflowClothingAnalyzer.initialize();
      toast({
        title: "Models Loaded!",
        description: "TensorFlow.js models are ready for analysis",
      });
    } catch (error) {
      console.error("Model initialization failed:", error);
      toast({
        title: "Initialization Failed",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>🧠 TensorFlow.js Integration Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Button
            onClick={initializeModels}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading
              ? "Loading Models..."
              : "Initialize TensorFlow.js Models"}
          </Button>

          <Button
            onClick={testTensorFlow}
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            {isLoading ? "Analyzing..." : "Test Analysis (Sample Image)"}
          </Button>
        </div>

        {result && (
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-green-700">Analysis Results:</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <strong>Is Clothing:</strong>{" "}
                {result.isClothing ? "✅ Yes" : "❌ No"}
              </div>
              <div>
                <strong>Confidence:</strong>{" "}
                {Math.round(result.confidence * 100)}%
              </div>
              <div>
                <strong>Category:</strong> {result.category}
              </div>
              <div>
                <strong>Style:</strong> {result.style}
              </div>
              <div>
                <strong>Colors:</strong> {result.colors.join(", ")}
              </div>
              <div>
                <strong>Occasions:</strong> {result.occasions.join(", ")}
              </div>
              <div>
                <strong>Seasons:</strong> {result.seasons.join(", ")}
              </div>
              <div>
                <strong>Tags:</strong> {result.tags.join(", ")}
              </div>
            </div>
            <div className="text-sm">
              <strong>Reasoning:</strong> {result.reasoning}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
