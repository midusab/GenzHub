import { motion } from 'motion/react';
import { Scale, AlertTriangle, CheckCircle, Info, ArrowLeft, Zap, ShoppingBag, Briefcase } from 'lucide-react';

interface TermsOfServiceProps {
  onBack: () => void;
}

export default function TermsOfService({ onBack }: TermsOfServiceProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 text-gray-300 pb-10"
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
          <Scale className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white">Terms of Service</h2>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-tighter">Last Updated: June 2026</p>
        </div>
      </div>

      <p className="leading-relaxed bg-blue-600/10 border border-blue-600/20 p-4 rounded-2xl text-sm italic">
        By creating an account on GenZHub, you explicitly agree to follow the platform rules outlined below. Violating these terms will result in immediate suspension by administrative accounts.
      </p>

      <section className="space-y-3">
        <div className="flex items-center gap-2 text-white font-bold">
          <Info className="w-4 h-4 text-blue-400" />
          <h3>1. General Account Conduct</h3>
        </div>
        <div className="bg-white/5 border border-white/5 p-4 rounded-2xl space-y-3 text-sm leading-relaxed">
          <p><span className="text-white font-bold">Identity Integrity:</span> Users must register with authentic details. You are entirely responsible for all listing actions, comments, or transaction requests initiated through your individual handle.</p>
          <p><span className="text-white font-bold">Age Limit:</span> You must be 18 years of age or older to participate in commercial peer-to-peer escrow transactions on this platform.</p>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2 text-white font-bold">
          <Zap className="w-4 h-4 text-yellow-400" />
          <h3>2. Column Posting Policies & Rules</h3>
        </div>
        <div className="space-y-4">
          <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
            <h4 className="text-xs font-bold text-blue-400 uppercase mb-2 flex items-center gap-1">
              <Zap className="w-3 h-3" /> #Rada (Verified Local News)
            </h4>
            <p className="text-xs leading-relaxed">Exclusive Curation: Regular users cannot post items here. This space is entirely driven by automated curation engines. Any attempts to bypass system access to post unverified updates will result in a permanent ban.</p>
          </div>

          <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
            <h4 className="text-xs font-bold text-green-400 uppercase mb-2 flex items-center gap-1">
              <ShoppingBag className="w-3 h-3" /> #Drip (Streetwear Marketplace)
            </h4>
            <ul className="text-xs space-y-2 list-disc ml-4">
              <li><span className="font-bold text-white">The Free Quota Limit:</span> Standard accounts are strictly limited to 3 total active listings. Attempts to circumvent this restriction by creating multiple duplicate profiles are forbidden.</li>
              <li><span className="font-bold text-white">The Premium Upgrade:</span> Users may pay a non-refundable upgrade fee of KSh 200 via our Pesapal portal to access unlimited listings.</li>
            </ul>
          </div>

          <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
            <h4 className="text-xs font-bold text-purple-400 uppercase mb-2 flex items-center gap-1">
              <Briefcase className="w-3 h-3" /> #Hustle (Escrow Gigs & Sales)
            </h4>
            <p className="text-xs leading-relaxed"><span className="font-bold text-white">Mandatory Protection:</span> To safeguard transactions, peer-to-peer campus sales and short-term casual gigs require a fixed KSh 100 Escrow Fee applied directly to the final dynamic checkout summary.</p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2 text-white font-bold">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <h3>3. Escrow Resolution & Admin Authority</h3>
        </div>
        <div className="bg-white/5 border border-white/5 p-4 rounded-2xl space-y-3 text-sm leading-relaxed">
          <p><span className="text-white font-bold">The Referee Rule:</span> Funds sent for items are held safely within GenZHub's secure wallet until delivery is mutually confirmed.</p>
          <p><span className="text-white font-bold">Final Arbitration:</span> In the event of an active peer dispute, users agree to abide by the binding resolution decided by GenZHub Platform Administrators after evaluating transaction logs.</p>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2 text-white font-bold">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <h3>4. Limitation of Liability</h3>
        </div>
        <p className="text-sm leading-relaxed">
          GenZHub acts strictly as an interactive marketplace layout and transaction bridge. While we enforce rigid escrow safeguards, we are not directly liable for the physical quality, legality, or logistics of products traded peer-to-peer.
        </p>
      </section>
    </motion.div>
  );
}
