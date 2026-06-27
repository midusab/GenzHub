import { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, RefreshCw } from 'lucide-react';

interface PaymentButtonProps {
  userId: string;
  amount: number;
  orderType: string;
  postId?: string;
  postType?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  className?: string;
}

export default function PaymentButton({ 
  userId, 
  amount, 
  orderType, 
  postId, 
  postType,
  email,
  firstName,
  lastName,
  className 
}: PaymentButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      // 1. Send the payment request to our backend checkout portal
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          amount, 
          orderType,
          postId,
          postType,
          email,
          firstName,
          lastName
        })
      });

      const data = await response.json();

      if (data.redirect_url) {
        // 2. SUCCESS: Secure redirect to Pesapal payment gateway
        window.location.href = data.redirect_url;
      } else {
        alert("🔒 GenZHub Safe-Gate: Could not initialize secure portal. " + (data.error || "Try again."));
      }
    } catch (error) {
      console.error("Payment Error:", error);
      alert("🔒 GenZHub Safe-Gate: Network Connection Error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleCheckout} 
      disabled={loading}
      className={`relative group overflow-hidden ${className || "w-full bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-tighter italic py-4 px-6 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-70"}`}
    >
      <div className="relative z-10 flex items-center justify-center gap-2">
        {loading ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            >
              <RefreshCw className="w-5 h-5" />
            </motion.div>
            <span>Securing Portal...</span>
          </>
        ) : (
          <>
            <ShieldCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>Pay KSh {amount.toLocaleString()}</span>
          </>
        )}
      </div>
      
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
    </button>
  );
}
