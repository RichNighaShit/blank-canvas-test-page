import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const SimplePhotoUploadTest = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSimpleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("🔍 Simple upload handler called");
    
    if (!e.target.files || !e.target.files[0] || !user) {
      console.log("❌ No file or user");
      return;
    }

    const file = e.target.files[0];
    console.log("📁 File selected:", {
      name: file.name,
      size: file.size,
      type: file.type
    });

    setIsUploading(true);

    try {
      // Check Supabase connection first
      console.log("🔍 Testing Supabase connection...");
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      console.log("📦 Available buckets:", buckets);
      if (bucketsError) {
        console.error("❌ Buckets error:", bucketsError);
      }

      // Try uploading to user-photos bucket
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/test-upload-${Date.now()}.${fileExt}`;
      console.log("📤 Uploading with filename:", fileName);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("user-photos")
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error("❌ Upload error:", uploadError);
        throw uploadError;
      }

      console.log("✅ Upload successful:", uploadData);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("user-photos")
        .getPublicUrl(fileName);

      console.log("🔗 Public URL:", urlData.publicUrl);
      setUploadedUrl(urlData.publicUrl);

      toast({
        title: "✅ Upload Successful!",
        description: `File uploaded to: ${fileName}`,
      });

    } catch (error) {
      console.error("❌ Upload failed:", error);
      toast({
        title: "❌ Upload Failed",
        description: `Error: ${error?.message || 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (!user) {
    return <div>❌ User not authenticated</div>;
  }

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">🧪 Simple Photo Upload Test</h3>
      
      <div className="space-y-4">
        <div>
          <input
            type="file"
            accept="image/*"
            onChange={handleSimpleUpload}
            disabled={isUploading}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {isUploading && (
          <div className="text-blue-600">⏳ Uploading...</div>
        )}

        {uploadedUrl && (
          <div className="space-y-2">
            <div className="text-green-600">✅ Upload successful!</div>
            <img 
              src={uploadedUrl} 
              alt="Uploaded" 
              className="w-32 h-32 object-cover rounded border"
            />
            <div className="text-xs text-gray-500 break-all">{uploadedUrl}</div>
          </div>
        )}
      </div>
    </div>
  );
};
