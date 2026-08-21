import React, { useRef } from "react";
import { Button } from "../ui/button";
import { UploadCloud, CameraOff } from "lucide-react";
import { TypoSection, TypoCaption } from "@/components/shared/Typography";

interface MediaFallbackProps {
  message?: string;
  onFileSelect: (file: File) => void;
  accept?: string;
}

export const MediaFallback: React.FC<MediaFallbackProps> = ({
  message = "Camera access unavailable",
  onFileSelect,
  accept = "image/*",
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center gap-6">
      <div className="rounded-full bg-muted p-4">
        <CameraOff className="w-8 h-8 text-muted-foreground" />
      </div>

      <div className="space-y-2 max-w-sm">
        <TypoSection>{message}</TypoSection>
        <TypoCaption as="p">
          You can allow camera access in your browser settings, or choose an image from your device
          instead.
        </TypoCaption>
      </div>

      <input
        type="file"
        accept={accept}
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      <Button onClick={() => fileInputRef.current?.click()} className="mt-2">
        <UploadCloud className="mr-2 h-4 w-4" />
        Upload Image
      </Button>
    </div>
  );
};
