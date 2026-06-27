import React from 'react';

interface PaymentProps {
  mode: 'premium' | 'escrow';
  itemPrice?: number; // Optional: Only needed for escrow items
}

export default function GenZHubPaymentGate({ mode, itemPrice = 0 }: PaymentProps) {
  // 1. Live Pesapal links mapped directly from your dashboard configurations
  const paymentLinks = {
    premium: "https://store.pesapal.com/genzhubpremiumcardactivation",
    escrow: "https://store.pesapal.com/genzhubsafeescrowverification"
  };

  const ESCROW_FEE = 100;
  const totalEscrowPay = itemPrice + ESCROW_FEE;

  const handleCheckout = () => {
    const targetUrl = paymentLinks[mode];
    if (targetUrl) {
      window.open(targetUrl, '_blank');
    } else {
      alert("Payment gateway URL configuration is missing.");
    }
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

  // Render for Safe Escrow Marketplace Protection (Option A)
  return (
    <div className="w-full bg-slate-900 p-4 rounded-2xl border border-slate-800 text-center text-white">
      <div className="flex justify-between text-sm text-slate-400 mb-2">
        <span>Item Listed Price:</span>
        <span>KSh {itemPrice}</span>
      </div>
      <div className="flex justify-between text-sm text-emerald-400 mb-4">
        <span>🛡️ Safe Escrow Fee (Paid by Buyer):</span>
        <span>KSh {ESCROW_FEE}</span>
      </div>
      
      <button
        onClick={handleCheckout}
        className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:scale-105 transition-transform duration-200"
      >
        Pay Safe Escrow Total: KSh {totalEscrowPay}
      </button>
      
      <p className="text-xs text-slate-500 mt-2 italic">
        *Please enter exactly KSh {totalEscrowPay} on the secure Pesapal gate to verify coverage.
      </p>
    </div>
  );
}
