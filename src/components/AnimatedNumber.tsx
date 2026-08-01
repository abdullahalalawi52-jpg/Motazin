import React, { useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  formatCurrency: (val: number) => string;
  className?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value, formatCurrency, className }) => {
  const spring = useSpring(value, { mass: 0.8, stiffness: 75, damping: 15 });
  const displayValue = useTransform(spring, (current) => formatCurrency(current));

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span className={className}>{displayValue}</motion.span>;
};
