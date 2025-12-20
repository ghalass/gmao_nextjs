// components/reports/custom-chart-components.tsx
import React from "react";

interface CustomBarLabelProps {
  x: number;
  y: number;
  width: number;
  value: number;
}

export const CustomBarLabel: React.FC<CustomBarLabelProps> = ({
  x,
  y,
  width,
  value,
}) => {
  return (
    <text
      x={x + width / 2}
      y={y - 10}
      fill="#666"
      textAnchor="middle"
      fontSize={12}
      fontWeight="bold"
    >
      {value.toFixed(1)}%
    </text>
  );
};

interface CustomLineLabelProps {
  x: number;
  y: number;
  value: number;
}

export const CustomLineLabel: React.FC<CustomLineLabelProps> = ({
  x,
  y,
  value,
}) => {
  return (
    <text
      x={x}
      y={y - 15}
      fill="#666"
      textAnchor="middle"
      fontSize={11}
      fontWeight="bold"
    >
      {value}h
    </text>
  );
};
