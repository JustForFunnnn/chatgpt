import React, { FC } from "react";

export const SkeletonLoader: FC = () => (
  <div className="space-y-3 pt-2">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="w-full h-8 bg-gray-300 dark:bg-gray-700 rounded-md animate-pulse" />
    ))}
  </div>
);
