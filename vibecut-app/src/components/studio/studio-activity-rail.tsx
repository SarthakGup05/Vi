"use client";

import React from "react";
import {
  Video,
  Type,
  Scissors,
  Film,
  Sliders,
  Wand2,
  FolderKanban,
  HelpCircle,
  Settings,
} from "lucide-react";
import { ActivityRailTab } from "@/types/studio";

interface StudioActivityRailProps {
  activeTab: ActivityRailTab;
  onTabChange: (tab: ActivityRailTab) => void;
  onOpenVault?: () => void;
}

interface RailItem {
  id: ActivityRailTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  shortcut?: string;
}

const RAIL_ITEMS: RailItem[] = [
  { id: "media", label: "Media & Cloud", icon: Video, shortcut: "⌥1" },
  { id: "subtitles", label: "Kinetic Captions", icon: Type, badge: "AI", shortcut: "⌥2" },
  { id: "silence", label: "Silence Surgery", icon: Scissors, badge: "Auto", shortcut: "⌥3" },
  { id: "broll", label: "B-Roll & Overlays", icon: Film, shortcut: "⌥4" },
  { id: "audio", label: "Audio & Ducking", icon: Sliders, shortcut: "⌥5" },
  { id: "presets", label: "Viral Presets", icon: Wand2, shortcut: "⌥6" },
];

export function StudioActivityRail({
  activeTab,
  onTabChange,
  onOpenVault,
}: StudioActivityRailProps) {
  return (
    <aside className="w-14 shrink-0 bg-[#0d0d12] border-r border-white/[0.08] flex flex-col items-center py-3 select-none justify-between z-20">
      {/* Top Icons */}
      <div className="flex flex-col items-center gap-2 w-full px-1.5">
        {RAIL_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <div key={item.id} className="relative group w-full flex justify-center">
              <button
                onClick={() => onTabChange(item.id)}
                className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  isActive
                    ? "bg-violet-600/20 text-violet-300 border border-violet-500/40 shadow-sm shadow-violet-500/20"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-transparent"
                }`}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-violet-500 shadow-sm shadow-violet-500" />
                )}

                <Icon className="h-4 w-4 shrink-0" />

                {item.badge && (
                  <span className="absolute -top-1 -right-1 text-[8px] font-black px-1 py-0.2 rounded-full bg-amber-400 text-zinc-950">
                    {item.badge}
                  </span>
                )}
              </button>

              {/* Hover Tooltip */}
              <div className="absolute left-14 top-1/2 -translate-y-1/2 ml-1 px-2.5 py-1.5 rounded-lg bg-[#181820] border border-white/10 text-white text-xs font-semibold shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap flex items-center gap-2">
                <span>{item.label}</span>
                {item.shortcut && (
                  <kbd className="text-[10px] text-zinc-400 font-mono bg-white/[0.08] px-1.5 py-0.5 rounded">
                    {item.shortcut}
                  </kbd>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom helper icons */}
      <div className="flex flex-col items-center gap-2 w-full px-1.5">
        {onOpenVault && (
          <div className="relative group w-full flex justify-center">
            <button
              onClick={onOpenVault}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              title="Vault Drawer"
            >
              <FolderKanban className="h-4 w-4" />
            </button>
            <div className="absolute left-14 top-1/2 -translate-y-1/2 ml-1 px-2 py-1 rounded-md bg-[#181820] border border-white/10 text-white text-xs font-medium shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
              Project Vault (⌘K)
            </div>
          </div>
        )}

        <div className="relative group w-full flex justify-center">
          <button
            className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06] transition-colors cursor-pointer"
            title="Shortcuts & Docs"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
          <div className="absolute left-14 top-1/2 -translate-y-1/2 ml-1 px-2 py-1 rounded-md bg-[#181820] border border-white/10 text-white text-xs font-medium shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
            Keyboard Shortcuts: Space (Play/Pause), ⌘K (Vault)
          </div>
        </div>
      </div>
    </aside>
  );
}
