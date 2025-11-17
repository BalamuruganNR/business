import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      setTimeout(onComplete, 500); // Give animation time to complete
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [onComplete]);
  
  return (
    <motion.div 
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-primary via-secondary to-accent"
      animate={{ opacity: loading ? 1 : 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8, type: "spring" }}
        className="mb-8"
      >
        <img 
          src="/Zoophi.png" 
          alt="Zoophi" 
          className="h-32 w-32 rounded-full bg-white p-4 shadow-xl"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "https://source.unsplash.com/random/100x100?animal";
          }}
        />
      </motion.div>
      
      <motion.h1 
        className="text-4xl font-bold text-white mb-4"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        Zoophi
      </motion.h1>
      
      <motion.p
        className="text-white/80 text-lg"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.8 }}
      >
        Connect with animal lovers
      </motion.p>
      
      <motion.div 
        className="mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
      >
        <div className="h-2 w-32 bg-white/20 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-white"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SplashScreen;
