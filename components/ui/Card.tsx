// components/ui/Card.tsx
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card = ({ children, className = "" }: CardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 ${className}`}
    >
      {children}
    </motion.div>
  );
};
