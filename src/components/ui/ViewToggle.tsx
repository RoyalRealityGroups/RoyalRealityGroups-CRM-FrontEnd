/**
 * ViewToggle Component
 *
 * Toggle between different view modes (list, grid, board)
 */
import React from 'react';
import { List, GridView as Grid3x3, ViewColumn as Columns } from '@mui/icons-material';

export type ViewMode = 'list' | 'grid' | 'board';

interface ViewToggleProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  availableViews?: ViewMode[];
  className?: string;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({
  currentView,
  onViewChange,
  availableViews = ['list', 'grid', 'board'],
  className = '',
}) => {
  const views: Array<{ mode: ViewMode; icon: React.ReactNode; label: string }> = [
    { mode: 'list', icon: <List className="w-4 h-4" />, label: 'List' },
    { mode: 'grid', icon: <Grid3x3 className="w-4 h-4" />, label: 'Grid' },
    { mode: 'board', icon: <Columns className="w-4 h-4" />, label: 'Board' },
  ];

  const filteredViews = views.filter((view) => availableViews.includes(view.mode));

  return (
    <div className={`inline-flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 ${className}`}>
      {filteredViews.map(({ mode, icon, label }) => (
        <button
          key={mode}
          onClick={() => onViewChange(mode)}
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all
            ${
              currentView === mode
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }
          `}
          aria-label={`${label} view`}
          title={`${label} view`}
        >
          {icon}
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
};

export default ViewToggle;
