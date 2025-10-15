import React from 'react';
import clsx from 'clsx';

interface BrandIconProps {
  direction?: 'up' | 'down' | 'left' | 'right';
  className?: string;
}

const BrandIcon: React.FC<BrandIconProps> = ({ direction = 'down', className }) => {
  const rotationClasses = {
    down: 'rotate-0',
    up: 'rotate-180',
    left: 'rotate-90',
    right: '-rotate-90',
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 86.32 39.48"
      className={clsx('fill-current transition-transform', rotationClasses[direction], className)}
    >
      <g>
        <polygon points="0 0 0 18.44 22.9 30.74 39.13 39.48 39.13 21.05 22.9 12.33 0 0" />
        <polygon points="47.22 21.05 47.22 39.48 55.33 35.1 63.44 30.74 86.32 18.46 86.32 .02 47.22 21.05" />
      </g>
    </svg>
  );
};

export default BrandIcon;
