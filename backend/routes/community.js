const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const OutfitPost = require('../models/OutfitPost');
const Item = require('../models/Item');

// @route   GET /api/community
// @desc    Get all public outfit posts, with user and item details populated
router.get('/', auth, async (req, res) => {
    try {
        const posts = await OutfitPost.find()
            .populate('userId', 'name')
            .populate('items', 'imageUrl category type color _id')
            .sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        console.error('Error fetching community posts:', err);
        res.status(500).json({ message: 'Server error fetching posts' });
    }
});

// @route   POST /api/community
// @desc    Share an outfit to the community
router.post('/', auth, async (req, res) => {
    try {
        const { items, occasion, description } = req.body;
        
        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'An outfit must contain items' });
        }

        const newPost = new OutfitPost({
            userId: req.userId,
            items,
            occasion: occasion || 'Stylist Recommendation',
            description: description || ''
        });

        const savedPost = await newPost.save();
        
        // Return populated post right away to display it cleanly on the frontend if needed
        const populatedPost = await OutfitPost.findById(savedPost._id)
            .populate('userId', 'name')
            .populate('items', 'imageUrl category type color _id');

        res.status(201).json(populatedPost);
    } catch (err) {
        console.error('Error sharing outfit:', err);
        res.status(500).json({ message: 'Server error sharing outfit' });
    }
});

// @route   PATCH /api/community/:id/like
// @desc    Toggle like on a post
router.patch('/:id/like', auth, async (req, res) => {
    try {
        const post = await OutfitPost.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Check if the post is already liked by the user
        const index = post.likes.indexOf(req.userId);
        if (index === -1) {
            // Not liked, add the user to likes array
            post.likes.push(req.userId);
        } else {
            // Already liked, remove the user
            post.likes.splice(index, 1);
        }

        await post.save();
        res.json({ likes: post.likes });
    } catch (err) {
        console.error('Error toggling like:', err);
        res.status(500).json({ message: 'Server error toggling like' });
    }
});

// @route   POST /api/community/:id/comment
// @desc    Add a comment to a post
router.post('/:id/comment', auth, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ message: 'Comment text is required' });

        const post = await OutfitPost.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        // Get user name for display
        const User = require('../models/User');
        const user = await User.findById(req.userId);

        post.comments.push({
            userId: req.userId,
            userName: user.name,
            text,
        });

        await post.save();
        res.json(post.comments);
    } catch (err) {
        console.error('Error adding comment:', err);
        res.status(500).json({ message: 'Server error adding comment' });
    }
});

module.exports = router;

// @route   DELETE /api/community/:id
// @desc    Delete a post (only if owned by logged-in user)
router.delete('/:id', auth, async (req, res) => {
    try {
        const post = await OutfitPost.findOne({ _id: req.params.id, userId: req.userId });
        if (!post) {
            return res.status(404).json({ message: 'Post not found or unauthorized' });
        }
        await post.deleteOne();
        res.json({ message: 'Post deleted successfully' });
    } catch (err) {
        console.error('Error deleting post:', err);
        res.status(500).json({ message: 'Server error deleting post' });
    }
});
