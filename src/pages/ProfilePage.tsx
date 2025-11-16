import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, LogOut, Award, Edit2, Share2, UserCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import ThemeToggle from '@/components/ThemeToggle';
import { isAdmin } from '@/utils/adminService';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { auth } from '@/config/firebase';
import { getUserProfile, updateUserProfile } from '@/services/firebaseService';
import { User } from '@/utils/types';

const ProfilePage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // State for edit dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedBio, setEditedBio] = useState('');

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        const currentUser = auth.currentUser;
        
        if (!currentUser) {
          console.error("No authenticated user found");
          return;
        }
        
        const userProfile = await getUserProfile(currentUser.uid);
        
        if (userProfile) {
          setUser(userProfile);
          setEditedName(userProfile.username);
          setEditedBio(userProfile.bio || '');
        } else {
          console.error("User profile not found");
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        toast.error("Failed to load user profile");
      } finally {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, []);

  // For share profile
  const handleShareProfile = () => {
    if (!user) return;
    
    const profileUrl = window.location.href;
    
    if (navigator.share) {
      navigator.share({
        title: `${user.username}'s Zoophie Profile`,
        text: `Check out ${user.username}'s profile on Zoophie!`,
        url: profileUrl,
      })
      .then(() => toast.success("Profile shared successfully!"))
      .catch((error) => console.log('Error sharing:', error));
    } else {
      // Fallback for browsers that don't support navigator.share
      navigator.clipboard.writeText(profileUrl)
        .then(() => toast.success("Profile link copied to clipboard!"))
        .catch(() => toast.error("Failed to copy profile link"));
    }
  };

  // For edit profile
  const handleSaveProfile = async () => {
    if (!user) return;
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast.error("You must be logged in to update your profile");
        return;
      }
      
      await updateUserProfile(currentUser.uid, {
        username: editedName,
        bio: editedBio
      });
      
      // Update local state
      setUser({
        ...user,
        username: editedName,
        bio: editedBio
      });
      
      toast.success("Profile updated successfully!");
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  // Posts data (mock data for now)
  const posts = [
    { id: 1, imageUrl: "https://source.unsplash.com/random/300x300?pet&sig=1" },
    { id: 2, imageUrl: "https://source.unsplash.com/random/300x300?dog&sig=2" },
    { id: 3, imageUrl: "https://source.unsplash.com/random/300x300?cat&sig=3" },
    { id: 4, imageUrl: "https://source.unsplash.com/random/300x300?bird&sig=4" },
    { id: 5, imageUrl: "https://source.unsplash.com/random/300x300?rabbit&sig=5" },
    { id: 6, imageUrl: "https://source.unsplash.com/random/300x300?hamster&sig=6" },
    { id: 7, imageUrl: "https://source.unsplash.com/random/300x300?turtle&sig=7" },
    { id: 8, imageUrl: "https://source.unsplash.com/random/300x300?fish&sig=8" },
    { id: 9, imageUrl: "https://source.unsplash.com/random/300x300?lizard&sig=9" },
  ];
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium">User profile not found</p>
          <Link to="/" className="mt-4 inline-block">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  const isUserAdmin = user.email ? isAdmin(user.email) : false;
  const postCount = user.posts || 0;
  const followerCount = user.followers || 0;
  const followingCount = user.following || 0;
  const userBadges = user.badges || [];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-screen-sm mx-auto pt-6 px-4 pb-20">
        {/* Profile header */}
        <div className="bg-white dark:bg-card rounded-xl shadow-md overflow-hidden p-6 mb-6">
          <div className="flex items-start">
            <div className="relative">
              <Avatar className="h-20 w-20 rounded-full border-4 border-primary">
                {user.profilePic ? (
                  <img src={user.profilePic} alt={user.username} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-muted">
                    <UserCircle className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </Avatar>
              {isUserAdmin && (
                <div className="absolute -top-1 -right-1 bg-amber-400 text-amber-950 rounded-full p-1 shadow-md" title="Admin Badge">
                  <Award className="h-4 w-4" />
                </div>
              )}
            </div>
            
            <div className="ml-4 flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-xl font-bold">{user.username}</h1>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div className="flex space-x-2">
                  <Link to="/settings">
                    <Button variant="ghost" size="icon">
                      <Settings className="h-5 w-5" />
                    </Button>
                  </Link>
                  <ThemeToggle />
                </div>
              </div>
              
              <div className="flex space-x-5 mt-4">
                <div className="text-center">
                  <p className="font-bold">{postCount}</p>
                  <p className="text-xs text-muted-foreground">Posts</p>
                </div>
                <div className="text-center">
                  <p className="font-bold">{followerCount}</p>
                  <p className="text-xs text-muted-foreground">Followers</p>
                </div>
                <div className="text-center">
                  <p className="font-bold">{followingCount}</p>
                  <p className="text-xs text-muted-foreground">Following</p>
                </div>
              </div>
            </div>
          </div>
          
          <p className="mt-4">{user.bio || 'No bio yet'}</p>
          
          <div className="mt-4 flex flex-wrap gap-2">
            {userBadges.map((badge, i) => (
              <div 
                key={i} 
                className={`flex items-center rounded-full px-3 py-1 text-xs ${
                  badge === 'Admin' 
                    ? 'bg-amber-100 text-amber-800 border-amber-300 border' 
                    : 'bg-yellow-50 text-yellow-800'
                }`}
              >
                <Award className="h-3 w-3 mr-1" />
                {badge}
              </div>
            ))}
          </div>
          
          <div className="mt-6 flex space-x-3">
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex-1">
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Your Profile</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Username</label>
                    <input 
                      type="text" 
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Bio</label>
                    <textarea
                      value={editedBio}
                      onChange={(e) => setEditedBio(e.target.value)}
                      className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                      rows={4}
                    />
                  </div>
                  <Button onClick={handleSaveProfile} className="w-full">Save Changes</Button>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button variant="outline" onClick={handleShareProfile}>
              <Share2 className="h-4 w-4 mr-2" />
              Share Profile
            </Button>
          </div>
        </div>
        
        {/* Profile content */}
        <Tabs defaultValue="posts">
          <TabsList className="w-full">
            <TabsTrigger value="posts" className="flex-1">Posts</TabsTrigger>
            <TabsTrigger value="saved" className="flex-1">Saved</TabsTrigger>
            <TabsTrigger value="tagged" className="flex-1">Tagged</TabsTrigger>
          </TabsList>
          
          <TabsContent value="posts" className="mt-4 grid grid-cols-3 gap-1">
            {posts.map((post) => (
              <div key={post.id} className="aspect-square bg-muted rounded-md overflow-hidden relative">
                <img src={post.imageUrl} alt="" className="h-full w-full object-cover" />
              </div>
            ))}
          </TabsContent>
          
          <TabsContent value="saved">
            <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg mt-4">
              <p className="text-muted-foreground text-center">Saved posts will appear here</p>
            </div>
          </TabsContent>
          
          <TabsContent value="tagged">
            <div className="flex items-center justify-center h-40 bg-muted/50 rounded-lg mt-4">
              <p className="text-muted-foreground text-center">Tagged posts will appear here</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default ProfilePage;
