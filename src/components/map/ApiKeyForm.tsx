import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ApiKeyFormProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  onSubmit: () => void;
}

const ApiKeyForm: React.FC<ApiKeyFormProps> = ({ apiKey, setApiKey, onSubmit }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      toast.error("Please enter a Google Maps API key");
      return;
    }
    
    localStorage.setItem('google-maps-api-key', apiKey);
    toast.success("Google Maps API key saved!");
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-center text-muted-foreground">
        Please enter your Google Maps API key to enable the map
      </p>
      <Input
        type="text"
        placeholder="Enter Google Maps API key"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
      />
      <div className="flex justify-center">
        <Button type="submit">Save API Key</Button>
      </div>
    </form>
  );
};

export default ApiKeyForm;