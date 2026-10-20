"use client";

import React from "react";
import { Play } from "lucide-react";

interface DemoVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DemoVideoModal({ isOpen, onClose }: DemoVideoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-2xl w-full p-6 flex flex-col gap-4 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white cursor-pointer"
        >
          ✕
        </button>
        <h3 className="font-bold text-lg text-white">How VibeCut AI Works in 30 Seconds</h3>
        <div className="aspect-video bg-black rounded-2xl flex items-center justify-center border border-zinc-800 relative overflow-hidden">
          <div className="text-center p-6">
            <Play className="h-14 w-14 text-amber-400 mx-auto mb-2 opacity-80" />
            <p className="text-sm text-zinc-400">
              Interactive walkthrough: Drop video → Silence Cut → Kinetic Captions → Export.
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold cursor-pointer"
        >
          Close Preview
        </button>
      </div>
    </div>
  );
}
