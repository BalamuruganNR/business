import React from 'react';
import { useParams } from 'react-router-dom';
import PublicProfile from './PublicProfile';

const PublicProfileWrapper: React.FC = () => {
  // Extract userId from URL params
  const { userId } = useParams<{ userId: string }>();
  
  if (!userId) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px]">
        <div className="text-center">
          <p className="text-lg font-medium text-destructive">Error</p>
          <p className="mt-2 text-sm text-muted-foreground">User ID not provided</p>
        </div>
      </div>
    );
  }
  
  return <PublicProfile userId={userId} />;
};

export default PublicProfileWrapper; 