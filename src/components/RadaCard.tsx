import React, { useState, useEffect } from 'react';
import { Heart, MessageSquare, Repeat2, Bookmark, CornerDownRight, User } from 'lucide-react';
import { doc, updateDoc, arrayUnion, arrayRemove, collection, query, orderBy, onSnapshot, addDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PostRada, PostComment, UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';

interface RadaCardProps {
  post: PostRada;
  user: UserProfile;
}

interface CommentNode extends PostComment {
  replies: CommentNode[];
}

// --- APPLE DESIGNED RECURSIVE REPLIES ---
function IOSRecursiveComment({ 
  comment, 
  user,
  postId,
  onAddReply 
}: { 
  comment: CommentNode; 
  user: UserProfile;
  postId: string;
  onAddReply: (parentCommentId: string, replyText: string) => void; 
}) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    onAddReply(comment.id, replyText);
    setReplyText('');
    setShowReplyInput(false);
  };

  return (
    <div className="mt-2.5 pl-3 border-l border-slate-800/60 transition-all">
      {/* iOS Style Minimalist Bubble */}
      <div className="bg-slate-900/40 backdrop-blur-md p-3 rounded-2xl border border-white/[0.04]">
        <div className="flex items-center gap-1.5 mb-1">
          {comment.userPhoto ? (
            <img src={comment.userPhoto} className="w-4 h-4 rounded-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <User size={12} className="text-slate-500" />
          )}
          <span className="font-semibold text-[10px] text-slate-300">@{comment.userName}</span>
          <span className="text-[8px] text-slate-600 font-bold uppercase tracking-widest ml-auto">
            {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}
          </span>
        </div>
        <p className="text-slate-200 text-xs leading-relaxed">{comment.text}</p>
        
        {/* Apple Style Text-Button */}
        <button 
          onClick={() => setShowReplyInput(!showReplyInput)}
          className="mt-2 flex items-center gap-1 text-[10px] text-slate-500 hover:text-pink-500 font-medium tracking-wide transition-colors"
        >
          <CornerDownRight size={10} />
          <span>Reply</span>
        </button>

        {/* Apple Style Compact Input */}
        {showReplyInput && (
          <form onSubmit={handleSubmit} className="flex gap-1.5 mt-2 animate-in fade-in slide-in-from-top-1 duration-300">
            <input
              type="text"
              placeholder={`Reply to @${comment.userName}...`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="flex-1 bg-slate-950/60 border border-white/[0.06] rounded-xl px-2.5 py-1 text-[11px] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-pink-500 transition-all"
            />
            <button type="submit" className="bg-white text-black font-semibold text-[10px] px-3 rounded-xl hover:bg-slate-200 transition-colors">
              Reply
            </button>
          </form>
        )}
      </div>

      {/* Infinite Inter-Replies rendering nested underneath */}
      {comment.replies.length > 0 && (
        <div className="space-y-1">
          {comment.replies.map((childReply) => (
            <IOSRecursiveComment 
              key={childReply.id} 
              comment={childReply} 
              user={user}
              postId={postId}
              onAddReply={onAddReply} 
            />
          ))}
        </div>
      )}
    </div>
  );
}

