"use client";

import React from "react";
import { Zap, QrCode } from "lucide-react";

interface UpiCheckoutModalProps {
  isOpen: boolean;
  plan: string;
  onClose: () => void;
}

export function UpiCheckoutModal({ isOpen, plan, onClose }: UpiCheckoutModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 flex flex-col gap-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white text-sm cursor-pointer"
        >
          ✕
        </button>

        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
            <Zap className="h-5 w-5 fill-amber-400" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-white">{plan}</h3>
            <p className="text-xs text-zinc-400">Instant UPI Checkout • 1080p Export Ready</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col items-center gap-3">
          <div className="p-3 bg-white rounded-xl shadow">
            <QrCode className="h-28 w-28 text-zinc-900" />
          </div>
          <span className="text-xs text-zinc-400 font-mono">Scan via GPay / PhonePe / Paytm</span>
          <div className="w-full flex items-center justify-between text-xs pt-2 border-t border-zinc-800">
            <span className="text-zinc-400">Total Amount:</span>
            <span className="text-lg font-black text-amber-400">₹99</span>
          </div>
        </div>

        <button
          onClick={() => {
            alert("Thank you for testing the VibeCut AI pilot! Early access confirmed.");
            onClose();
          }}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-black text-sm shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Confirm UPI Payment</span>
        </button>
      </div>
    </div>
  );
}
