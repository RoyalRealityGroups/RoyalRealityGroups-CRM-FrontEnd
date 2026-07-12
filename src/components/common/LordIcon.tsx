/// <reference path="../../types/lord-icon.d.ts" />
import React, { useRef, useEffect } from 'react';

interface LordIconProps {
  src: string;
  trigger?: 'hover' | 'click' | 'loop' | 'morph' | 'boomerang';
  colors?: string;
  size?: number;
  state?: string;
  delay?: number;
  style?: React.CSSProperties;
  parentHover?: boolean; // New prop to trigger animation from parent hover
}

const LordIcon: React.FC<LordIconProps> = ({
  src,
  trigger = 'hover',
  colors = 'primary:#006766',
  size = 24,
  state,
  delay,
  style,
  parentHover = false,
}) => {
  const iconRef = useRef<HTMLElement>(null);

  // Trigger animation when parent is hovered
  useEffect(() => {
    if (parentHover && iconRef.current) {
      // Dispatch mouseenter event to trigger hover animation
      const mouseEnterEvent = new MouseEvent('mouseenter', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      iconRef.current.dispatchEvent(mouseEnterEvent);
    } else if (!parentHover && iconRef.current) {
      // Dispatch mouseleave event to reset
      const mouseLeaveEvent = new MouseEvent('mouseleave', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      iconRef.current.dispatchEvent(mouseLeaveEvent);
    }
  }, [parentHover]);

  return (
    <lord-icon
      ref={iconRef}
      src={src}
      trigger={trigger}
      colors={colors}
      state={state}
      delay={delay?.toString()}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        ...style,
      }}
    />
  );
};

export default LordIcon;
