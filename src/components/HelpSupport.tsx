import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, ChevronDown, Shield, ShoppingBag, Zap, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useState } from 'react';

interface HelpSupportProps {
  onBack: () => void;
}

const faqs = [
  {
    id: 'escrow',
    icon: Shield,
    color: 'text-blue-400',
    q: 'How does the Escrow system work?',
    a: 'When you buy an item under #Drip or a gig under #Hustle, your money isn\'t sent straight to the seller. GenZHub holds the funds securely in our digital wallet until delivery is physically verified. Once both parties confirm everything is correct, the cash is instantly released to the provider.'
  },
  {
    id: 'blocked',
    icon: ShoppingBag,
    color: 'text-green-400',
    q: 'Why am I blocked from posting more items?',
    a: 'Standard accounts enjoy a free quota of 3 total active listings to keep the marketplace fast and clean. To unlock unlimited daily postings and gain premium visibility across campus feeds, you can easily upgrade by purchasing a Premium Card for a single, non-refundable fee of KSh 200.'
  },
  {
    id: 'rada',
    icon: Zap,
    color: 'text-yellow-400',
    q: 'Can I submit a news story to #Rada?',
    a: 'To protect the platform\'s integrity and completely eliminate fake news, regular users cannot post directly inside the #Rada feed. However, if you have a massive local scoop or breaking campus update, you can submit a tip anonymous request to our administrative curation review lounge.'
  },
  {
    id: 'scam',
    icon: AlertTriangle,
    color: 'text-red-400',
    q: 'What happens if I get scammed?',
    a: 'Do not worry! If a seller fails to deliver or an item condition doesn\'t match the description, click the "Raise a Dispute" button inside your transaction logs before confirming receipt. A platform Administrator will immediately act as a referee, review the logs, and safely return your funds if fraud is detected.'
  }
];

export default function HelpSupport({ onBack }: HelpSupportProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-widest hover:text-blue-300 transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Settings
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-600/20 rounded-2xl">
          <HelpCircle className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white italic tracking-tighter">Instant Resolution Hub</h2>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-tighter">Self-Service Support Matrix</p>
        </div>
      </div>

      <div className="space-y-4">
        {faqs.map((faq) => (
          <div 
            key={faq.id}
            className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden transition-all hover:bg-white/10"
          >
            <button 
              onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
              className="w-full flex items-center justify-between p-5 text-left"
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 bg-white/5 rounded-xl ${faq.color}`}>
                  <faq.icon className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-white text-sm">{faq.q}</h4>
              </div>
              <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${openId === faq.id ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {openId === faq.id && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-5 pb-5 pt-0 overflow-hidden"
                >
                  <p className="text-sm text-gray-400 leading-relaxed pl-14">
                    {faq.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <div className="p-6 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-3xl border border-white/5 mt-10">
        <h3 className="text-white font-bold mb-2">Still need help?</h3>
        <p className="text-sm text-gray-400 mb-4">Our administrators are available 24/7 to resolve disputes.</p>
        <button className="w-full bg-white text-black py-3 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-gray-200 transition-all">
          Open Support Ticket
        </button>
      </div>
    </motion.div>
  );
}
