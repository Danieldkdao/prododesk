"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

export const CircularProgressIndicator = ({
  value,
  initialSize = 150,
  strokeWidth = 10,
  color = "text-primary",
}: {
  value: number;
  initialSize?: number;
  strokeWidth?: number;
  color?: string;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(initialSize);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(([entry]) => {
      if (!entry.target) return;

      if (entry.contentRect.width > entry.contentRect.height) {
        setSize(entry.contentRect.height);
      } else if (entry.contentRect.width < entry.contentRect.height) {
        setSize(entry.contentRect.width);
      } else {
        setSize(entry.contentRect.width);
      }
    });

    observer.observe(container);

    return () => observer.disconnect();
  }, [size]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const style = window.getComputedStyle(container);

    const contentWidth = parseFloat(style.width);
    const contentHeight = parseFloat(style.height);

    if (contentWidth > contentHeight) {
      setSize(contentHeight);
    } else if (contentWidth < contentHeight) {
      setSize(contentWidth);
    } else {
      setSize(contentWidth);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center"
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90 transform"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={color}
        />
      </svg>
    </div>
  );
};
