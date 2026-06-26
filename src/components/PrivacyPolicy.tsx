import { motion } from 'motion/react';
import { Shield, Lock, Eye, Trash2, ArrowLeft } from 'lucide-react';

interface PrivacyPolicyProps {
  onBack: () => void;
}

export default function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
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
          <Shield className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white">Privacy Policy</h2>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-tighter">Last Updated: June 2026</p>
        </div>
      </div>

      <p className="leading-relaxed">
        Welcome to GenZHub. We are fully committed to protecting the privacy of our community members. This Privacy Policy explains how we collect, handle, and secure your information in compliance with the <span className="text-white font-bold">Kenya Data Protection Act, 2019</span>.
      </p>

      <section className="space-y-3">
        <div className="flex items-center gap-2 text-white font-bold">
          <Eye className="w-4 h-4 text-blue-400" />
          <h3>1. The Information We Collect</h3>
        </div>
        <div className="bg-white/5 border border-white/5 p-4 rounded-2xl space-y-3 text-sm leading-relaxed">
          <p><span className="text-blue-400 font-bold">Account Data:</span> Your name, chosen username, phone number, and email address.</p>
          <p><span className="text-blue-400 font-bold">Transactional Data:</span> Payment references, escrow receipts, and temporary tracking data generated through our Pesapal/M-PESA integration.</p>
          <p><span className="text-blue-400 font-bold">User-Generated Content:</span> Product text descriptions, images uploaded to the #Drip marketplace, and gig notices posted under #Hustle.</p>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2 text-white font-bold">
          <Shield className="w-4 h-4 text-green-400" />
          <h3>2. How We Use Your Data</h3>
        </div>
        <div className="bg-white/5 border border-white/5 p-4 rounded-2xl space-y-3 text-sm leading-relaxed">
          <p>• To verify unique active listings and track your 3-post marketplace free quota.</p>
          <p>• To facilitate secure buyer-and-seller communication and calculate relevant escrow transaction fees.</p>
          <p>• To check administration credentials securely via your unique User UID window.</p>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2 text-white font-bold">
          <Lock className="w-4 h-4 text-purple-400" />
          <h3>3. Data Protection & Sharing</h3>
        </div>
        <p className="text-sm leading-relaxed">
          We do not sell, trade, or share your personal database files with predatory third parties. All peer-to-peer data remains securely segmented within our Firebase backend. Financial keys are encrypted safely via our standard system environment protocols.
        </p>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2 text-white font-bold">
          <Trash2 className="w-4 h-4 text-red-400" />
          <h3>4. Your Rights as a Data Subject</h3>
        </div>
        <div className="bg-white/5 border border-white/5 p-4 rounded-2xl space-y-3 text-sm leading-relaxed">
          <p><span className="text-white font-bold italic">The Right to Be Informed:</span> Knowing exactly how and why your information is handled.</p>
          <p><span className="text-white font-bold italic">The Right to Erasure:</span> The complete right to be forgotten and have your profile, data, or active marketplace listings permanently deleted from our servers.</p>
        </div>
      </section>
    </motion.div>
  );
}
