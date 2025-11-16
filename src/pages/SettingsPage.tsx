import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Moon, Sun, Trash2, Mail, LogOut, Save } from 'lucide-react';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("animalover");
  const [email, setEmail] = useState("user@example.com");
  const [bio, setBio] = useState("Animal lover and wildlife photographer. Passionate about animal rescue and adoption.");
  const [isSaving, setSaving] = useState(false);
  
  const handleSaveChanges = () => {
    setSaving(true);
    // Simulate API call with setTimeout
    setTimeout(() => {
      // Save to localStorage for persistence across sessions
      localStorage.setItem('zoophie-user-profile', JSON.stringify({
        username,
        email,
        bio
      }));
      setSaving(false);
      toast.success("Account information saved successfully!");
    }, 800);
  };
  
  return (
    <div className="app-container min-h-screen">
      <Header />
      
      <div className="max-w-screen-sm mx-auto pt-6 px-4 pb-20">
        <div className="flex items-center mb-6">
          <Link to="/profile" className="mr-4">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
        
        <div className="bg-white dark:bg-card rounded-lg shadow-md overflow-hidden mb-6">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold">Account</h2>
          </div>
          
          <div className="p-4 space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1">Username</label>
              <Input 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium block mb-1">Email</label>
              <Input 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium block mb-1">Bio</label>
              <textarea 
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              ></textarea>
            </div>
            
            <Button onClick={handleSaveChanges} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
        
        <div className="bg-white dark:bg-card rounded-lg shadow-md overflow-hidden mb-6">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold">Appearance</h2>
          </div>
          
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Moon className="h-5 w-5 mr-3" />
                <div>
                  <p className="font-medium">Dark Mode</p>
                  <p className="text-sm text-muted-foreground">Switch between light and dark mode</p>
                </div>
              </div>
              <Switch />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-card rounded-lg shadow-md overflow-hidden mb-6">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold">Notifications</h2>
          </div>
          
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <p>Likes</p>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <p>Comments</p>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <p>Friend Requests</p>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <p>Adoption Alerts</p>
              <Switch defaultChecked />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-card rounded-lg shadow-md overflow-hidden mb-6">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold">Support</h2>
          </div>
          
          <div className="p-4 space-y-4">
            <div className="flex items-center">
              <Mail className="h-5 w-5 mr-3" />
              <div>
                <p className="font-medium">Contact Us</p>
                <a href="mailto:vikashspidey@gmail.com" className="text-sm text-primary">vikashspidey@gmail.com</a>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-4 mt-8">
          <Button variant="outline" className="w-full">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
          
          <Button variant="destructive" className="w-full">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Account
          </Button>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default SettingsPage;
