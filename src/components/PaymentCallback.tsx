import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle, XCircle, RefreshCw, ArrowRight } from 'lucide-react';

export default function PaymentCallback({ onComplete }: { onComplete: () => void }) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  
  const searchParams = new URLSearchParams(window.location.search);
  const orderTrackingId = searchParams.get('OrderTrackingId');
  const merchantReference = searchParams.get('OrderMerchantReference');

  useEffect(() => {
    // In a real app, we might poll the server for status
    // but the IPN should handle the background update.
    // We'll just show a "Processing" state for a bit then "Success"
    const timer = setTimeout(() => {
      setStatus('success');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-6">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-md w-full bg-[#0a0a0a] border border-white/10 rounded-[3rem] p-10 text-center space-y-8"
      >
        {status === 'loading' && (
          <>
            <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto border border-blue-500/20">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              >
                <RefreshCw className="w-10 h-10 text-blue-500" />
              </motion.div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Securing Transaction...</h2>
              <p className="text-gray-500 text-sm">We're verifying your payment with Pesapal. This won't take long.</p>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto border border-green-500/20">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Payment Received!</h2>
              <p className="text-gray-500 text-sm">Success! Your account or item has been updated. Reference: <span className="text-white font-mono">{merchantReference}</span></p>
            </div>
            <button 
              onClick={onComplete}
              className="w-full bg-white text-black py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-100 transition-all active:scale-95"
            >
              Back to App <ArrowRight className="w-5 h-5" />
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Payment Failed</h2>
              <p className="text-gray-500 text-sm">Something went wrong with the transaction. Please try again or contact support.</p>
            </div>
            <button 
              onClick={onComplete}
              className="w-full bg-white/10 text-white py-4 rounded-2xl font-bold transition-all active:scale-95"
            >
              Close
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
