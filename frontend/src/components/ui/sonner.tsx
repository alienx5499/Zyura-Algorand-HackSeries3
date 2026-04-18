"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "border border-gray-800 bg-black text-gray-100 shadow-lg shadow-black/30",
          title: "text-gray-100",
          description: "text-gray-300",
          actionButton:
            "bg-indigo-500/20 text-indigo-100 hover:bg-indigo-500/30",
          cancelButton: "bg-gray-900 text-gray-200 hover:bg-gray-800",
          error: "border-rose-500/40",
          success: "border-emerald-500/40",
          warning: "border-amber-500/40",
          info: "border-sky-500/40",
        },
      }}
      style={
        {
          "--normal-bg": "#000000",
          "--normal-text": "#f3f4f6",
          "--normal-border": "rgba(55, 65, 81, 0.9)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
