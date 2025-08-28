import { motion } from 'framer-motion';
import { Home, Play, Music } from 'lucide-react';
import { theme } from '../theme';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'runs', icon: Play, label: 'Runs' },
  { id: 'samples', icon: Music, label: 'Samples' },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  return (
    <div
      style={{
        width: '64px',
        height: '100vh',
        background: theme.colors.glass.surface,
        backdropFilter: theme.blur.md,
        borderRight: `1px solid ${theme.colors.glass.border}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: theme.spacing.xl,
        gap: theme.spacing.lg,
      }}
    >
      {tabs.map((tab) => {
        const IconComponent = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <motion.div
            key={tab.id}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onTabChange(tab.id)}
            style={{
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: theme.borderRadius.lg,
              background: isActive ? theme.colors.accent.primary : 'transparent',
              color: isActive ? theme.colors.text.primary : theme.colors.text.secondary,
              cursor: 'pointer',
              transition: `all ${theme.animation.normal}`,
            }}
          >
            <IconComponent size={20} />
          </motion.div>
        );
      })}
    </div>
  );
};