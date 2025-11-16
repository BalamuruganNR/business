import React from 'react';
import { Avatar } from '@/components/ui/avatar';

const NotificationsPopover: React.FC = () => {
  const notifications = [
    {
      id: 1,
      type: 'friendRequest',
      user: 'Jane Cooper',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop',
      time: '2 hours ago'
    },
    {
      id: 2,
      type: 'comment',
      user: 'Robert Fox',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=100&auto=format&fit=crop',
      time: '3 hours ago',
      post: 'Your husky photo'
    },
    {
      id: 3,
      type: 'adoption',
      user: 'Leslie Alexander',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=100&auto=format&fit=crop',
      time: '1 day ago',
      animal: 'Buddy the Golden Retriever'
    }
  ];

  return (
    <div className="absolute top-12 right-0 w-80 bg-white rounded-lg shadow-lg border border-gray-100 z-50 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="font-semibold">Notifications</h3>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {notifications.map(notification => (
          <div key={notification.id} className="px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0">
            <div className="flex items-start">
              <Avatar className="h-10 w-10 mr-3">
                <img src={notification.avatar} alt={notification.user} className="h-full w-full object-cover" />
              </Avatar>
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-medium">{notification.user}</span>{' '}
                  {notification.type === 'friendRequest' && 'sent you a friend request'}
                  {notification.type === 'comment' && `commented on ${notification.post}`}
                  {notification.type === 'adoption' && `wants to adopt ${notification.animal}`}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="px-4 py-2 border-t border-gray-100 text-center">
        <button className="text-sm text-primary font-medium">See all notifications</button>
      </div>
    </div>
  );
};

export default NotificationsPopover;
