import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../lib/firebase';
import { getUserCredits } from '../lib/credits';

export function UserCredits() {
  const [user] = useAuthState(auth);
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCredits() {
      if (user) {
        try {
          const userCredits = await getUserCredits(user.uid);
          setCredits(userCredits);
        } catch (error) {
          console.error('Erro ao carregar créditos:', error);
        } finally {
          setLoading(false);
        }
      }
    }

    loadCredits();
  }, [user]);

  if (!user || loading) return null;

  return (
    <motion.button 
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm"
    >
      {credits} créditos restantes
    </motion.button>
  );
}
