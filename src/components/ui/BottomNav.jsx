import { motion } from 'framer-motion';
import { Home, Target, Timer, BarChart3, BookOpen } from 'lucide-react';

const tabs = [
  { key: 'home', label: 'Home', Icon: Home },
  { key: 'goals', label: 'Goals', Icon: Target },
  { key: 'focus', label: 'Focus', Icon: Timer },
  { key: 'stats', label: 'Stats', Icon: BarChart3 },
  { key: 'diary', label: 'Diary', Icon: BookOpen },
];

export default function BottomNav({ activeTab, onTabChange }) {
  return (
    <nav className="bottom-nav">
      {tabs.map(({ key, label, Icon }) => {
        const isActive = activeTab === key;
        return (
          <button
            key={key}
            className={`bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`}
            onClick={() => onTabChange(key)}
            aria-label={label}
            aria-current={isActive ? 'page' : undefined}
          >
            {isActive && (
              <motion.span
                className="bottom-nav__indicator"
                layoutId="nav-indicator"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <Icon
              size={22}
              strokeWidth={isActive ? 2.2 : 1.5}
              fill={isActive ? 'currentColor' : 'none'}
            />
            <span className="bottom-nav__label">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
