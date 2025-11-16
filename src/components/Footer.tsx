import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, MapPin, User, FolderTree, Book, DollarSign } from 'lucide-react';

const Footer: React.FC = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="footer-nav py-2">
      <div className="max-w-screen-md mx-auto flex justify-around items-center">
        <Link to="/" className={`p-2 ${isActive('/') ? 'text-primary' : 'text-muted-foreground'}`}>
          <Home className="h-6 w-6" />
        </Link>
        <Link to="/explore" className={`p-2 ${isActive('/explore') ? 'text-primary' : 'text-muted-foreground'}`}>
          <Search className="h-6 w-6" />
        </Link>
        <Link to="/map" className={`p-2 ${isActive('/map') ? 'text-primary' : 'text-muted-foreground'}`}>
          <MapPin className="h-6 w-6" />
        </Link>
        <Link to="/extinction-book" className={`p-2 ${isActive('/extinction-book') ? 'text-primary' : 'text-muted-foreground'}`}>
          <Book className="h-6 w-6" />
        </Link>
        <Link to="/donate" className={`p-2 ${isActive('/donate') ? 'text-primary' : 'text-muted-foreground'}`}>
          <DollarSign className="h-6 w-6" />
        </Link>
        <Link to="/collab" className={`p-2 ${isActive('/collab') ? 'text-primary' : 'text-muted-foreground'}`}>
          <FolderTree className="h-6 w-6" />
        </Link>
        <Link to="/profile" className={`p-2 ${isActive('/profile') ? 'text-primary' : 'text-muted-foreground'}`}>
          <User className="h-6 w-6" />
        </Link>
      </div>
    </div>
  );
};

export default Footer;
