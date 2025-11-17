import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Camera, Search, Heart, Bell, MapPin, Mail, Share2, Settings, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import NotificationsPopover from '@/components/NotificationsPopover';
import { auth } from '@/config/firebase';
import { isAdmin } from '@/utils/adminService';
import { useTranslation } from 'react-i18next';

const Header: React.FC = () => {
  const { t } = useTranslation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdminUser, setIsAdminUser] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const user = auth.currentUser;
        if (user && user.email) {
          if (isAdmin(user.email)) {
            setIsAdminUser(true);
          }
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
      }
    };
    
    checkAdmin();
  }, []);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };
  
  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-border px-4 py-3 shadow-sm">
      <div className="flex justify-between items-center max-w-screen-md mx-auto">
        <Link to="/" className="flex items-center space-x-2">
          <img src="/Zoophi.png" alt="Zoophi" className="h-9 w-9 rounded-full" />
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Zoophi</span>
        </Link>
        
        <div className="flex items-center space-x-3">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary h-4 w-4" />
            <input 
              type="text" 
              placeholder={t('header.search')}
              className="pl-10 pr-4 py-1.5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm w-52 shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
          
          <div className="relative">
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative hover:bg-gray-100 dark:hover:bg-gray-800" 
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Heart className="h-5 w-5 text-accent dark:text-accent" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center">3</Badge>
            </Button>
            {showNotifications && <NotificationsPopover />}
          </div>
          
          <Link to="/notifications">
            <Button variant="ghost" size="icon" className="relative hover:bg-gray-100 dark:hover:bg-gray-800">
              <Bell className="h-5 w-5 text-foreground dark:text-white" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center">2</Badge>
            </Button>
          </Link>
          
          <Link to="/messages">
            <Button variant="ghost" size="icon" className="relative hover:bg-gray-100 dark:hover:bg-gray-800">
              <Mail className="h-5 w-5 text-foreground dark:text-white" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center">5</Badge>
            </Button>
          </Link>
          
          <Link to="/create">
            <Button variant="ghost" size="icon" className="hover:bg-gray-100 dark:hover:bg-gray-800">
              <Camera className="h-5 w-5 text-foreground dark:text-white" />
            </Button>
          </Link>
          
          <Link to="/settings">
            <Button variant="ghost" size="icon" className="hover:bg-gray-100 dark:hover:bg-gray-800">
              <Settings className="h-5 w-5 text-foreground dark:text-white" />
            </Button>
          </Link>
          
          {isAdminUser && (
            <Link to="/admin">
              <Button variant="ghost" size="icon" className="relative hover:bg-gray-100 dark:hover:bg-gray-800">
                <ShieldCheck className="h-5 w-5 text-amber-500 dark:text-amber-500" />
                <span className="sr-only">Admin</span>
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
