import { useState, useEffect } from 'react';
import axios from 'axios';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';
import { CreditCard, ArrowUpRight, ArrowDownLeft, Lock, CheckCircle, Clock, XCircle, Zap, ShieldCheck, RefreshCw, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';
import GenZHubPaymentGate from './GenZHubPaymentGate';
import { UserProfile, Transaction } from '../types';
import { translations } from '../lib/i18n';
import { auth } from '../lib/firebase';

interface PaymentsProps {
  user: UserProfile;
}

export default function Payments({ user }: PaymentsProps) {
  const lang = user?.language || 'en';
  const t = translations[lang];
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const path = 'transactions';
    const q = query(
      collection(db, path),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];
      setTransactions(txs);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
    });

    return unsubscribe;
  }, [user.uid]);

  const getStatusIcon = (status: Transaction['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'escrow': return <Lock className="w-4 h-4 text-blue-500" />;
      default: return null;
    }
  };

  const handleUpgrade = async () => {
    if (!auth.currentUser || isProcessing) return;
    const confirmUpgrade = window.confirm("Buy Unlimited Premium Card for KSh 200? This unlocks unlimited campus postings and premium visibility.");
    if (!confirmUpgrade) return;

    setIsProcessing(true);
    try {
      const response = await axios.post('/api/payments/order', {
        userId: auth.currentUser.uid,
        email: auth.currentUser.email || `${auth.currentUser.uid}@genzhub.com`,
        firstName: auth.currentUser.displayName?.split(' ')[0] || 'User',
        lastName: auth.currentUser.displayName?.split(' ')[1] || 'Customer',
        type: 'upgrade',
        amount: 200
      });

      if (response.data.redirect_url) {
        window.location.href = response.data.redirect_url;
      } else {
        throw new Error('No redirect URL received');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || "Upgrade initiation failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount).replace('KES', 'KSh');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Active Account Summary Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-[#1c1c1e] rounded-[2rem] p-8 border border-white/5 shadow-2xl"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl -ml-24 -mb-24" />
        
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">{t.payments.balance}</p>
            <h2 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter">
              {formatAmount(user.balance || 4250)}
            </h2>
            <div className="flex items-center gap-2 mt-4">
              {user.isPremium ? (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-full">
                  <Zap className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                  <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">👑 {t.payments.premium}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{t.payments.free} [{user.dripPostsCount || 0}/3 Posts]</span>
                </div>
              )}
            </div>
          </div>
          
          {!user.isPremium && (
            <div className="w-full md:w-64">
              <GenZHubPaymentGate mode="premium" />
            </div>
          )}
        </div>
      </motion.div>

      {/* Dynamic Transaction History Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-lg font-black text-white italic">{t.payments.history}</h3>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Chronological Activity</p>
        </div>

        <div className="bg-[#0a0a0a] rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Type</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Description</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Amount</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {transactions.length === 0 ? (
                  // Mock data if empty for visual layout as requested
                  <>
                    <TransactionRow 
                      type="hustle_escrow" 
                      description="Thrifted Cargo Pants (#Drip Purchase)" 
                      amount={-1200} 
                      status="escrow" 
                    />
                    <TransactionRow 
                      type="drip_premium" 
                      description="Lifetime Unlimited Post Card Unlocked" 
                      amount={-200} 
                      status="completed" 
                    />
                    <TransactionRow 
                      type="payout" 
                      description="Campus Gig Coding Service (#Hustle)" 
                      amount={3500} 
                      status="completed" 
                    />
                    <TransactionRow 
                      type="hustle_fee" 
                      description="Standard Escrow Service Protection Charge" 
                      amount={-100} 
                      status="completed" 
                    />
                  </>
                ) : (
                  transactions.map((tx) => (
                    <TransactionRow 
                      key={tx.id}
                      type={tx.type}
                      description={tx.description}
                      amount={tx.amount}
                      status={tx.status}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Dispute Resolution Section */}
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        className="bg-white/5 rounded-[2rem] p-8 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20">
            <MessageSquare className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h4 className="text-xl font-black text-white italic uppercase tracking-tighter">Payment or Delivery Issue?</h4>
            <p className="text-sm text-gray-500 font-medium">Get immediate support for any transaction disputes.</p>
          </div>
        </div>
        <a 
          href="https://wa.me/254742310494?text=I%20have%20a%20dispute%20regarding%20a%20payment%20or%20delivery" 
          target="_blank" 
          rel="noreferrer"
          className="px-8 py-4 bg-[#25D366] hover:bg-[#25D366]/90 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-[#25D366]/20 transition-all active:scale-95 flex items-center gap-2"
        >
          Message Support on WhatsApp
        </a>
      </motion.div>
    </div>
  );
}

function TransactionRow({ type, description, amount, status }: any) {
  const isPositive = amount > 0;
  
  const getStatusLabel = (s: string) => {
    switch (s) {
      case 'completed': return 'Successful';
      case 'pending': return 'Processing';
      case 'failed': return 'Failed';
      case 'escrow': return 'Held in Escrow';
      default: return s;
    }
  };

  const formatAmount = (amt: number) => {
    const formatted = new Intl.NumberFormat('en-KE').format(Math.abs(amt));
    return `${amt < 0 ? '-' : '+'} KSh ${formatted}`;
  };

  return (
    <tr className="hover:bg-white/[0.02] transition-colors group">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${isPositive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
            {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
          </div>
          <span className="text-xs font-bold text-gray-300 uppercase tracking-tighter">
            {type.replace('_', ' ')}
          </span>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-white font-medium">{description}</span>
      </td>
      <td className={`px-6 py-4 text-right font-mono text-sm ${isPositive ? 'text-green-500' : 'text-white'}`}>
        {formatAmount(amount)}
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center justify-center gap-2">
          {status === 'completed' && <CheckCircle className="w-3 h-3 text-green-500" />}
          {status === 'escrow' && <Lock className="w-3 h-3 text-blue-500" />}
          {status === 'pending' && <Clock className="w-3 h-3 text-yellow-500" />}
          <span className={`text-[10px] font-bold uppercase tracking-tight ${
            status === 'completed' ? 'text-green-500' : 
            status === 'escrow' ? 'text-blue-500' : 
            'text-yellow-500'
          }`}>
            {getStatusLabel(status)}
          </span>
        </div>
      </td>
    </tr>
  );
}
