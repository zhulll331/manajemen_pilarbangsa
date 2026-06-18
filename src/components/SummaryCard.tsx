import React from "react";

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  color?: "primary" | "green" | "yellow" | "red";
}

export function SummaryCard({ title, value, icon, trend, trendUp, color = "primary" }: SummaryCardProps) {
  const bgColors = {
    primary: "bg-blue-100 text-[var(--color-primary)]",
    green: "bg-green-100 text-[var(--color-accent-green)]",
    yellow: "bg-yellow-100 text-yellow-600",
    red: "bg-red-100 text-red-500",
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${bgColors[color]}`}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-sm">
          <span className={`font-medium ${trendUp ? "text-green-500" : "text-red-500"}`}>
            {trend}
          </span>
          <span className="text-gray-400 ml-2">vs bulan lalu</span>
        </div>
      )}
    </div>
  );
}
