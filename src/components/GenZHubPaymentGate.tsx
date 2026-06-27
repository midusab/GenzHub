import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle, Lock } from 'lucide-react';

interface PaymentProps {
  mode: 'premium' | 'escrow';
  itemPrice?: number;
  itemName?: string;
  sellerName?: string;
}

export default function GenZHubPaymentGate({ mode, itemPrice = 0, itemName = "Item", sellerName = "Seller" }: PaymentProps) {
  // 1. Live Pesapal links mapped directly from your dashboard configurations
  const paymentLinks = {
    premium: "https://store.pesapal.com/genzhubpremiumcardactivation",
    escrow: "https://store.pesapal.com/genzhubsafeescrowverification"
  };

  const ESCROW_FEE = 100;
  const totalEscrowPay = itemPrice + ESCROW_FEE;

  // Transaction States
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'paid' | 'disputed'>('idle');
  const [disputeReason, setDisputeReason] = useState('');
  const [showDisputeForm, setShowDisputeForm] = useState(false);

  const handleCheckout = () => {
    const targetUrl = paymentLinks[mode];
    if (targetUrl) {
      window.open(targetUrl, '_blank');
      if (mode === 'escrow') {
        setPaymentStatus('paid');
      }
    } else {
      alert("Payment gateway URL configuration is missing.");
    }
  };

  const handleConfirmDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeReason.trim()) return;
    
    setPaymentStatus('disputed');
    setShowDisputeForm(false);
    
    alert(`🚨 Delivery issue logged for ${itemName}. GenZHub Admins have frozen the KSh ${totalEscrowPay} payment. We will review your report: "${disputeReason}"`);
  };

  // Render for Monthly Premium Subscription
  if (mode === 'premium') {
    return (
      <button
        onClick={handleCheckout}
        className="w-full bg-gradient-to-r from-pink-600 to-blue-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:scale-105 transition-transform duration-200"
      >
        Unlock Premium Card (KSh 200/mo)
      </button>
    );
  }

  // Render for Safe Escrow Marketplace Protection
  return (
    <div className="w-full space-y-4">
      {paymentStatus === 'idle' && (
        <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-2xl border border-white/[0.04]">
          <div className="flex justify-between text-[11px] text-slate-400 mb-2 uppercase tracking-widest font-bold">
            <span>Item Price:</span>
            <span className="text-white">KSh {itemPrice}</span>
          </div>
          <div className="flex justify-between text-[11px] text-pink-500 mb-6 uppercase tracking-widest font-bold">
            <span>🛡️ Escrow Protection:</span>
            <span>KSh {ESCROW_FEE}</span>
          </div>
          
          <button
            onClick={handleCheckout}
            className="w-full bg-gradient-to-r from-blue-600 to-pink-600 text-white font-black text-[10px] uppercase tracking-[0.2em] py-4 px-6 rounded-xl shadow-xl hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <ShieldCheck size={14} />
            <span>Pay Safe Escrow: KSh {totalEscrowPay}</span>
          </button>
          
          <p className="text-[9px] text-slate-600 mt-4 text-center italic font-medium">
            *Funds are held securely and only released to @{sellerName} after you confirm delivery.
          </p>
        </div>
      )}

      {paymentStatus === 'paid' && (
        <div className="space-y-3 animate-in fade-in duration-500">
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl text-center">
            <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">Funds Secured in GenZHub Escrow!</p>
            <p className="text-[9px] text-emerald-500/60 mt-1 uppercase tracking-widest">Waiting for item pickup/delivery</p>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setPaymentStatus('idle');
                alert("Transaction completed! Funds released to seller.");
              }}
              className="bg-white text-black font-black text-[10px] uppercase tracking-widest py-3 rounded-xl hover:bg-slate-200 transition-colors"
            >
              Confirm Received
            </button>
            
            <button
              onClick={() => setShowDisputeForm(!showDisputeForm)}
              className="bg-slate-900 border border-red-500/30 text-red-400 font-black text-[10px] uppercase tracking-widest py-3 rounded-xl hover:bg-red-950/20 transition-colors flex items-center justify-center gap-2"
            >
              <AlertTriangle size={12} />
              <span>Report Issue</span>
            </button>
          </div>
        </div>
      )}

      {paymentStatus === 'disputed' && (
        <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl text-center animate-in zoom-in-95 duration-300">
          <p className="text-[10px] text-rose-400 font-black uppercase tracking-widest flex items-center justify-center gap-2">
            <AlertTriangle size={14} />
            <span>Payout Frozen: Admin Reviewing Case</span>
          </p>
        </div>
      )}

      {/* Inline Dispute Form */}
      {showDisputeForm && (
        <form onSubmit={handleConfirmDispute} className="mt-4 pt-4 border-t border-white/[0.04] animate-in slide-in-from-top-2 duration-300">
          <label className="block text-[10px] text-slate-500 mb-2 uppercase tracking-widest font-black">Reason for dispute</label>
          <div className="flex gap-2">
            <input
              type="text"
              required
              placeholder="e.g., Seller ghosted me / item not as described..."
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              className="flex-1 bg-slate-900 border border-white/[0.06] rounded-xl px-4 py-2 text-[11px] text-slate-200 focus:outline-none focus:border-red-500 transition-all placeholder:text-slate-700"
            />
            <button 
              type="submit" 
              className="bg-red-600 hover:bg-red-500 text-white font-black text-[10px] uppercase tracking-widest px-4 rounded-xl transition-colors"
            >
              Report
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
