import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

export default function FloatingActionButton({ onClick }) {
  return (
    <motion.button
      className="fab"
      onClick={onClick}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      aria-label="Add new task"
    >
      <Plus size={24} strokeWidth={2.5} />
    </motion.button>
  );
}
