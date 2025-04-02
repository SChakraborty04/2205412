const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 3000;
const AUTH_HEADER = {
    headers: {
        Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzQzNjA0MjAyLCJpYXQiOjE3NDM2MDM5MDIsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6ImJkZDNjNzY4LTNlZGYtNGFmZC1iZWRmLTVlOTk3Y2QwMjVkZSIsInN1YiI6IjIyMDU0MTJAa2lpdC5hYy5pbiJ9LCJlbWFpbCI6IjIyMDU0MTJAa2lpdC5hYy5pbiIsIm5hbWUiOiJzYW5kaXBhbiBjaGFrcmFib3J0eSIsInJvbGxObyI6IjIyMDU0MTIiLCJhY2Nlc3NDb2RlIjoibndwd3JaIiwiY2xpZW50SUQiOiJiZGQzYzc2OC0zZWRmLTRhZmQtYmVkZi01ZTk5N2NkMDI1ZGUiLCJjbGllbnRTZWNyZXQiOiJoQmFzdXZqQnplUWFTQ0NxIn0.BT7ZcqDLmh620_Qek0mTnKvES6d1mJ8q-LxpOISWNEw"
    }
};

// Get top 5 users with the highest number of posts
app.get('/users', async (req, res) => {
    try {
        const usersResponse = await axios.get(`http://20.244.56.144/evaluation-service/users`,AUTH_HEADER);
        const users = usersResponse.data.users;
        
        let postCounts = {};
        await Promise.all(Object.keys(users).map(async (userId) => {
            const postsResponse = await axios.get(`http://20.244.56.144/evaluation-service/users/${userId}/posts`,AUTH_HEADER);
            postCounts[userId] = postsResponse.data.posts.length;
        }));
        
        const topUsers = Object.entries(postCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([userId, count]) => ({ id: userId, name: users[userId], postCount: count }));
        
        res.json({ topUsers });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get top or latest posts
app.get('/posts', async (req, res) => {
    try {
        const { type } = req.query;
        if (!type || (type !== 'popular' && type !== 'latest')) {
            return res.status(400).json({ error: 'Invalid type parameter. Use "popular" or "latest"' });
        }
        
        const usersResponse = await axios.get(`http://20.244.56.144/evaluation-service/users`,AUTH_HEADER);
        const userIds = Object.keys(usersResponse.data.users);
        
        let allPosts = [];
        await Promise.all(userIds.map(async (userId) => {
            const postsResponse = await axios.get(`http://20.244.56.144/evaluation-service/users/${userId}/posts`,AUTH_HEADER);
            allPosts.push(...postsResponse.data.posts);
        }));
        
        if (type === 'popular') {
            let commentCounts = {};
            await Promise.all(allPosts.map(async (post) => {
                const commentsResponse = await axios.get(`http://20.244.56.144/evaluation-service/posts/${post.id}/comments`,AUTH_HEADER);
                commentCounts[post.id] = commentsResponse.data.comments.length;
            }));
            
            const maxComments = Math.max(...Object.values(commentCounts));
            const popularPosts = allPosts.filter(post => commentCounts[post.id] === maxComments);
            
            return res.json({ popularPosts });
        }
        
        if (type === 'latest') {
            allPosts.sort((a, b) => b.id - a.id); // Assuming higher post ID means newer post
            return res.json({ latestPosts: allPosts.slice(0, 5) });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log(error);
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
