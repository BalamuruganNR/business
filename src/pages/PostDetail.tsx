import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, MessageCircle, Share2 } from 'lucide-react';
import { mockPosts } from '@/utils/mockData';
import { AnimalPost as AnimalPostType } from '@/utils/types';
import { toast } from 'sonner';

const PostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<AnimalPostType | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    // Simulate data fetch
    setTimeout(() => {
      const foundPost = mockPosts.find(p => p.id === id) || null;
      setPost(foundPost);
      setLoading(false);
    }, 500);
  }, [id]);

  const handleShare = () => {
    const postUrl = window.location.href;
    
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
  
  const handleComment = () => {
    toast.info("Comment feature coming soon!");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg">
          <div className="animate-spin rounded-full h-14 w-14 border-b-4 border-primary mx-auto"></div>
          <p className="mt-6 text-lg font-medium text-foreground">Loading post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
          <div className="text-destructive text-6xl mb-4">😢</div>
          <h2 className="text-2xl font-bold mb-3">Post Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The post you're looking for doesn't exist or has been removed.
          </p>
          <button 
            onClick={() => navigate('/')}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Go back to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-white border-b border-border py-3 px-4 shadow-sm">
        <div className="flex items-center">
          <button 
            onClick={() => navigate('/')} 
            className="mr-4 p-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold">Post Detail</h1>
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-4">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {/* Post header */}
          <div className="flex items-center p-4 border-b border-border">
            <div className="h-12 w-12 rounded-full bg-secondary overflow-hidden mr-3 border-2 border-primary">
              <img 
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop" 
                alt={`${post.username}'s profile`} 
                className="h-full w-full object-cover" 
              />
            </div>
            <div>
              <p className="font-semibold">{post.username}</p>
              <p className="text-xs text-muted-foreground">{post.timestamp}</p>
            </div>
          </div>
          
          {/* Post image */}
          <div className="relative">
            <img 
              src={post.imageUrl} 
              alt={post.description} 
              className="w-full object-cover max-h-[70vh]" 
            />
            <div className="absolute bottom-4 right-4 species-tag">
              {post.species}
            </div>
          </div>
          
          {/* Post actions */}
          <div className="flex items-center p-4 post-actions">
            <button 
              className={`mr-4 ${liked ? "text-accent" : ""}`}
              onClick={() => setLiked(!liked)}
            >
              <Heart className={`h-7 w-7 ${liked ? "fill-current" : ""}`} />
            </button>
            <button className="mr-4" onClick={handleComment}>
              <MessageCircle className="h-7 w-7" />
            </button>
            <button onClick={handleShare}>
              <Share2 className="h-7 w-7" />
            </button>
          </div>
          
          {/* Post details */}
          <div className="px-4 pb-6">
            <p className="font-semibold mb-2">{liked ? post.likes + 1 : post.likes} likes</p>
            <p className="text-sm mb-4">
              <span className="font-semibold">{post.username}</span> {post.description}
            </p>
            
            <div className="border-t border-border pt-4 mt-2">
              <h3 className="font-semibold mb-3">Comments ({post.comments})</h3>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-muted-foreground text-sm text-center">
                  Comments are not implemented in this version
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
