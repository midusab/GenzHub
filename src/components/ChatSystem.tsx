import { useState, useEffect, useRef } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc,
  limit,
  setDoc
} from 'firebase/firestore';
import { 
  MessageSquare, 
  Search, 
  Send, 
  ChevronLeft, 
  User, 
  BadgeCheck, 
  MoreVertical,
  ShieldCheck,
  Smile,
  X,
  Zap,
  Lock,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, Chat, Message } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { translations } from '../lib/i18n';

interface ChatSystemProps {
  user: UserProfile;
  lang: 'en' | 'sheng' | 'sw';
  initialTarget?: UserProfile | null;
  onClearTarget?: () => void;
}

export default function ChatSystem({ user, lang, initialTarget, onClearTarget }: ChatSystemProps) {
  const t = translations[lang];
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const ADMIN_UID = import.meta.env.VITE_ALLOWED_ADMIN_UID;
  const [adminProfile, setAdminProfile] = useState<UserProfile | null>(null);

  // Fetch admin profile for regular users
  useEffect(() => {
    if (user.role !== 'admin' && ADMIN_UID) {
      const fetchAdmin = async () => {
        try {
          const adminDoc = await getDoc(doc(db, "users", ADMIN_UID));
          if (adminDoc.exists()) {
            setAdminProfile(adminDoc.data() as UserProfile);
          }
        } catch (err) {
          console.error("Error fetching admin profile:", err);
        }
      };
      fetchAdmin();
    }
  }, [user.role, ADMIN_UID]);

  useEffect(() => {
    if (initialTarget) {
      startChat(initialTarget);
      onClearTarget?.();
    }
  }, [initialTarget]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Chat[];
      chatList.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      setChats(chatList);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "chats");
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!activeChat) {
      setMessages([]);
      return;
    }

    const q = query(
      collection(db, `chats/${activeChat.id}/messages`),
      orderBy("timestamp", "asc"),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgList);
      scrollToBottom();
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `chats/${activeChat.id}/messages`);
    });

    return unsubscribe;
  }, [activeChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat || !auth.currentUser) return;

    const msgText = newMessage.trim();
    setNewMessage('');

    try {
      await addDoc(collection(db, `chats/${activeChat.id}/messages`), {
        senderId: auth.currentUser.uid,
        senderName: user.displayName,
        text: msgText,
        timestamp: Date.now(),
        type: 'text'
      });

      await updateDoc(doc(db, "chats", activeChat.id), {
        lastMessage: msgText,
        lastSenderId: auth.currentUser.uid,
        lastTimestamp: Date.now(),
        updatedAt: Date.now()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `chats/${activeChat.id}/messages`);
    }
  };

  const startChat = async (targetUser: UserProfile) => {
    if (!auth.currentUser) return;
    
    const existingChat = chats.find(c => c.participants.includes(targetUser.uid));
    if (existingChat) {
      setActiveChat(existingChat);
      setShowUserSearch(false);
      return;
    }

    const chatId = [auth.currentUser.uid, targetUser.uid].sort().join('_');
    
    try {
      const chatData: Partial<Chat> = {
        participants: [auth.currentUser.uid, targetUser.uid],
        participantNames: {
          [auth.currentUser.uid]: user.displayName,
          [targetUser.uid]: targetUser.displayName
        },
        participantPhotos: {
          [auth.currentUser.uid]: user.photoURL || '',
          [targetUser.uid]: targetUser.photoURL || ''
        },
        updatedAt: Date.now()
      };

      await setDoc(doc(db, "chats", chatId), chatData);
      setActiveChat({ id: chatId, ...chatData } as Chat);
      setShowUserSearch(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "chats");
    }
  };

  const searchUsers = async (queryStr: string) => {
    setSearchQuery(queryStr);
    if (queryStr.length < 3) {
      setSearchResults([]);
      return;
    }

    const q = query(
      collection(db, "users"),
      where("displayName", ">=", queryStr),
      where("displayName", "<=", queryStr + "\uf8ff"),
      limit(5)
    );

    try {
      const { getDocs } = await import('firebase/firestore');
      const snapshot = await getDocs(q);
      const results = snapshot.docs
        .map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile))
        .filter(u => u.uid !== auth.currentUser?.uid);
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    }
  };

  const getOtherParticipant = (chat: Chat) => {
    const otherId = chat.participants.find(id => id !== auth.currentUser?.uid);
    const isOtherAdmin = otherId === ADMIN_UID;
    
    if (isOtherAdmin && adminProfile) {
      return {
        id: otherId,
        name: adminProfile.displayName || 'GENZHUB ADMIN',
        photo: adminProfile.photoURL || '',
        isAdmin: true
      };
    }

    return {
      id: otherId,
      name: chat.participantNames?.[otherId || ''] || (isOtherAdmin ? 'GENZHUB ADMIN' : 'GenZ User'),
      photo: chat.participantPhotos?.[otherId || ''] || '',
      isAdmin: isOtherAdmin
    };
  };

  return (
    <div className="flex h-[calc(100vh-140px)] bg-[#050505] rounded-[3rem] border border-white/5 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
      {/* Sidebar: Chat List */}
      <div className={`w-full md:w-[380px] border-r border-white/5 flex flex-col ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-8 space-y-6 bg-black/40 backdrop-blur-3xl">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase font-display">CHATS</h2>
            <button 
              onClick={() => setShowUserSearch(true)}
              className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5 group"
            >
              <Zap className="w-5 h-5 text-green-500 group-hover:scale-110 transition-transform" />
            </button>
          </div>
          
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-white transition-colors" />
            <input 
              placeholder="Search conversations..."
              className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-white/20 transition-all font-medium"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 space-y-2 py-4">
          {user.role !== 'admin' && adminProfile && !chats.some(c => c.participants.includes(ADMIN_UID!)) && (
            <button
              onClick={() => startChat(adminProfile)}
              className="w-full p-5 flex items-center gap-4 transition-all hover:bg-green-500/5 rounded-[2rem] border border-green-500/10 bg-green-500/[0.02] group"
            >
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20">
                  {adminProfile.photoURL ? (
                    <img src={adminProfile.photoURL} className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    <ShieldCheck className="w-8 h-8 text-white" />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-4 border-[#050505]" />
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2 mb-0.5">
                  <h4 className="text-[11px] font-black text-white uppercase tracking-tighter">OFFICIAL SUPPORT</h4>
                  <BadgeCheck className="w-3.5 h-3.5 text-green-500" />
                </div>
                <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest leading-none">Vibe with the team</p>
              </div>
            </button>
          )}

          {chats.length === 0 && (user.role === 'admin' || !adminProfile) ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-white/5">
                <MessageSquare className="w-10 h-10 text-gray-700" />
              </div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest mb-2 italic">Ghost Town</h3>
              <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest leading-relaxed">No active ripples in the chat pool yet.</p>
            </div>
          ) : (
            chats.map(chat => {
              const other = getOtherParticipant(chat);
              const isActive = activeChat?.id === chat.id;
              return (
                <button
                  key={chat.id}
                  onClick={() => setActiveChat(chat)}
                  className={`w-full p-4 flex items-center gap-4 transition-all rounded-[1.8rem] group relative ${isActive ? 'bg-white/10 shadow-xl' : 'hover:bg-white/5'}`}
                >
                  <div className="relative">
                    {other.photo ? (
                      <img src={other.photo} className="w-14 h-14 rounded-[1.2rem] object-cover ring-2 ring-white/5" />
                    ) : (
                      <div className="w-14 h-14 rounded-[1.2rem] bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                        <User className="w-7 h-7 text-gray-500" />
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-4 border-[#050505]" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex justify-between items-start mb-0.5">
                      <div className="flex items-center gap-1.5 truncate">
                        <h4 className={`text-sm font-black uppercase tracking-tight truncate ${isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>{other.name}</h4>
                        {other.isAdmin && <BadgeCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />}
                      </div>
                      {chat.lastTimestamp && (
                        <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest">
                          {formatDistanceToNow(chat.lastTimestamp, { addSuffix: false }).replace('about ', '')}
                        </span>
                      )}
                    </div>
                    <p className={`text-[11px] truncate font-medium ${isActive ? 'text-gray-300' : 'text-gray-500 group-hover:text-gray-400'}`}>
                      {chat.lastSenderId === auth.currentUser?.uid ? 'You: ' : ''}
                      {chat.lastMessage || 'Shared a vibe'}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col bg-[#050505] relative ${activeChat ? 'flex' : 'hidden md:flex'}`}>
        <AnimatePresence mode="wait">
          {activeChat ? (
            <motion.div 
              key={activeChat.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col"
            >
              {/* Chat Header */}
              <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-3xl z-10">
                <div className="flex items-center gap-5">
                  <button 
                    onClick={() => setActiveChat(null)}
                    className="md:hidden p-3 hover:bg-white/5 rounded-2xl transition-all"
                  >
                    <ChevronLeft className="w-7 h-7 text-white" />
                  </button>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-[1.5rem] bg-gradient-to-tr from-gray-800 to-gray-700 flex items-center justify-center overflow-hidden shadow-2xl">
                      {getOtherParticipant(activeChat).photo ? (
                        <img src={getOtherParticipant(activeChat).photo} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-7 h-7 text-gray-500" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-2">
                        {getOtherParticipant(activeChat).name}
                        {getOtherParticipant(activeChat).isAdmin && <BadgeCheck className="w-5 h-5 text-blue-500" />}
                      </h3>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">
                          {getOtherParticipant(activeChat).isAdmin ? 'Official Admin Support' : 'Catching VIBES'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-gray-500 hover:text-white border border-white/5">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar scroll-smooth">
                {messages.map((msg, idx) => {
                  const isMe = msg.senderId === auth.currentUser?.uid;
                  const showAvatar = idx === 0 || messages[idx-1].senderId !== msg.senderId;

                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={msg.id}
                      className={`flex items-end gap-4 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      {showAvatar && (
                        <div className={`w-10 h-10 rounded-[0.8rem] flex-shrink-0 flex items-center justify-center overflow-hidden shadow-lg border border-white/5 ${isMe ? 'bg-white text-black' : 'bg-gray-900'}`}>
                           {isMe ? (
                              user.photoURL ? (
                                <img src={user.photoURL} className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-5 h-5" />
                              )
                            ) : (
                              getOtherParticipant(activeChat).photo ? (
                                <img src={getOtherParticipant(activeChat).photo} className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-5 h-5 text-gray-500" />
                              )
                            )}
                        </div>
                      )}
                      {!showAvatar && <div className="w-10" />}
                      
                      <div className={`max-w-[75%] group relative`}>
                        <div className={`px-6 py-4 rounded-[1.8rem] text-sm font-medium shadow-2xl transition-all leading-relaxed ${
                          isMe 
                            ? 'bg-white text-black rounded-br-none font-bold' 
                            : 'bg-white/[0.03] text-gray-200 border border-white/5 rounded-bl-none'
                        }`}>
                          {msg.text}
                        </div>
                        <div className={`flex items-center gap-3 mt-2 px-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <span className="text-[8px] text-gray-700 font-black uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-8 bg-black/60 backdrop-blur-3xl border-t border-white/5">
                <form onSubmit={sendMessage} className="relative flex items-center gap-4">
                  <div className="flex-1 relative">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 flex gap-3 text-gray-500">
                      <Smile className="w-5 h-5 cursor-pointer hover:text-white transition-colors" />
                    </div>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Share your thoughts..."
                      className="w-full bg-white/[0.03] border border-white/10 focus:border-white/30 text-white pl-16 pr-6 py-5 rounded-[2rem] font-medium placeholder:text-gray-700 focus:outline-none transition-all shadow-inner"
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="bg-white text-black p-5 rounded-[1.8rem] hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:scale-100 shadow-[0_10px_30px_rgba(255,255,255,0.1)] flex items-center justify-center"
                  >
                    <Send className="w-6 h-6" />
                  </button>
                </form>
                <div className="mt-4 flex items-center justify-center gap-2 text-[8px] text-gray-700 font-black uppercase tracking-[0.3em]">
                  <Lock className="w-2.5 h-2.5" />
                  End-to-End Vibe Protected
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="relative">
                <div className="w-40 h-40 bg-white/[0.02] rounded-[4rem] flex items-center justify-center mb-8 border border-white/[0.05] animate-pulse">
                  <MessageSquare className="w-16 h-16 text-gray-800" />
                </div>
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-white/5 rounded-full blur-2xl animate-pulse" />
              </div>
              <h3 className="text-3xl font-black text-white italic tracking-tighter mb-4 uppercase font-display">THE HUB IS SILENT</h3>
              <p className="text-gray-600 font-bold text-[10px] max-w-xs uppercase tracking-[0.2em] leading-loose">
                Pick a frequency from the sidebar to start transmitting your vibes across the network.
              </p>
              
              <button 
                onClick={() => setShowUserSearch(true)}
                className="mt-10 flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 text-[10px] font-black text-white uppercase tracking-widest transition-all group"
              >
                Scan for Signal
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* User Search Modal */}
      <AnimatePresence>
        {showUserSearch && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 40 }}
              className="bg-[#050505] w-full max-w-lg rounded-[3rem] border border-white/10 overflow-y-auto max-h-[90vh] custom-scrollbar shadow-[0_30px_100px_rgba(0,0,0,1)]"
            >
              <div className="p-10 space-y-8">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase font-display">New Link</h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Broadcasting across the hub</p>
                  </div>
                  <button onClick={() => setShowUserSearch(false)} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-500 transition-all border border-white/5">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="relative group">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 group-focus-within:text-white transition-colors" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => searchUsers(e.target.value)}
                    placeholder="Search GenZ name..."
                    className="w-full bg-white/[0.02] border border-white/10 focus:border-white/30 text-white pl-16 pr-6 py-5 rounded-[1.8rem] font-bold uppercase tracking-widest text-[10px] focus:outline-none transition-all shadow-inner"
                  />
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                  <AnimatePresence mode="popLayout">
                    {searchResults.map((u, i) => (
                      <motion.button
                        key={u.uid}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => startChat(u)}
                        className="w-full p-5 flex items-center gap-5 bg-white/[0.02] hover:bg-white/[0.05] rounded-[2rem] transition-all group border border-white/[0.05] hover:border-white/20"
                      >
                        <div className="w-14 h-14 rounded-[1.2rem] bg-gradient-to-tr from-gray-800 to-gray-700 flex items-center justify-center overflow-hidden shadow-xl ring-2 ring-white/5">
                          {u.photoURL ? <img src={u.photoURL} className="w-full h-full object-cover" /> : <User className="w-7 h-7 text-gray-600" />}
                        </div>
                        <div className="text-left flex-1">
                          <p className="text-sm font-black text-white uppercase tracking-tight group-hover:text-green-400 transition-colors">{u.displayName}</p>
                          <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">@{u.uid.slice(0, 8)}</p>
                        </div>
                        <div className="p-3 bg-white/5 rounded-xl group-hover:bg-white text-gray-700 group-hover:text-black transition-all">
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </motion.button>
                    ))}
                  </AnimatePresence>
                  
                  {searchQuery.length >= 3 && searchResults.length === 0 && (
                    <div className="py-12 text-center opacity-40">
                       <Search className="w-10 h-10 mx-auto mb-4 text-gray-600" />
                       <p className="text-gray-500 font-black text-[10px] uppercase tracking-widest">Signal Lost: No users found</p>
                    </div>
                  )}
                  {searchQuery.length > 0 && searchQuery.length < 3 && (
                    <p className="text-center py-12 text-gray-700 font-black text-[10px] uppercase tracking-widest animate-pulse">Scanning...</p>
                  )}
                  {searchQuery.length === 0 && (
                    <div className="py-12 text-center opacity-20">
                       <Zap className="w-10 h-10 mx-auto mb-4" />
                       <p className="text-gray-500 font-black text-[10px] uppercase tracking-widest">Ready to scan the frequency</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
