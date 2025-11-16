import React from 'react';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const CreatePostButton: React.FC = () => {
  return (
    <motion.div 
      className="create-post-button"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ 
        type: "spring", 
        stiffness: 260, 
        damping: 20 
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <Link to="/create">
        <motion.button 
          className="h-16 w-16 rounded-full bg-gradient-to-br from-primary via-secondary to-accent shadow-lg flex items-center justify-center text-white"
          whileHover={{ 
            boxShadow: "0 8px 15px rgba(0, 0, 0, 0.2)",
            rotate: 90
          }}
          transition={{ duration: 0.2 }}
        >
          <Plus className="h-7 w-7" />
        </motion.button>
      </Link>
    </motion.div>
  );
};

export default CreatePostButton;
