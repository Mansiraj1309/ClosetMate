import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Heart, MessageSquare, Compass, Share2 } from 'lucide-react';
import './Community.css';

const Community = () => {
    const { token, user } = useAuth();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchPosts();
    }, [token]);

    const fetchPosts = async () => {
        if (!token) return;
        try {
            const res = await fetch('http://localhost:5001/api/community', {
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

            const res = await fetch(`http://localhost:5001/api/community/${postId}/like`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!res.ok) throw new Error('Failed to toggle like');
            const data = await res.json();
            
            // Sync with actual server response
            setPosts(posts.map(post => 
                post._id === postId ? { ...post, likes: data.likes } : post
            ));
        } catch (err) {
            console.error(err);
            // On error, fetch posts again to revert optimistic update
            fetchPosts();
        }
    };

    if (loading) {
        return (
            <div className="community-page">
                <div className="community-empty">
                    <Compass size={48} className="spin" />
                    <p>Loading community inspiration...</p>
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
                <h1 className="gradient-text">Community Feed</h1>
                <p className="subtitle">Get inspired by outfits generated and shared by other ClosetMate users.</p>
            </header>

            {posts.length === 0 ? (
                <div className="community-empty">
                    <Compass size={48} />
                    <h3>No posts yet.</h3>
                    <p>Be the first to share an AI outfit from the Stylist page!</p>
                </div>
            ) : (
                <div className="feed-container">
                    {posts.map(post => {
                        const isLiked = user && post.likes.includes(user.id);
                        
                        return (
                            <div key={post._id} className="post-card glass-card">
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
                                        <span>{post.likes.length}</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Community;
