import React from "react";

interface AcademyHeaderProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}

export function AcademyHeader({ size = "md", showTagline = true }: AcademyHeaderProps) {
  const sizeClasses = {
    sm: "h-8",
    md: "h-10",
    lg: "h-20",
  };

  const nameClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  const taglineClasses = {
    sm: "text-[10px]",
    md: "text-xs",
    lg: "text-sm",
  };

  return (
    <div className="flex items-center gap-3">
      <img
        src="/alihsan-logo.png"
        alt="Al Ihsan Academy"
        className={`${sizeClasses[size]} object-contain mix-blend-multiply`}
      />
      <div className="flex flex-col justify-center">
        <h1 className={`${nameClasses[size]} font-bold text-gray-900 leading-tight`}>
          {size === "lg" ? "AL IHSAN Academy of Moral Education" : "AL IHSAN Academy"}
        </h1>
        {showTagline && (
          <p className={`${taglineClasses[size]} text-gray-500 italic mt-0.5`}>
            "Building a generation for tomorrow"
          </p>
        )}
      </div>
    </div>
  );
}
