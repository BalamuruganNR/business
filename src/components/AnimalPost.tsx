import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Share2, Award } from 'lucide-react';
import { AnimalPost as AnimalPostType } from '../utils/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface AnimalPostProps {
  post: AnimalPostType;
}

const AnimalPost: React.FC<AnimalPostProps> = ({ post }) => {
  const [liked, setLiked] = useState(false);
  
  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLiked(!liked);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const postUrl = window.location.origin + '/post/' + post.id;
    
    // If available, use the Web Share API
    if (navigator.share) {
      navigator.share({
        title: `${post.username}'s Post on Zoophie`,
        text: post.description.substring(0, 100) + (post.description.length > 100 ? '...' : ''),
        url: postUrl,
      })
      .catch((error) => {
        console.error('Error sharing', error);
      });
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(postUrl).then(
        () => {
          toast.success('Post link copied to clipboard');
        },
        () => {
          toast.error('Failed to copy link');
        }
      );
    }
  };

  const handleComment = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toast.info("Comment feature coming soon!");
  };

  return (
    <div className="post-card">
      {/* Post header */}
      <div className="flex items-center p-4 post-header">
        <div className="h-10 w-10 rounded-full overflow-hidden mr-3 border-2 border-primary relative">
          <img 
            src={post.userAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop"} 
            alt={`${post.username}'s profile`} 
            className="h-full w-full object-cover" 
          />
          {post.userBadge && (
            <div className="absolute -bottom-1 -right-1">
              <Award className="h-4 w-4 text-yellow-400 fill-yellow-400" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center">
            <p className="font-semibold text-sm">{post.username}</p>
            {post.userBadge && (
              <Badge variant="outline" className="ml-2 bg-yellow-50 text-xs border-yellow-200">
                Top Contributor
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{post.timestamp}</p>
        </div>
        <button className="text-sm text-muted-foreground p-2 hover:bg-muted rounded-full">•••</button>
      </div>
      
      {/* Post image */}
      <Link to={`/post/${post.id}`}>
        <div className="relative px-3 pt-1 pb-3">
          <img src={post.imageUrl} alt={post.description} className="post-image" />
          <div className="absolute bottom-6 right-6 species-tag">
            {post.species}
          </div>
          {post.adoptable && (
            <div className="absolute top-6 left-6 bg-accent text-white py-1 px-3 rounded-full text-xs font-semibold shadow-md">
              Adoptable
            </div>
          )}
        </div>
      </Link>
      
      {/* Post actions */}
      <div className="flex items-center px-4 py-2 post-actions">
        <button 
          className={cn("mr-4", liked ? "text-accent" : "")}
          onClick={handleLike}
        >
          <Heart className={cn("h-6 w-6", liked ? "fill-current" : "")} />
        </button>
        <button className="mr-4" onClick={handleComment}>
          <MessageCircle className="h-6 w-6" />
        </button>
        <button onClick={handleShare}>
          <Share2 className="h-6 w-6" />
        </button>
      </div>
      
      {/* Post details */}
      <div className="px-4 pb-4">
        <p className="font-semibold text-sm mb-1">{liked ? post.likes + 1 : post.likes} likes</p>
        <p className="text-sm mb-1">
          <span className="font-semibold">{post.username}</span> {post.description}
        </p>
        <button className="text-muted-foreground text-xs mt-1 hover:text-foreground">
          View all {post.comments} comments
        </button>
      </div>
    </div>
  );
};

export default AnimalPost;