// --- MAIN APPLE-INSPIRED CARD ---
export default function RadaCard({ post, user }: RadaCardProps) {
  const [postData, setPostData] = useState<PostRada>(post);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [allComments, setAllComments] = useState<PostComment[]>([]);
  const [nestedComments, setNestedComments] = useState<CommentNode[]>([]);

  const isLiked = postData.likes?.includes(user.uid) || false;
  const isBookmarked = postData.bookmarks?.includes(user.uid) || false;
  const isReshared = postData.reshares?.includes(user.uid) || false;

  // Real-time listener for the specific post document
  useEffect(() => {
    const postRef = doc(db, "posts_rada", post.id);
    const unsubscribe = onSnapshot(postRef, (docSnap) => {
      if (docSnap.exists()) {
        setPostData({ id: docSnap.id, ...docSnap.data() } as PostRada);
      }
    });
    return unsubscribe;
  }, [post.id]);

  useEffect(() => {
    if (!showComments) return;

    const q = query(
      collection(db, "posts_rada", post.id, "comments"), 
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const flatComments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PostComment));
      setAllComments(flatComments);
      
      // Build tree structure
      const commentMap: Record<string, CommentNode> = {};
      const roots: CommentNode[] = [];

      flatComments.forEach(c => {
        commentMap[c.id] = { ...c, replies: [] };
      });

      flatComments.forEach(c => {
        if (c.parentId && commentMap[c.parentId]) {
          commentMap[c.parentId].replies.push(commentMap[c.id]);
        } else {
          roots.push(commentMap[c.id]);
        }
      });

      setNestedComments(roots);
    });

    return unsubscribe;
  }, [showComments, post.id]);

  const handleAction = async (action: 'likes' | 'bookmarks' | 'reshares', active: boolean) => {
    const postRef = doc(db, "posts_rada", post.id);
    try {
      const updates: any = {
        [action]: active ? arrayRemove(user.uid) : arrayUnion(user.uid)
      };

      // Denormalized count for real-time efficiency as requested
      if (action === 'likes') {
        updates.likesCount = increment(active ? -1 : 1);
      }

      await updateDoc(postRef, updates);
    } catch (error) {
      console.error(`Error toggling ${action}:`, error);
    }
  };

  const handleAddComment = async (parentId?: string, text?: string) => {
    const finalContent = text || commentText;
    if (!finalContent.trim()) return;

    try {
      const commentData = {
        postId: post.id,
        userId: user.uid,
        userName: user.displayName,
        userPhoto: user.photoURL || null,
        text: finalContent.trim(),
        timestamp: Date.now(),
        parentId: parentId || null
      };

      await addDoc(collection(db, "posts_rada", post.id, "comments"), commentData);
      await updateDoc(doc(db, "posts_rada", post.id), {
        commentsCount: increment(1)
      });
      
      if (!parentId) {
        setCommentText('');
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  return (
    <div className="w-full bg-slate-950 border border-white/[0.06] rounded-[24px] p-4 text-white shadow-2xl backdrop-blur-xl mb-4 group hover:border-white/20 transition-all duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <div>
          <h4 className="font-semibold text-sm tracking-tight text-slate-100">@{postData.source || 'Admin'}</h4>
          <span className="text-[11px] text-pink-500 font-medium tracking-wide uppercase">{postData.category}</span>
        </div>
        <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">
          {postData.timestamp ? formatDistanceToNow(new Date(postData.timestamp), { addSuffix: true }) : 'Just now'}
        </span>
      </div>

      {/* Post Body */}
      <div className="space-y-3 mb-4">
        <h3 className="text-xl font-black text-white italic leading-tight uppercase tracking-tighter group-hover:text-blue-400 transition-colors">
          {postData.title}
        </h3>
        <p className="text-[13px] text-slate-300 leading-relaxed font-normal tracking-wide">{postData.content}</p>
        
        {postData.imageUrl && (
          <div className="aspect-[16/9] rounded-2xl overflow-hidden border border-white/5">
            <img 
              src={postData.imageUrl} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
      </div>

      {/* 🍏 APPLE ACTION SUITE BAR */}
      <div className="flex items-center justify-between border-t border-white/[0.04] pt-3 px-1 text-slate-400">
        
        {/* Like Button */}
        <button 
          onClick={() => handleAction('likes', isLiked)}
          className={`flex items-center gap-1.5 text-xs font-medium tracking-tight transition-all duration-200 active:scale-90 ${isLiked ? 'text-rose-500' : 'hover:text-slate-200'}`}
        >
          <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} className={isLiked ? 'animate-bounce' : ''} />
          <span className="tabular-nums">{postData.likesCount || postData.likes?.length || 0}</span>
        </button>

        {/* Comment Button */}
        <button 
          onClick={() => setShowComments(!showComments)}
          className={`flex items-center gap-1.5 text-xs font-medium tracking-tight transition-all hover:text-slate-200 ${showComments ? 'text-blue-400' : ''}`}
        >
          <MessageSquare size={16} fill={showComments ? 'currentColor' : 'none'} />
          <span className="tabular-nums">{postData.commentsCount || 0}</span>
        </button>

        {/* Reshare Button */}
        <button 
          onClick={() => handleAction('reshares', isReshared)}
          className={`flex items-center gap-1.5 text-xs font-medium tracking-tight transition-all duration-200 active:scale-95 ${isReshared ? 'text-sky-400' : 'hover:text-slate-200'}`}
        >
          <Repeat2 size={16} className={isReshared ? 'rotate-180 transition-transform duration-300' : ''} />
          <span className="tabular-nums">{postData.reshares?.length || 0}</span>
        </button>

        {/* Bookmark Button */}
        <button 
          onClick={() => handleAction('bookmarks', isBookmarked)}
          className={`flex items-center gap-1.5 text-xs font-medium tracking-tight transition-all duration-200 active:scale-90 ${isBookmarked ? 'text-amber-400' : 'hover:text-slate-200'}`}
        >
          <Bookmark size={16} fill={isBookmarked ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* iOS Drawer Expansion Layout for Threaded Chatter */}
      <AnimatePresence>
        {showComments && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-3.5 border-t border-white/[0.04]">
              <form onSubmit={(e) => {
                e.preventDefault();
                handleAddComment();
              }} className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Drop an official take..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1 bg-slate-900 border border-white/[0.06] rounded-[14px] px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-pink-500 transition-all"
                />
                <button type="submit" className="bg-white text-black font-semibold text-xs px-3 py-1.5 rounded-[14px] hover:bg-slate-200 active:scale-95 transition-all">
                  Post
                </button>
              </form>

              {/* Render Scrollable Recursive Interactive Threads */}
              <div className="max-h-[32rem] overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                {nestedComments.length > 0 ? (
                  nestedComments.map((rootComment) => (
                    <IOSRecursiveComment 
                      key={rootComment.id} 
                      comment={rootComment} 
                      user={user}
                      postId={post.id}
                      onAddReply={(parentId, text) => handleAddComment(parentId, text)} 
                    />
                  ))
                ) : (
                  <p className="text-[10px] font-bold text-slate-700 uppercase tracking-[0.2em] text-center py-6">No takes yet. Be the first.</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
