import { memo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

interface VirtualListProps {
  items: any[];
  height?: number;
  itemHeight?: number;
  renderItem: (item: any, index: number) => React.ReactNode;
  className?: string;
}

export const VirtualList = memo(({ 
  items, 
  height = 600, 
  itemHeight = 50,
  renderItem,
  className 
}: VirtualListProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const totalHeight = items.length * itemHeight;
  const visibleCount = Math.ceil(height / itemHeight);
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleCount + 1, items.length);
  const offsetY = startIndex * itemHeight;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const visibleItems = items.slice(startIndex, endIndex);

  const containerStyle: CSSProperties = {
    height: `${height}px`,
    overflow: 'auto',
    position: 'relative',
  };

  const innerStyle: CSSProperties = {
    height: `${totalHeight}px`,
    position: 'relative',
  };

  const contentStyle: CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    transform: `translateY(${offsetY}px)`,
  };

  return (
    <div 
      ref={containerRef}
      style={containerStyle}
      onScroll={handleScroll}
      className={className}
    >
      <div style={innerStyle}>
        <div style={contentStyle}>
          {visibleItems.map((item, idx) => (
            <div key={startIndex + idx} style={{ height: `${itemHeight}px` }}>
              {renderItem(item, startIndex + idx)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

VirtualList.displayName = 'VirtualList';
