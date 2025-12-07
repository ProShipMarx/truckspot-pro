import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useDeliveryConfirmation } from '@/hooks/useDeliveryConfirmation';
import { supabase } from '@/integrations/supabase/client';
import { Camera, MapPin, PenTool, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { MAX_DISTANCE_MILES } from '@/types/delivery';

interface CarrierDropOffProps {
  loadAssignmentId: string;
  destinationLat: number;
  destinationLng: number;
  destinationAddress: string;
  onSuccess?: () => void;
}

export const CarrierDropOff = ({
  loadAssignmentId,
  destinationLat,
  destinationLng,
  destinationAddress,
  onSuccess
}: CarrierDropOffProps) => {
  const { confirmation, isLoading, initiateCarrierDropOff } = useDeliveryConfirmation(loadAssignmentId);
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentDistance, setCurrentDistance] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Check current location on mount
  useEffect(() => {
    checkDistance();
  }, [destinationLat, destinationLng]);

  const checkDistance = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const R = 3959;
        const dLat = (destinationLat - position.coords.latitude) * Math.PI / 180;
        const dLng = (destinationLng - position.coords.longitude) * Math.PI / 180;
        const a = 
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(position.coords.latitude * Math.PI / 180) * Math.cos(destinationLat * Math.PI / 180) *
          Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        setCurrentDistance(distance);
        setLocationError(null);
      },
      (error) => {
        setLocationError('Unable to get your location. Please enable location services.');
        console.error('Geolocation error:', error);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Signature canvas drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSignature(canvas.toDataURL('image/png'));
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignature(null);
  };

  const uploadFile = async (file: File | Blob, path: string): Promise<string> => {
    const { data, error } = await supabase.storage
      .from('delivery-proofs')
      .upload(path, file, { upsert: true });
    
    if (error) throw error;
    
    const { data: urlData } = supabase.storage
      .from('delivery-proofs')
      .getPublicUrl(data.path);
    
    return urlData.publicUrl;
  };

  const handleSubmit = async () => {
    if (!photo) {
      toast.error('Please take a photo of the delivery');
      return;
    }
    if (!signature) {
      toast.error('Please capture a signature from the receiver');
      return;
    }
    if (currentDistance !== null && currentDistance > MAX_DISTANCE_MILES) {
      toast.error(`You must be within ${MAX_DISTANCE_MILES} miles of the destination`);
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const timestamp = Date.now();
      const photoPath = `${user.id}/${loadAssignmentId}/photo_${timestamp}.jpg`;
      const signaturePath = `${user.id}/${loadAssignmentId}/signature_${timestamp}.png`;

      // Upload photo
      const photoUrl = await uploadFile(photo, photoPath);

      // Convert signature data URL to blob and upload
      const signatureBlob = await fetch(signature).then(r => r.blob());
      const signatureUrl = await uploadFile(signatureBlob, signaturePath);

      // Initiate drop-off
      const result = await initiateCarrierDropOff(
        destinationLat,
        destinationLng,
        photoUrl,
        signatureUrl,
        notes
      );

      if (result.success) {
        onSuccess?.();
      }
    } catch (error: any) {
      console.error('Error submitting drop-off:', error);
      toast.error(error.message || 'Failed to submit drop-off');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  // Already confirmed
  if (confirmation?.carrier_confirmed_at) {
    return (
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="py-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
            <div>
              <h3 className="font-semibold text-green-400">Drop-off Confirmed</h3>
              <p className="text-sm text-muted-foreground">
                Waiting for receiver and shipper confirmation
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isWithinRange = currentDistance !== null && currentDistance <= MAX_DISTANCE_MILES;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Confirm Drop-off
        </CardTitle>
        <CardDescription>
          Complete the 3-way verification process
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Location Check */}
        <div className="rounded-lg border p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Location Verification</span>
            <Button variant="outline" size="sm" onClick={checkDistance}>
              Refresh
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">{destinationAddress}</p>
          
          {locationError ? (
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{locationError}</span>
            </div>
          ) : currentDistance !== null ? (
            <div className={`flex items-center gap-2 ${isWithinRange ? 'text-green-400' : 'text-destructive'}`}>
              {isWithinRange ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <span className="text-sm">
                {isWithinRange 
                  ? `Within range (${currentDistance.toFixed(2)} miles)`
                  : `Too far (${currentDistance.toFixed(2)} miles) - must be within ${MAX_DISTANCE_MILES} miles`
                }
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Checking location...</span>
            </div>
          )}
        </div>

        {/* Photo Capture */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Delivery Photo
          </Label>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoCapture}
            className="hidden"
          />
          {photoPreview ? (
            <div className="relative">
              <img 
                src={photoPreview} 
                alt="Delivery" 
                className="w-full h-48 object-cover rounded-lg"
              />
              <Button
                variant="secondary"
                size="sm"
                className="absolute bottom-2 right-2"
                onClick={() => photoInputRef.current?.click()}
              >
                Retake
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full h-32"
              onClick={() => photoInputRef.current?.click()}
            >
              <Camera className="h-6 w-6 mr-2" />
              Take Photo
            </Button>
          )}
        </div>

        {/* Signature Capture */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <PenTool className="h-4 w-4" />
              Receiver Signature
            </Label>
            {signature && (
              <Button variant="ghost" size="sm" onClick={clearSignature}>
                Clear
              </Button>
            )}
          </div>
          <div className="relative rounded-lg border bg-background/50">
            <canvas
              ref={canvasRef}
              width={350}
              height={150}
              className="w-full touch-none cursor-crosshair"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            {!signature && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-muted-foreground">
                Sign here
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label>Delivery Notes (optional)</Label>
          <Textarea
            placeholder="Any notes about the delivery..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Submit */}
        <Button
          className="w-full"
          disabled={!isWithinRange || !photo || !signature || isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Confirming...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Confirm Drop-off
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
