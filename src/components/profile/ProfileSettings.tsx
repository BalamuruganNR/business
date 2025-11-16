import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  User as UserIcon, 
  UserPlus, 
  Mail, 
  Share2, 
  LogOut, 
  Trash2, 
  Copy, 
  LockKeyhole,
  Save,
  Camera,
  Upload,
  Moon,
  Sun,
  Bell,
  BellOff
} from 'lucide-react';
import { 
  updateUserProfile, 
  getUserProfile, 
  logoutUser, 
  changeEmail,
  changePassword
} from '@/services/firebaseService';
import { 
  scheduleAccountForDeletion, 
  cancelScheduledDeletion 
} from '@/services/deleteAccountService';
import { auth, storage } from '@/config/firebase';
import { updateProfile, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  Dialog, 
  DialogTrigger, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { User } from "@/utils/types";
import { Avatar } from '@/components/ui/avatar';
import AdminBadgeManagement from './AdminBadgeManagement';
import { useTranslation } from 'react-i18next';

interface ProfileSettingsProps {
  onLogout: () => void;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ onLogout }) => {
  const { t, i18n } = useTranslation();
  // User profile data
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmDeletePassword, setConfirmDeletePassword] = useState('');
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [newProfilePic, setNewProfilePic] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteScheduled, setDeleteScheduled] = useState(false);
  const [deletionDate, setDeletionDate] = useState<Date | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [language, setLanguage] = useState<string>('en');
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    loadUserProfile();
    
    // Check if dark mode is enabled
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDarkMode);
    
    // Check notifications setting
    const notificationsEnabled = localStorage.getItem('notifications') !== 'false';
    setNotificationsEnabled(notificationsEnabled);
    
    // Load saved language preference
    const savedLanguage = localStorage.getItem('language') || 'en';
    setLanguage(savedLanguage);
    document.documentElement.lang = savedLanguage;
    
    // Set i18n language
    i18n.changeLanguage(savedLanguage);
  }, [i18n]);
  
  const loadUserProfile = async () => {
    setProfileLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user found');
      }
      
      setEmail(user.email || '');
      setUsername(user.displayName || '');
      setProfilePic(user.photoURL);
      
      const userProfile = await getUserProfile(user.uid);
      console.log("Loaded user profile:", userProfile);
      
      if (userProfile) {
        // Prioritize the displayName from Firebase Auth
        if (!user.displayName && userProfile.username) {
          setUsername(userProfile.username);
          // Update the displayName in Firebase Auth if missing
          await updateProfile(user, {
            displayName: userProfile.username
          });
        }
        
        // Set bio from Firestore
        if (userProfile.bio) {
          setBio(userProfile.bio);
        }
        
        // Update profile pic from Firestore if available and not in auth
        if (!user.photoURL && userProfile.profilePic) {
          setProfilePic(userProfile.profilePic);
        }
        
        // Check if account deletion is scheduled
        if (userProfile.scheduledForDeletion) {
          setDeleteScheduled(true);
          if (userProfile.deletionDate) {
            setDeletionDate(new Date(userProfile.deletionDate));
          }
        }
      }
    } catch (error: any) {
      console.error("Error loading profile:", error);
      toast.error(error.message || 'Failed to load profile');
    } finally {
      setProfileLoading(false);
    }
  };
  
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username) {
      toast.error('Username cannot be empty');
      return;
    }
    
    setLoading(true);
    
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user found');
      }
      
      let photoURL = user.photoURL;
      
      // Upload new profile picture if selected
      if (newProfilePic) {
        console.log("Uploading new profile picture");
        // Create a unique filename with timestamp
        const fileName = `${user.uid}_${Date.now()}_${newProfilePic.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const storageRef = ref(storage, `profile/${fileName}`);
        
        // Upload the file
        const uploadTask = await uploadBytes(storageRef, newProfilePic);
        console.log("Upload completed:", uploadTask);
        
        // Get download URL
        photoURL = await getDownloadURL(uploadTask.ref);
        console.log("New photo URL:", photoURL);
      }
      
      console.log("Updating profile with:", { username, photoURL, bio });
      
      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: username,
        photoURL: photoURL
      });
      
      // Update Firestore profile with properly typed userData
      await updateUserProfile(user.uid, {
        username: username,
        bio: bio || '',
        profilePic: photoURL
      });
      
      // Update local state
      setProfilePic(photoURL);
      setNewProfilePic(null);
      setProfilePicPreview(null);
      
      toast.success('Profile updated successfully');
      
      // Reload the profile to ensure we have the latest data
      setTimeout(() => {
        loadUserProfile();
      }, 1000);
      
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };
  
  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEmail) {
      toast.error('Please enter a new email address');
      return;
    }
    
    if (!password) {
      toast.error('Please enter your current password');
      return;
    }
    
    setLoading(true);
    
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error('No authenticated user found');
      }
      
      // Re-authenticate user before changing email
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      
      // Change email
      await changeEmail(newEmail);
      
      toast.success('Email updated successfully');
      setEmail(newEmail);
      setNewEmail('');
      setPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to change email');
    } finally {
      setLoading(false);
    }
  };
  
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword) {
      toast.error('Please enter a new password');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (!password) {
      toast.error('Please enter your current password');
      return;
    }
    
    setLoading(true);
    
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error('No authenticated user found');
      }
      
      // Re-authenticate user before changing password
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      
      // Change password
      await changePassword(newPassword);
      
      toast.success('Password updated successfully');
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };
  
  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      console.log("Selected new profile pic:", file.name);
      setNewProfilePic(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleDarkModeToggle = (checked: boolean) => {
    setDarkMode(checked);
    localStorage.setItem('darkMode', checked.toString());
    
    // Apply dark mode to document
    if (checked) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    toast.success(`${checked ? 'Dark' : 'Light'} mode enabled`);
  };
  
  const handleNotificationsToggle = (checked: boolean) => {
    setNotificationsEnabled(checked);
    localStorage.setItem('notifications', checked.toString());
    toast.success(`Notifications ${checked ? 'enabled' : 'disabled'}`);
  };
  
  const handleLogout = async () => {
    try {
      await logoutUser();
      onLogout();
    } catch (error: any) {
      toast.error(error.message || 'Failed to log out');
    }
  };
  
  const scheduleAccountDeletion = async () => {
    if (!confirmDeletePassword) {
      toast.error('Please enter your password to confirm deletion');
      return;
    }
    
    setLoading(true);
    
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error('No authenticated user found');
      }
      
      // Re-authenticate user before scheduling deletion
      const credential = EmailAuthProvider.credential(user.email, confirmDeletePassword);
      await reauthenticateWithCredential(user, credential);
      
      // Schedule account for deletion (30 days)
      await scheduleAccountForDeletion(user.uid);
      
      const deletionDate = new Date();
      deletionDate.setDate(deletionDate.getDate() + 30);
      
      setDeletionDate(deletionDate);
      setDeleteScheduled(true);
      setShowDeleteConfirm(false);
      setConfirmDeletePassword('');
      
      toast.success('Account scheduled for deletion in 30 days');
    } catch (error: any) {
      toast.error(error.message || 'Failed to schedule account deletion');
    } finally {
      setLoading(false);
    }
  };
  
  const cancelAccountDeletion = async () => {
    setLoading(true);
    
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user found');
      }
      
      // Cancel scheduled deletion
      await cancelScheduledDeletion(user.uid);
      
      setDeleteScheduled(false);
      setDeletionDate(null);
      
      toast.success('Account deletion cancelled');
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel account deletion');
    } finally {
      setLoading(false);
    }
  };
  
  const shareProfile = () => {
    const user = auth.currentUser;
    if (!user) return;
    
    const profileUrl = `${window.location.origin}/profile/${user.uid}`;
    
    if (navigator.share) {
      navigator.share({
        title: `${username}'s Zoophie Profile`,
        text: 'Check out my profile on Zoophie!',
        url: profileUrl
      }).catch((error) => {
        console.error('Error sharing profile:', error);
      });
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(profileUrl);
      toast.success('Profile link copied to clipboard');
    }
  };
  
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
    document.documentElement.lang = newLanguage;
    
    // Change i18n language
    i18n.changeLanguage(newLanguage);
    
    // Apply language change immediately
    toast.success(`${t('settings.languageChanged')} ${e.target.options[e.target.selectedIndex].text}`);
  };
  
  const handleSavePreferences = () => {
    // Already saved preferences when toggling individual settings,
    // this is just for user confirmation
    toast.success("All preferences saved successfully");
  };
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container max-w-4xl pt-8 pb-16 px-4">
        <h1 className="text-3xl font-bold mb-8">{t('settings.title')}</h1>
        
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid grid-cols-3 mb-8">
            <TabsTrigger value="profile">{t('settings.profile')}</TabsTrigger>
            <TabsTrigger value="account">{t('settings.account')}</TabsTrigger>
            <TabsTrigger value="preferences">{t('settings.preferences')}</TabsTrigger>
            {isAdmin && <TabsTrigger value="admin" className="flex-1">{t('settings.admin')}</TabsTrigger>}
          </TabsList>
          
          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your profile details and public information
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  {/* Profile Picture */}
                  <div className="flex flex-col items-center space-y-4">
                    <div 
                      className="relative h-24 w-24 rounded-full overflow-hidden cursor-pointer"
                      onClick={handleUploadClick}
                    >
                      {(profilePicPreview || profilePic) ? (
                        <img 
                          src={profilePicPreview || profilePic || ''} 
                          alt="Profile" 
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-muted flex items-center justify-center">
                          <UserIcon className="h-10 w-10 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Camera className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={handleUploadClick}>
                      <Upload className="mr-2 h-4 w-4" />
                      Change Picture
                    </Button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleProfilePicChange} 
                      accept="image/*" 
                      className="hidden"
                      key={profilePic || "default"}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        placeholder="Your username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={loading || profileLoading}
                      />
                      <p className="text-xs text-muted-foreground">
                        This is your public display name
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        placeholder="Tell others about yourself..."
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        disabled={loading || profileLoading}
                        rows={4}
                      />
                      <p className="text-xs text-muted-foreground">
                        Briefly describe yourself or your interests
                      </p>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={loading || profileLoading}
                    className="w-full sm:w-auto"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Account Tab */}
          <TabsContent value="account">
            <div className="space-y-6">
              {/* Email Change Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Email Address</CardTitle>
                  <CardDescription>
                    Update your email address
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <form onSubmit={handleEmailChange} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-email">Current Email</Label>
                      <Input
                        id="current-email"
                        value={email}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="new-email">New Email</Label>
                      <Input
                        id="new-email"
                        type="email"
                        placeholder="Enter new email address"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email-password">Current Password</Label>
                      <Input
                        id="email-password"
                        type="password"
                        placeholder="Enter your current password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                      />
                      <p className="text-xs text-muted-foreground">
                        We need your current password to verify it's you
                      </p>
                    </div>
                    
                    <Button 
                      type="submit" 
                      disabled={loading || !newEmail || !password}
                    >
                      {loading ? 'Updating...' : 'Update Email'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
              
              {/* Password Change Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>
                    Update your password to keep your account secure
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input
                        id="current-password"
                        type="password"
                        placeholder="Enter current password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={loading}
                      />
                      <p className="text-xs text-muted-foreground">
                        Password must be at least 8 characters long
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      disabled={loading || !password || !newPassword || !confirmPassword}
                    >
                      {loading ? 'Updating...' : 'Update Password'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
              
              {/* Account Actions Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Account Actions</CardTitle>
                  <CardDescription>
                    Manage your account settings and actions
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="space-y-0.5">
                      <h4 className="font-medium">Share Profile</h4>
                      <p className="text-sm text-muted-foreground">Share your profile with others</p>
                    </div>
                    <Button onClick={shareProfile} variant="outline">
                      <Share2 className="mr-2 h-4 w-4" />
                      Share
                    </Button>
                  </div>
                  
                  <div className="h-[1px] w-full bg-border my-4" />
                  
                  <div className="flex justify-between items-center">
                    <div className="space-y-0.5">
                      <h4 className="font-medium">Log Out</h4>
                      <p className="text-sm text-muted-foreground">Sign out of your account</p>
                    </div>
                    <Button onClick={handleLogout} variant="outline">
                      <LogOut className="mr-2 h-4 w-4" />
                      Log Out
                    </Button>
                  </div>
                  
                  <div className="h-[1px] w-full bg-border my-4" />
                  
                  {deleteScheduled ? (
                    <div className="flex justify-between items-center">
                      <div className="space-y-0.5">
                        <h4 className="font-medium text-destructive">Deletion Scheduled</h4>
                        <p className="text-sm text-muted-foreground">
                          Your account will be deleted on {deletionDate?.toLocaleDateString()}
                        </p>
                      </div>
                      <Button onClick={cancelAccountDeletion} variant="outline">
                        Cancel Deletion
                      </Button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <div className="space-y-0.5">
                        <h4 className="font-medium text-destructive">Delete Account</h4>
                        <p className="text-sm text-muted-foreground">
                          Permanently delete your account and all your data
                        </p>
                      </div>
                      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                        <DialogTrigger asChild>
                          <Button variant="destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Delete Account</DialogTitle>
                            <DialogDescription>
                              This action cannot be undone. Your account will be scheduled for deletion 
                              and permanently removed after 30 days.
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4 py-4">
                            <p className="text-sm text-muted-foreground">
                              Please enter your password to confirm deletion:
                            </p>
                            <Input
                              type="password"
                              placeholder="Enter your password"
                              value={confirmDeletePassword}
                              onChange={(e) => setConfirmDeletePassword(e.target.value)}
                            />
                          </div>
                          
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button 
                              variant="destructive" 
                              onClick={scheduleAccountDeletion}
                              disabled={!confirmDeletePassword || loading}
                            >
                              {loading ? 'Processing...' : 'Confirm Deletion'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Preferences Tab */}
          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.preferences')}</CardTitle>
                <CardDescription>
                  {t('settings.updateProfileDetails')}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{t('settings.appearance')}</h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="dark-mode">{t('settings.darkMode')}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t('settings.lightDarkTheme')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Sun className="h-4 w-4 text-muted-foreground" />
                      <Switch 
                        id="dark-mode"
                        checked={darkMode}
                        onCheckedChange={handleDarkModeToggle}
                      />
                      <Moon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{t('settings.notifications')}</h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="notifications">{t('settings.pushNotifications')}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t('settings.receiveNotifications')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="notifications"
                        checked={notificationsEnabled}
                        onCheckedChange={handleNotificationsToggle}
                      />
                      {notificationsEnabled ? (
                        <Bell className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <BellOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{t('settings.language')}</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="language">{t('settings.displayLanguage')}</Label>
                    <select 
                      id="language"
                      className="w-full p-2 rounded-md border border-input bg-background dark:bg-gray-800 dark:border-gray-700"
                      value={language}
                      onChange={handleLanguageChange}
                    >
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="de">Deutsch</option>
                      <option value="hi">हिन्दी</option>
                      <option value="ta">தமிழ்</option>
                    </select>
                    <p className="text-xs text-muted-foreground">
                      {t('settings.changesImmediate')}
                    </p>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter>
                <Button onClick={handleSavePreferences} className="ml-auto">
                  <Save className="mr-2 h-4 w-4" />
                  {t('settings.savePreferences')}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Admin section */}
          {isAdmin && (
            <TabsContent value="admin" className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">Admin Controls</h2>
                <p className="text-sm text-muted-foreground">
                  Special controls for administrators
                </p>
              </div>
              
              <AdminBadgeManagement />
              
              {/* Other admin controls */}
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>
                    Manage user accounts and permissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* User management features would go here */}
                  <p className="text-sm text-muted-foreground">Admin user management features are under development.</p>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>
      
      <Footer />
    </div>
  );
};

export default ProfileSettings; 