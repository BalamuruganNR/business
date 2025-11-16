import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image, X, Upload, Camera, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const CreatePost: React.FC = () => {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [species, setSpecies] = useState('');
  const [location, setLocation] = useState('');
  const [isAdoptable, setIsAdoptable] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedImage) {
      toast.error("Please select an image for your post");
      return;
    }

    if (!species) {
      toast.error("Please specify the species/type of animal");
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call for Firebase storage upload
    setTimeout(() => {
      toast.success("Post created! Your animal post has been shared successfully");
      navigate('/');
      setIsSubmitting(false);
    }, 1500);
  };

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      setCameraStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setIsCameraOpen(true);
    } catch (err) {
      console.error('Error accessing camera:', err);
      toast.error("Could not access camera. Please check permissions.");
    }
  };

  const closeCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }
    setCameraStream(null);
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the current video frame to the canvas
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to data URL and set as selected image
        const imageUrl = canvas.toDataURL('image/jpeg');
        setSelectedImage(imageUrl);
        
        // Close camera
        closeCamera();
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-white dark:bg-card border-b border-border py-3 px-4 shadow-sm">
        <div className="flex justify-between items-center">
          <button onClick={() => navigate('/')} className="text-foreground">
            <X className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold">New Post</h1>
          <Button 
            disabled={!selectedImage || isSubmitting}
            onClick={handleSubmit}
            variant="ghost"
            className="text-primary font-semibold"
          >
            {isSubmitting ? 'Posting...' : 'Share'}
          </Button>
        </div>
      </header>

      <div className="max-w-md mx-auto p-4">
        {!selectedImage ? (
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center mb-6">
            <div className="mb-6">
              <Image className="h-16 w-16 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground mb-2">Select an image to upload</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="flex items-center gap-2" 
                onClick={() => fileInputRef.current?.click()}
              >
                <Folder className="h-5 w-5" />
                Gallery
              </Button>
              
              <Button 
                variant="outline" 
                className="flex items-center gap-2" 
                onClick={openCamera}
              >
                <Camera className="h-5 w-5" />
                Camera
              </Button>
              
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageChange}
              />
            </div>
          </div>
        ) : (
          <div className="mb-6">
            <div className="relative mb-2">
              <img 
                src={selectedImage} 
                alt="Selected" 
                className="w-full rounded-lg aspect-square object-cover" 
              />
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" /> 
                Choose Different
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1"
                onClick={openCamera}
              >
                <Camera className="h-4 w-4" /> 
                Take New Photo
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="species">
              Species/Type*
            </label>
            <Select value={species} onValueChange={setSpecies}>
              <SelectTrigger id="species">
                <SelectValue placeholder="Select species" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Dogs">Dog</SelectItem>
                <SelectItem value="Cats">Cat</SelectItem>
                <SelectItem value="Birds">Bird</SelectItem>
                <SelectItem value="Fish">Fish</SelectItem>
                <SelectItem value="Reptiles">Reptile</SelectItem>
                <SelectItem value="Exotic">Exotic</SelectItem>
                <SelectItem value="Farm">Farm Animal</SelectItem>
                <SelectItem value="Wildlife">Wildlife</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="location">
              Location (optional)
            </label>
            <Input
              id="location"
              placeholder="Where was this photo taken?"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="description">
              Description
            </label>
            <Textarea
              id="description"
              placeholder="Tell something about this animal..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="adoptable"
              checked={isAdoptable}
              onChange={(e) => setIsAdoptable(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="adoptable" className="text-sm font-medium">
              This animal is available for adoption
            </label>
          </div>

          <Button 
            disabled={!selectedImage || isSubmitting} 
            onClick={handleSubmit}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <span className="mr-2 animate-spin">⏳</span>
                Posting...
              </>
            ) : (
              'Share Post'
            )}
          </Button>
        </div>
      </div>

      {/* Camera Dialog */}
      <Dialog open={isCameraOpen} onOpenChange={(open) => !open && closeCamera()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Take a Photo</DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col items-center">
            <div className="relative w-full h-80 bg-black rounded-lg overflow-hidden">
              <video 
                ref={videoRef}
                autoPlay 
                playsInline 
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
            
            <canvas ref={canvasRef} className="hidden" />
            
            <div className="flex gap-4 mt-4">
              <Button variant="outline" onClick={closeCamera}>Cancel</Button>
              <Button onClick={capturePhoto} className="bg-primary">
                <Camera className="h-5 w-5 mr-2" /> Capture
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreatePost;
