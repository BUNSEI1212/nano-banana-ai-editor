import { useMutation } from '@tanstack/react-query';
import { proxyGeminiService, GenerationRequest, EditRequest, QuotaError } from '../services/proxyGeminiService';
import { geminiService } from '../services/geminiService';
import { authService } from '../services/authService';
import { useAppStore } from '../store/useAppStore';
import { generateId } from '../utils/imageUtils';
import { Generation, Edit, Asset } from '../types';
import { electronService } from '../services/electronService';
import { updateCreditsDisplay } from '../components/CreditsDisplay';

export const useImageGeneration = () => {
  const { addGeneration, setIsGenerating, setCanvasImage, setCurrentProject, currentProject, showError } = useAppStore();

  const generateMutation = useMutation({
    mutationFn: async (request: GenerationRequest) => {
      // Check authentication based on environment
      if (electronService.isElectron()) {
        // In Electron, check credits instead of authentication
        const credits = await electronService.getRemainingCredits();
        if (credits <= 0) {
          throw new Error('额度不足，请购买更多额度');
        }
      } else {
        // In web environment, check authentication
        if (!authService.isAuthenticated()) {
          throw new Error('Please sign in to generate images');
        }
      }

      // Use different API based on environment
      if (electronService.isElectron()) {
        const result = await electronService.generateImage(request);
        console.log('Electron API result:', result);

        // The result structure is: { success: true, requestId: '...', result: { content: '...', ... } }
        if (result.result && result.result.content) {
          const parsedContent = JSON.parse(result.result.content);
          console.log('Parsed content:', parsedContent);
          const images = parsedContent.images || [];
          console.log('Extracted images:', images);
          return images;
        }
        console.log('No content in result.result');
        return [];
      } else {
        const images = await proxyGeminiService.generateImage(request);
        return images;
      }
    },
    onMutate: () => {
      setIsGenerating(true);
    },
    onSuccess: async (images, request) => {
      if (images.length > 0) {
        const outputAssets: Asset[] = images.map((imageUrl, index) => {
          // Check if the imageUrl is already a complete data URL or HTTP URL
          const isDataUrl = imageUrl.startsWith('data:');
          const isHttpUrl = imageUrl.startsWith('http://') || imageUrl.startsWith('https://');

          let finalUrl: string;
          let checksum: string;

          if (isDataUrl) {
            // Already a data URL
            finalUrl = imageUrl;
            checksum = imageUrl.split('base64,')[1]?.slice(0, 32) || imageUrl.slice(0, 32);
          } else if (isHttpUrl) {
            // HTTP URL from relay API
            finalUrl = imageUrl;
            checksum = imageUrl.slice(-32); // Use end of URL as checksum
          } else {
            // Assume it's base64 data (legacy format)
            finalUrl = `data:image/png;base64,${imageUrl}`;
            checksum = imageUrl.slice(0, 32);
          }

          return {
            id: generateId(),
            type: 'output',
            url: finalUrl,
            mime: 'image/png',
            width: 1024, // Default Gemini output size
            height: 1024,
            checksum
          };
        });

        const generation: Generation = {
          id: generateId(),
          prompt: request.prompt,
          parameters: {
            aspectRatio: '1:1',
            seed: request.seed,
            temperature: request.temperature
          },
          sourceAssets: request.referenceImage ? [{
            id: generateId(),
            type: 'original',
            url: `data:image/png;base64,${request.referenceImages[0]}`,
            mime: 'image/png',
            width: 1024,
            height: 1024,
            checksum: request.referenceImages[0].slice(0, 32)
          }] : request.referenceImages ? request.referenceImages.map((img, index) => ({
            id: generateId(),
            type: 'original' as const,
            url: `data:image/png;base64,${img}`,
            mime: 'image/png',
            width: 1024,
            height: 1024,
            checksum: img.slice(0, 32)
          })) : [],
          outputAssets,
          modelVersion: 'gemini-2.5-flash-image-preview',
          timestamp: Date.now()
        };

        addGeneration(generation);
        setCanvasImage(outputAssets[0].url);

        // Create project if none exists
        if (!currentProject) {
          const newProject = {
            id: generateId(),
            title: 'Untitled Project',
            generations: [generation],
            edits: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
          setCurrentProject(newProject);
        }

        // Update credits display in Electron environment (credits already deducted in main.js)
        if (electronService.isElectron()) {
          try {
            const remainingCredits = await electronService.getRemainingCredits();
            updateCreditsDisplay(remainingCredits);
          } catch (error) {
            console.error('Failed to update credits display:', error);
          }
        }
      }
      setIsGenerating(false);
    },
    onError: (error: any) => {
      console.error('Generation failed:', error);
      setIsGenerating(false);

      // Handle quota errors specially
      if (error?.error === 'Quota exceeded') {
        console.warn('Quota exceeded:', error.message);
        showError('配额已用完，请稍后再试或升级您的账户。');
        return;
      }

      // Handle content blocking errors
      if (error?.message?.includes('Content blocked')) {
        console.warn('Content blocked:', error.message);
        showError(error.message);
        return;
      }

      // Handle other errors
      showError(error?.message || '生成失败，请稍后重试。');
    }
  });

  return {
    generate: generateMutation.mutate,
    isGenerating: generateMutation.isPending,
    error: generateMutation.error
  };
};

export const useImageEditing = () => {
  const {
    addEdit,
    setIsGenerating,
    setCanvasImage,
    canvasImage,
    editReferenceImages,
    brushStrokes,
    selectedGenerationId,
    currentProject,
    seed,
    temperature,
    showError
  } = useAppStore();

  const editMutation = useMutation({
    mutationFn: async (instruction: string) => {
      // Always use canvas image as primary target if available, otherwise use first uploaded image
      const sourceImage = canvasImage || uploadedImages[0];
      if (!sourceImage) throw new Error('没有可编辑的图像');
      
      // Convert canvas image to base64
      let base64Image: string;
      if (sourceImage.includes('base64,')) {
        // Already a data URL, extract base64 part
        base64Image = sourceImage.split('base64,')[1];
      } else if (sourceImage.startsWith('http://') || sourceImage.startsWith('https://')) {
        // It's a URL, we need to download and convert to base64
        try {
          const response = await fetch(sourceImage);
          const blob = await response.blob();
          const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              resolve(result.split('base64,')[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          base64Image = base64Data;
        } catch (error) {
          console.error('Failed to download and convert image:', error);
          throw new Error('无法下载图像进行编辑，请重新上传图像');
        }
      } else {
        // Assume it's already base64 data
        base64Image = sourceImage;
      }
      
      // Get reference images for style guidance
      let referenceImages = editReferenceImages
        .filter(img => img.includes('base64,'))
        .map(img => img.split('base64,')[1]);
      
      let maskImage: string | undefined;
      let maskedReferenceImage: string | undefined;
      
      // Create mask from brush strokes if any exist
      if (brushStrokes.length > 0) {
        // Create a temporary image to get actual dimensions
        const tempImg = new Image();
        tempImg.src = sourceImage;
        await new Promise<void>((resolve) => {
          tempImg.onload = () => resolve();
        });
        
        // Create mask canvas with exact image dimensions
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = tempImg.width;
        canvas.height = tempImg.height;

        // Fill with pure black (RGB: 0,0,0) for unmasked areas
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw pure white strokes (RGB: 255,255,255) for masked areas
        ctx.strokeStyle = '#FFFFFF';
        ctx.fillStyle = '#FFFFFF';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalCompositeOperation = 'source-over';

        brushStrokes.forEach(stroke => {
          if (stroke.points.length >= 4) {
            // Use a slightly larger brush for the mask to ensure full coverage
            ctx.lineWidth = Math.max(stroke.brushSize, 10);
            ctx.beginPath();
            ctx.moveTo(stroke.points[0], stroke.points[1]);

            for (let i = 2; i < stroke.points.length; i += 2) {
              ctx.lineTo(stroke.points[i], stroke.points[i + 1]);
            }
            ctx.stroke();

            // Also fill circles at each point for better coverage
            for (let i = 0; i < stroke.points.length; i += 2) {
              ctx.beginPath();
              ctx.arc(stroke.points[i], stroke.points[i + 1], Math.max(stroke.brushSize, 10) / 2, 0, 2 * Math.PI);
              ctx.fill();
            }
          }
        });

        // Convert mask to base64
        const maskDataUrl = canvas.toDataURL('image/png');
        maskImage = maskDataUrl.split('base64,')[1];
        
        // Create masked reference image (original image with mask overlay)
        const maskedCanvas = document.createElement('canvas');
        const maskedCtx = maskedCanvas.getContext('2d')!;
        maskedCanvas.width = tempImg.width;
        maskedCanvas.height = tempImg.height;
        
        // Draw original image
        maskedCtx.drawImage(tempImg, 0, 0);
        
        // Draw mask overlay with transparency
        maskedCtx.globalCompositeOperation = 'source-over';
        maskedCtx.globalAlpha = 0.4;
       maskedCtx.fillStyle = '#A855F7';
        
        brushStrokes.forEach(stroke => {
          if (stroke.points.length >= 4) {
            maskedCtx.lineWidth = stroke.brushSize;
           maskedCtx.strokeStyle = '#A855F7';
            maskedCtx.lineCap = 'round';
            maskedCtx.lineJoin = 'round';
            maskedCtx.beginPath();
            maskedCtx.moveTo(stroke.points[0], stroke.points[1]);
            
            for (let i = 2; i < stroke.points.length; i += 2) {
              maskedCtx.lineTo(stroke.points[i], stroke.points[i + 1]);
            }
            maskedCtx.stroke();
          }
        });
        
        maskedCtx.globalAlpha = 1;
        maskedCtx.globalCompositeOperation = 'source-over';
        
        const maskedDataUrl = maskedCanvas.toDataURL('image/png');
        maskedReferenceImage = maskedDataUrl.split('base64,')[1];
        
        // Add the masked image as a reference for the model
        referenceImages = [maskedReferenceImage, ...referenceImages];
      }
      
      // Convert to backend expected format
      const backendRequest = {
        imageId: base64Image, // Backend expects imageId instead of originalImage
        instruction,
        mask: maskImage,
        refImages: [{
          mimeType: 'image/png',
          data: base64Image
        }].concat(referenceImages.length > 0 ? referenceImages.map(img => ({
          mimeType: 'image/png',
          data: img
        })) : [])
      };
      
      // Check authentication based on environment
      if (electronService.isElectron()) {
        // In Electron, check credits instead of authentication
        const credits = await electronService.getRemainingCredits();
        if (credits <= 0) {
          throw new Error('额度不足，请购买更多额度');
        }
      } else {
        // In web environment, check authentication
        if (!authService.isAuthenticated()) {
          throw new Error('Please sign in to edit images');
        }
      }

      // Use different API based on environment
      if (electronService.isElectron()) {
        const result = await electronService.editImage(backendRequest);
        console.log('Edit API result:', result);
        // Parse the content from Electron API response
        let images = [];
        if (result.result && result.result.images) {
          images = result.result.images;
        } else if (result.result && result.result.content) {
          const parsedContent = JSON.parse(result.result.content);
          images = parsedContent.images || [];
        }
        console.log('Extracted edit images:', images);
        return { images, maskedReferenceImage };
      } else {
        const images = await proxyGeminiService.editImage(backendRequest);
        return { images, maskedReferenceImage };
      }
    },
    onMutate: () => {
      setIsGenerating(true);
    },
    onSuccess: async ({ images, maskedReferenceImage }, instruction) => {
      if (images.length > 0) {
        const outputAssets: Asset[] = images.map((imageUrl, index) => {
          // Check if the imageUrl is already a complete data URL or HTTP URL
          const isDataUrl = imageUrl.startsWith('data:');
          const isHttpUrl = imageUrl.startsWith('http://') || imageUrl.startsWith('https://');

          let finalUrl: string;
          let checksum: string;

          if (isDataUrl) {
            // Already a data URL
            finalUrl = imageUrl;
            checksum = imageUrl.split('base64,')[1]?.slice(0, 32) || imageUrl.slice(0, 32);
          } else if (isHttpUrl) {
            // HTTP URL from relay API
            finalUrl = imageUrl;
            checksum = imageUrl.slice(-32); // Use end of URL as checksum
          } else {
            // Assume it's base64 data (legacy format)
            finalUrl = `data:image/png;base64,${imageUrl}`;
            checksum = imageUrl.slice(0, 32);
          }

          return {
            id: generateId(),
            type: 'output',
            url: finalUrl,
            mime: 'image/png',
            width: 1024,
            height: 1024,
            checksum
          };
        });

        // Create mask reference asset if we have one
        const maskReferenceAsset: Asset | undefined = maskedReferenceImage ? {
          id: generateId(),
          type: 'mask',
          url: `data:image/png;base64,${maskedReferenceImage}`,
          mime: 'image/png',
          width: 1024,
          height: 1024,
          checksum: maskedReferenceImage.slice(0, 32)
        } : undefined;

        const edit: Edit = {
          id: generateId(),
          parentGenerationId: selectedGenerationId || (currentProject?.generations[currentProject.generations.length - 1]?.id || ''),
          maskAssetId: brushStrokes.length > 0 ? generateId() : undefined,
          maskReferenceAsset,
          instruction,
          outputAssets,
          timestamp: Date.now()
        };

        addEdit(edit);
        
        // Automatically load the edited image in the canvas
        const { selectEdit, selectGeneration } = useAppStore.getState();
        setCanvasImage(outputAssets[0].url);
        selectEdit(edit.id);
        selectGeneration(null);

        // Update credits display in Electron environment (credits already deducted in main.js)
        if (electronService.isElectron()) {
          try {
            const remainingCredits = await electronService.getRemainingCredits();
            updateCreditsDisplay(remainingCredits);
          } catch (error) {
            console.error('Failed to update credits display:', error);
          }
        }
      }
      setIsGenerating(false);
    },
    onError: (error: any) => {
      console.error('Edit failed:', error);
      setIsGenerating(false);

      // Handle quota errors specially
      if (error?.error === 'Quota exceeded') {
        console.warn('Quota exceeded:', error.message);
        showError('配额已用完，请稍后再试或升级您的账户。');
        return;
      }

      // Handle content blocking errors
      if (error?.message?.includes('Content blocked')) {
        console.warn('Content blocked:', error.message);
        showError(error.message);
        return;
      }

      // Handle other errors
      showError(error?.message || '编辑失败，请稍后重试。');
    }
  });

  return {
    edit: editMutation.mutate,
    isEditing: editMutation.isPending,
    error: editMutation.error
  };
};