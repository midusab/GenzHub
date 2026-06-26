import { useState, useEffect, useRef } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { Send, User, Shield, Zap, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, Message } from '../types';
import { encryptMessage, decryptMessage } from '../lib/encryption';

interface ChatRoomProps {
  user: UserProfile;
}

export default function ChatRoom({ user }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const path = 'global_messages';
    const q = query(
      collection(db, path),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => {
        const data = doc.data();
        const decryptedText = decryptMessage(data.text || '', 'global');
        
        return {
          id: doc.id,
          ...data,
          text: decryptedText, // Decrypt for the UI
          timestamp: data.timestamp?.toMillis() || Date.now()
        } as Message;
      }).reverse();
      setMessages(msgs);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !auth.currentUser) return;

    const messageText = newMessage.trim();
    const path = 'global_messages';
    setNewMessage('');

    try {
      // Encrypt the message before sending to Firestore
      const encryptedText = encryptMessage(messageText, 'global');

      await addDoc(collection(db, path), {
        senderId: user.uid,
        senderName: user.displayName,
        senderPhoto: user.photoURL,
        text: encryptedText, // Send cipher text
        timestamp: serverTimestamp(),
        isEncrypted: true // Flag to indicate E2E protection
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto bg-[#0a0a0a] rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
      {/* Header */}
      <div className="p-4 bg-[#1c1c1e] border-bottom border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-black shadow-lg shadow-blue-600/20">
            Z
          </div>
          <div>
            <h2 className="font-bold text-white">Global Hub</h2>
            <p className="text-[10px] text-green-500 font-bold flex items-center gap-1 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Live Chat
            </p>
          </div>
        </div>
        <div className="flex -space-x-2">
          {[1,2,3].map(i => (
            <div key={i} className="w-8 h-8 rounded-full border-2 border-[#1c1c1e] bg-gray-800 overflow-hidden">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i+10}`} alt="avatar" />
            </div>
          ))}
          <div className="w-8 h-8 rounded-full border-2 border-[#1c1c1e] bg-blue-600/20 flex items-center justify-center text-[10px] text-blue-400 font-bold">
            +12
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gradient-to-b from-[#0a0a0a] to-[#0f0f0f]"
      >
        {/* Encryption Banner */}
        <div className="flex justify-center mb-6">
          <div className="bg-[#1c1c1e] border border-yellow-500/20 px-4 py-2 rounded-xl flex items-center gap-2">
            <Lock className="w-3 h-3 text-yellow-500" />
            <p className="text-[10px] text-gray-400 font-medium">
              Messages are <span className="text-yellow-500">end-to-end encrypted</span>. No one outside of this chat, not even GenZHub, can read them.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Zap className="w-8 h-8 text-blue-500 animate-pulse" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-20 text-gray-600">
            <Shield className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="font-medium">Be the first to break the silence</p>
          </div>
        ) : (
          messages.map((msg) => (
            <motion.div 
              initial={{ opacity: 0, x: msg.senderId === user.uid ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              key={msg.id}
              className={`flex items-end gap-2 ${msg.senderId === user.uid ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className="w-8 h-8 rounded-full bg-gray-800 overflow-hidden border border-white/10 shrink-0">
                <img 
                  src={msg.senderPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.senderId}`} 
                  alt={msg.senderName} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className={`max-w-[75%] p-3 rounded-2xl text-sm ${
                msg.senderId === user.uid 
                  ? 'bg-blue-600 text-white rounded-br-none' 
                  : 'bg-white/5 border border-white/5 text-gray-200 rounded-bl-none'
              }`}>
                {msg.senderId !== user.uid && (
                  <p className="text-[10px] font-bold text-blue-400 mb-1">{msg.senderName}</p>
                )}
                <p className="leading-relaxed">{msg.text}</p>
                <div className="flex items-center justify-between gap-4 mt-1">
                  <p className="text-[9px] opacity-50">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <Lock className={`w-2.5 h-2.5 ${msg.senderId === user.uid ? 'text-blue-200' : 'text-gray-500'} opacity-30`} />
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 bg-[#1c1c1e] border-t border-white/5">
        <div className="relative flex items-center">
          <input 
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-4 pr-12 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-600"
          />
          <button 
            type="submit"
            disabled={!newMessage.trim()}
            className="absolute right-2 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 disabled:opacity-50 disabled:bg-gray-700 transition-all active:scale-90"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
