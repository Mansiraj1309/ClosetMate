import React, { useState, useEffect } from 'react';
import API_BASE from '../api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Heart, MessageSquare, Compass, Share2, Award, Sparkles } from 'lucide-react';
import './Community.css';

const Community = () => {
    const { token, user } = useAuth();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [commentText, setCommentText] = useState({}); // { postId: text }
    const [activeComments, setActiveComments] = useState(null); // ID of post with open comments

    useEffect(() => {
        fetchPosts();
    }, [token]);

    const fetchPosts = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE}/api/community`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch posts');
            const data = await res.json();
            setPosts(data);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleLike = async (postId) => {
        if (!token) return;
        try {
            // Optimistically update UI
            setPosts(posts.map(post => {
                if (post._id === postId) {
                    const isLiked = post.likes.includes(user.id);
                    return {
                        ...post,
                        likes: isLiked 
                            ? post.likes.filter(id => id !== user.id) 
                            : [...post.likes, user.id]
                    };
                }
                return post;
            }));

            const res = await fetch(`${API_BASE}/api/community/${postId}/like`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!res.ok) throw new Error('Failed to toggle like');
        } catch (err) {
            console.error(err);
            fetchPosts();
        }
    };

    const handleCommentSubmit = async (postId) => {
        const text = commentText[postId];
        if (!text || !text.trim()) return;

        try {
            const res = await fetch(`${API_BASE}/api/community/${postId}/comment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ text })
            });

            if (res.ok) {
                const updatedComments = await res.json();
                setPosts(posts.map(post => 
                    post._id === postId ? { ...post, comments: updatedComments } : post
                ));
                setCommentText({ ...commentText, [postId]: '' });
            }
        } catch (err) {
            console.error('Error posting comment:', err);
        }
    };

    const handleShare = async (post) => {
        const shareData = {
            title: 'ClosetMate Style',
            text: `Check out this ${post.occasion} outfit on ClosetMate!`,
            url: window.location.href,
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                navigator.clipboard.writeText(window.location.href);
                alert('Link copied to clipboard!');
            }
        } catch (err) {
            console.error('Error sharing:', err);
        }
    };

    if (loading) {
        return (
            <div className="community-page">
                <header className="community-header">
                    <Compass size={40} className="header-icon" />
                    <h1 className="gradient-text">Community Feed</h1>
                    <p className="subtitle">Get inspired by outfits generated and shared by other ClosetMate users.</p>
                </header>
                <div className="feed-container">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="post-card glass-card skeleton-post">
                            <div className="skeleton-post-header">
                                <div className="skeleton skeleton-avatar"></div>
                                <div className="skeleton-post-meta">
                                    <div className="skeleton skeleton-line w60"></div>
                                    <div className="skeleton skeleton-line w40" style={{marginTop:'6px'}}></div>
                                </div>
                            </div>
                            <div className="skeleton skeleton-line w80" style={{marginBottom:'1rem'}}></div>
                            <div className="skeleton-post-grid">
                                {[1,2,3].map(j => <div key={j} className="skeleton skeleton-post-img"></div>)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="community-page">
                <div className="community-empty">
                    <p style={{ color: 'var(--accent)' }}>Error loading feed: {error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="community-page">
            <header className="community-header">
                <Compass size={40} className="header-icon" />
                <h1 className="gradient-text">Style Community</h1>
                <p className="subtitle">Explore, vote, and get inspired by the ClosetMate family.</p>
            </header>

            {/* Simulated Banners */}
            <div className="community-highlights">
                <div className="highlight-card challenge glass-card">
                    <div className="h-content">
                        <Award size={20} />
                        <div>
                            <h4>Style Challenge</h4>
                            <p>#MonochromeMonday</p>
                        </div>
                    </div>
                    <button className="join-btn">Join</button>
                </div>
                <div className="highlight-card battle glass-card">
                    <div className="h-content">
                        <Heart size={20} fill="currentColor" />
                        <div>
                            <h4>Outfit Battle</h4>
                            <p>Streetwear vs Classic</p>
                        </div>
                    </div>
                    <button className="vote-btn">Vote</button>
                </div>
            </div>

            {posts.length === 0 ? (
                <div className="community-empty">
                    <div className="empty-illustration">
                        <Compass size={64} strokeWidth={1} />
                        <Sparkles className="empty-sparkle" size={24} />
                    </div>
                    <h3>Your fashion journey starts here ✨</h3>
                    <p>Share your first AI outfit to inspire others!</p>
                    <Link to="/stylist" className="cta-button">Go to Stylist</Link>
                </div>
            ) : (
                <div className="community-grid">
                    {posts.map(post => {
                        const isLiked = user && post.likes.includes(user.id);
                        const isCommentsOpen = activeComments === post._id;
                        
                        return (
                            <div key={post._id} className="post-card glass-card fadeIn">
                                <div className="post-header">
                                    <div className="post-avatar">
                                        {post.userId?.name?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <div className="post-user-info">
                                        <h4>{post.userId?.name || 'Anonymous'}</h4>
                                        <span className="post-date">
                                            {new Date(post.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="post-content">
                                    <div className="post-occasion-tag">
                                        Style for: <span>{post.occasion}</span>
                                    </div>
                                    {post.description && (
                                        <p className="post-description">{post.description}</p>
                                    )}
                                </div>

                                <div className="post-items-grid">
                                    {post.items.map((item, idx) => (
                                        <div key={item._id || idx} className="post-item">
                                            <img src={item.imageUrl} alt={item.category} />
                                        </div>
                                    ))}
                                </div>

                                <div className="post-actions">
                                    <button 
                                        className={`action-btn ${isLiked ? 'liked' : ''}`}
                                        onClick={() => toggleLike(post._id)}
                                    >
                                        <Heart 
                                            size={20} 
                                            className="action-icon"
                                            fill={isLiked ? "currentColor" : "none"} 
                                        />
                                        <span>{post.likes?.length || 0}</span>
                                    </button>

                                    <button 
                                        className={`action-btn ${isCommentsOpen ? 'active' : ''}`}
                                        onClick={() => setActiveComments(isCommentsOpen ? null : post._id)}
                                    >
                                        <MessageSquare size={20} className="action-icon" />
                                        <span>{post.comments?.length || 0}</span>
                                    </button>

                                    <button className="action-btn" onClick={() => handleShare(post)}>
                                        <Share2 size={20} className="action-icon" />
                                    </button>
                                </div>

                                {isCommentsOpen && (
                                    <div className="post-comments-section animation-fade-in">
                                        <div className="comments-list">
                                            {post.comments?.map((comment, cIdx) => (
                                                <div key={cIdx} className="comment-row">
                                                    <strong>{comment.userName || 'User'}:</strong>
                                                    <span>{comment.text}</span>
                                                </div>
                                            ))}
                                            {(!post.comments || post.comments.length === 0) && (
                                                <p className="no-comments">No comments yet. Be the first!</p>
                                            )}
                                        </div>
                                        <div className="comment-input-row">
                                            <input 
                                                type="text" 
                                                placeholder="Add a comment..." 
                                                value={commentText[post._id] || ''}
                                                onChange={(e) => setCommentText({ ...commentText, [post._id]: e.target.value })}
                                                onKeyPress={(e) => e.key === 'Enter' && handleCommentSubmit(post._id)}
                                            />
                                            <button onClick={() => handleCommentSubmit(post._id)}>Post</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Community;
