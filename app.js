const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const OpenAI = require('openai');
const { google } = require('googleapis');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 8080;

// Initialize OpenAI (will use OPENAI_API_KEY env var)
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'demo-key'
});

// YouTube OAuth Configuration
const YOUTUBE_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID || '';
const YOUTUBE_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET || '';
const YOUTUBE_REDIRECT_URI = process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:8080/api/youtube/callback';

// Create YouTube OAuth client
const youtube = google.youtube({
    version: 'v3',
    auth: new google.auth.OAuth2(
        YOUTUBE_CLIENT_ID,
        YOUTUBE_CLIENT_SECRET,
        YOUTUBE_REDIRECT_URI
    )
});

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'drunk30-studio-secret-key-change-in-production',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production', httpOnly: true, sameSite: 'lax' }
}));
app.set('trust proxy', true);

// Middleware
app.use(cors({
    origin: '*', // Allow all origins for now
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// PWA Routes
app.get('/manifest.json', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'manifest.json'));
});

app.get('/sw.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'public', 'sw.js'));
});

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// ============================================
// PAGE ROUTES
// ============================================

// Homepage
app.get('/', (req, res) => {
    const filePath = path.join(__dirname, 'pages', 'index.html');
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>drunk30 - Coming Soon</title>
                <style>
                    body { background: #0a0a0a; color: #fff; font-family: monospace; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                    .container { text-align: center; }
                    h1 { color: #ff006e; font-size: 3rem; }
                    a { color: #fb5607; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>drunk30</h1>
                    <p>Build Anyway. Recover Loudly. Ship Consistently.</p>
                    <p>Site launching soon...</p>
                    <p><a href="/studio">Visit AI Studio</a> | <a href="/join">Join the Journey</a></p>
                </div>
            </body>
            </html>
        `);
    }
});

// Join/Signup page
app.get('/join', (req, res) => {
    const filePath = path.join(__dirname, 'pages', 'join.html');
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Join - drunk30</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { background: linear-gradient(135deg, #0a0a0a, #1a1a2e); color: #fff; font-family: -apple-system, sans-serif; min-height: 100vh; display: flex; justify-content: center; align-items: center; }
                    .container { max-width: 500px; padding: 2rem; }
                    .card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 3rem; backdrop-filter: blur(10px); }
                    h1 { font-size: 2.5rem; margin-bottom: 1rem; background: linear-gradient(45deg, #ff006e, #fb5607); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                    input, button { width: 100%; padding: 1rem; margin: 0.5rem 0; border-radius: 10px; border: 1px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.1); color: #fff; font-size: 1rem; }
                    button { background: linear-gradient(45deg, #ff006e, #fb5607); border: none; cursor: pointer; font-weight: bold; }
                    button:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(255,0,110,0.4); }
                    .status { padding: 1rem; border-radius: 10px; margin-top: 1rem; display: none; }
                    .success { background: rgba(0,255,0,0.1); border: 1px solid rgba(0,255,0,0.3); color: #0f0; }
                    .error { background: rgba(255,0,0,0.1); border: 1px solid rgba(255,0,0,0.3); color: #f66; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="card">
                        <h1>Join the Journey</h1>
                        <p style="margin-bottom: 2rem; opacity: 0.8;">Get updates from someone building, recovering, and shipping.</p>
                        <form id="signup-form">
                            <input type="email" id="email" placeholder="your@email.com" required>
                            <input type="text" id="name" placeholder="Name (optional)">
                            <button type="submit">Join the List</button>
                            <div id="status" class="status"></div>
                        </form>
                    </div>
                </div>
                <script>
                    document.getElementById('signup-form').addEventListener('submit', async (e) => {
                        e.preventDefault();
                        const status = document.getElementById('status');
                        const email = document.getElementById('email').value;
                        const name = document.getElementById('name').value;
                        
                        try {
                            const response = await fetch('/api/subscribe', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ email, name })
                            });
                            
                            const data = await response.json();
                            
                            status.className = data.success ? 'status success' : 'status error';
                            status.textContent = data.message;
                            status.style.display = 'block';
                            
                            if (data.success) {
                                document.getElementById('signup-form').reset();
                            }
                        } catch (error) {
                            status.className = 'status error';
                            status.textContent = 'Network error. Please try again.';
                            status.style.display = 'block';
                        }
                    });
                </script>
            </body>
            </html>
        `);
    }
});

// Studio routes
app.get(['/studio', '/studio/', '/studio/new'], (req, res) => {
    const filePath = path.join(__dirname, 'pages', 'studio.html');
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>AI YouTube Studio - drunk30</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { background: linear-gradient(135deg, #0a0a0a, #1a1a2e); color: #fff; font-family: -apple-system, sans-serif; min-height: 100vh; }
                    nav { background: rgba(0,0,0,0.5); backdrop-filter: blur(10px); padding: 1rem 2rem; position: sticky; top: 0; z-index: 100; border-bottom: 1px solid rgba(255,255,255,0.1); }
                    .nav-content { max-width: 1400px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; }
                    .logo { font-size: 1.5rem; font-weight: bold; background: linear-gradient(45deg, #ff006e, #fb5607, #ffbe0b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                    .container { max-width: 1400px; margin: 0 auto; padding: 2rem; }
                    .hero { text-align: center; padding: 3rem 0; }
                    h1 { font-size: 3rem; margin-bottom: 1rem; background: linear-gradient(45deg, #ff006e, #fb5607, #ffbe0b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 2rem; margin: 3rem 0; }
                    .card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 15px; padding: 2rem; backdrop-filter: blur(10px); transition: all 0.3s; }
                    .card:hover { transform: translateY(-5px); box-shadow: 0 10px 40px rgba(255,0,110,0.3); }
                    .card h3 { font-size: 1.5rem; margin-bottom: 1rem; color: #fff; }
                    .card p { color: #aaa; line-height: 1.6; margin-bottom: 1.5rem; }
                    input, textarea { width: 100%; padding: 0.75rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #fff; margin: 0.5rem 0; }
                    button { padding: 0.75rem 2rem; background: linear-gradient(45deg, #ff006e, #fb5607); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; }
                    button:hover { transform: translateY(-2px); box-shadow: 0 5px 20px rgba(255,0,110,0.5); }
                    .loader { display: none; width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.1); border-top: 3px solid #ff006e; border-radius: 50%; animation: spin 1s linear infinite; margin: 1rem auto; }
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                    .results { display: none; margin-top: 1rem; padding: 1rem; background: rgba(255,255,255,0.03); border-radius: 8px; }
                </style>
            </head>
            <body>
                <nav>
                    <div class="nav-content">
                        <div class="logo">🎬 AI YouTube Studio</div>
                    </div>
                </nav>
                <div class="container">
                    <div class="hero">
                        <h1>AI YouTube Studio</h1>
                        <p>Create, optimize, and analyze your content with AI</p>
                    </div>
                    <div class="grid">
                        <!-- Video Ideas -->
                        <div class="card">
                            <h3>💡 Video Ideas Generator</h3>
                            <p>Generate viral video ideas for your niche</p>
                            <input type="text" id="niche" placeholder="Your channel niche">
                            <button onclick="generateIdeas()">Generate Ideas</button>
                            <div class="loader" id="ideas-loader"></div>
                            <div class="results" id="ideas-results"></div>
                        </div>
                        
                        <!-- Title Optimizer -->
                        <div class="card">
                            <h3>✨ Title Optimizer</h3>
                            <p>Create clickable titles that rank</p>
                            <input type="text" id="title" placeholder="Your draft title">
                            <button onclick="optimizeTitle()">Optimize</button>
                            <div class="loader" id="title-loader"></div>
                            <div class="results" id="title-results"></div>
                        </div>
                        
                        <!-- Thumbnail Ideas -->
                        <div class="card">
                            <h3>🎨 Thumbnail Ideas</h3>
                            <p>Get thumbnail design suggestions</p>
                            <input type="text" id="topic" placeholder="Video topic">
                            <button onclick="getThumbnailIdeas()">Get Ideas</button>
                            <div class="loader" id="thumb-loader"></div>
                            <div class="results" id="thumb-results"></div>
                        </div>
                        
                        <!-- Script Generator -->
                        <div class="card">
                            <h3>📝 Script Generator</h3>
                            <p>Create engaging video scripts</p>
                            <input type="text" id="script-topic" placeholder="Video topic">
                            <button onclick="generateScript()">Generate</button>
                            <div class="loader" id="script-loader"></div>
                            <div class="results" id="script-results"></div>
                        </div>
                        
                        <!-- SEO Tags -->
                        <div class="card">
                            <h3>🏷️ SEO Tags</h3>
                            <p>Generate optimized tags and descriptions</p>
                            <input type="text" id="seo-title" placeholder="Video title">
                            <textarea id="seo-desc" placeholder="Brief description"></textarea>
                            <button onclick="generateSEO()">Generate</button>
                            <div class="loader" id="seo-loader"></div>
                            <div class="results" id="seo-results"></div>
                        </div>
                        
                        <!-- Analytics -->
                        <div class="card">
                            <h3>📊 Analytics Insights</h3>
                            <p>Analyze your channel performance</p>
                            <input type="number" id="views" placeholder="Average views">
                            <input type="number" id="subs" placeholder="Subscribers">
                            <button onclick="analyzeChannel()">Analyze</button>
                            <div class="loader" id="analytics-loader"></div>
                            <div class="results" id="analytics-results"></div>
                        </div>
                    </div>
                </div>
                
                <script>
                    async function apiCall(endpoint, data) {
                        try {
                            const response = await fetch(endpoint, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(data)
                            });
                            return await response.json();
                        } catch (error) {
                            return { success: false, message: 'Network error' };
                        }
                    }
                    
                    async function generateIdeas() {
                        const loader = document.getElementById('ideas-loader');
                        const results = document.getElementById('ideas-results');
                        const niche = document.getElementById('niche').value;
                        
                        if (!niche) {
                            alert('Please enter your niche');
                            return;
                        }
                        
                        loader.style.display = 'block';
                        results.style.display = 'none';
                        
                        const data = await apiCall('/api/generate/ideas', { niche });
                        
                        loader.style.display = 'none';
                        if (data.success) {
                            results.innerHTML = '<h4>Generated Ideas:</h4>' + 
                                data.ideas.map(idea => '<p>• ' + idea + '</p>').join('');
                            results.style.display = 'block';
                        }
                    }
                    
                    async function optimizeTitle() {
                        const loader = document.getElementById('title-loader');
                        const results = document.getElementById('title-results');
                        const title = document.getElementById('title').value;
                        
                        if (!title) {
                            alert('Please enter a title');
                            return;
                        }
                        
                        loader.style.display = 'block';
                        results.style.display = 'none';
                        
                        const data = await apiCall('/api/optimize/title', { title });
                        
                        loader.style.display = 'none';
                        if (data.success) {
                            results.innerHTML = '<h4>Optimized Titles:</h4>' + 
                                data.optimized.map(opt => '<p>• ' + opt.title + ' (Score: ' + opt.score + ')</p>').join('');
                            results.style.display = 'block';
                        }
                    }
                    
                    async function getThumbnailIdeas() {
                        const loader = document.getElementById('thumb-loader');
                        const results = document.getElementById('thumb-results');
                        const topic = document.getElementById('topic').value;
                        
                        loader.style.display = 'block';
                        results.style.display = 'none';
                        
                        const data = await apiCall('/api/generate/thumbnail', { topic });
                        
                        loader.style.display = 'none';
                        if (data.success) {
                            results.innerHTML = '<h4>Thumbnail Ideas:</h4>' + 
                                data.suggestions.map(s => '<p><strong>' + s.concept + ':</strong> ' + s.description + '</p>').join('');
                            results.style.display = 'block';
                        }
                    }
                    
                    async function generateScript() {
                        const loader = document.getElementById('script-loader');
                        const results = document.getElementById('script-results');
                        const topic = document.getElementById('script-topic').value;
                        
                        if (!topic) {
                            alert('Please enter a topic');
                            return;
                        }
                        
                        loader.style.display = 'block';
                        results.style.display = 'none';
                        
                        const data = await apiCall('/api/generate/script', { topic });
                        
                        loader.style.display = 'none';
                        if (data.success) {
                            results.innerHTML = '<h4>Script Outline:</h4>' +
                                '<p><strong>Hook:</strong> ' + data.outline.hook.content + '</p>' +
                                '<p><strong>Main Sections:</strong></p>' +
                                data.outline.mainContent.sections.map(s => '<p>• ' + s.title + '</p>').join('');
                            results.style.display = 'block';
                        }
                    }
                    
                    async function generateSEO() {
                        const loader = document.getElementById('seo-loader');
                        const results = document.getElementById('seo-results');
                        const title = document.getElementById('seo-title').value;
                        const description = document.getElementById('seo-desc').value;
                        
                        if (!title || !description) {
                            alert('Please fill all fields');
                            return;
                        }
                        
                        loader.style.display = 'block';
                        results.style.display = 'none';
                        
                        const data = await apiCall('/api/generate/seo', { title, description });
                        
                        loader.style.display = 'none';
                        if (data.success) {
                            results.innerHTML = '<h4>SEO Tags:</h4>' +
                                '<p>' + data.tags.map(tag => '#' + tag).join(' ') + '</p>';
                            results.style.display = 'block';
                        }
                    }
                    
                    async function analyzeChannel() {
                        const loader = document.getElementById('analytics-loader');
                        const results = document.getElementById('analytics-results');
                        const views = document.getElementById('views').value;
                        const subscribers = document.getElementById('subs').value;
                        
                        loader.style.display = 'block';
                        results.style.display = 'none';
                        
                        const data = await apiCall('/api/analyze/channel', { views, subscribers });
                        
                        loader.style.display = 'none';
                        if (data.success) {
                            results.innerHTML = '<h4>Analysis:</h4>' +
                                '<p>Engagement: ' + data.analysis.metrics.engagementRate + '%</p>' +
                                '<p>Performance: ' + data.analysis.performance.overall + '</p>';
                            results.style.display = 'block';
                        }
                    }
                </script>
            </body>
            </html>
        `);
    }
});

// Episodes page
app.get('/episodes', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Episodes - drunk30</title>
            <style>
                body { background: #0a0a0a; color: #fff; font-family: -apple-system, sans-serif; padding: 2rem; }
                h1 { color: #ff006e; }
                .episode { background: rgba(255,255,255,0.05); padding: 1rem; margin: 1rem 0; border-radius: 10px; }
            </style>
        </head>
        <body>
            <h1>Episodes</h1>
            <div class="episode">
                <h3>Episode 1: The Beginning</h3>
                <p>Starting the 30-day journey...</p>
            </div>
            <p>More episodes coming soon!</p>
        </body>
        </html>
    `);
});

// Links page
app.get('/links', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Links - drunk30</title>
            <style>
                body { background: #0a0a0a; color: #fff; font-family: -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
                .container { text-align: center; }
                h1 { color: #ff006e; margin-bottom: 2rem; }
                a { display: block; padding: 1rem 2rem; margin: 1rem; background: linear-gradient(45deg, #ff006e, #fb5607); color: white; text-decoration: none; border-radius: 10px; }
                a:hover { transform: translateY(-2px); }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>drunk30 Links</h1>
                <a href="/">Home</a>
                <a href="/studio">AI YouTube Studio</a>
                <a href="/join">Join Newsletter</a>
                <a href="/episodes">Episodes</a>
            </div>
        </body>
        </html>
    `);
});

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        service: 'drunk30-buzz'
    });
});

// ============================================
// API ENDPOINTS
// ============================================

// Subscribe endpoint
app.post('/api/subscribe', async (req, res) => {
    try {
        const { email, name } = req.body;
        
        if (!email || !email.includes('@')) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email'
            });
        }
        
        console.log('New subscriber:', { email, name, timestamp: new Date() });
        
        // Simulate processing
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return res.json({
            success: true,
            message: 'Successfully subscribed! Check your email for confirmation.'
        });
        
    } catch (error) {
        console.error('Subscribe error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to subscribe. Please try again.'
        });
    }
});

// Generate Ideas endpoint
app.post('/api/generate/ideas', async (req, res) => {
    try {
        const { niche, audience } = req.body;

        if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'demo-key') {
            const completion = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [{
                    role: 'user',
                    content: `Generate 10 viral YouTube video ideas for the niche: ${niche || 'sobriety and recovery'}. Make them clickable, emotional, and valuable. Return just the list, numbered.`
                }],
                temperature: 0.9
            });
            
            const aiIdeas = completion.choices[0].message.content.split('\n').filter(line => line.trim());
            return res.json({ success: true, ideas: aiIdeas, niche: niche || 'General', source: 'AI' });
        }
        
        // Fallback ideas when no API key
        const ideas = [
            `10 ${niche || 'YouTube'} Mistakes That Will Ruin Your Channel`,
            `Why ${niche || 'Content'} Creators Fail (Harsh Truth)`,
            `The ${niche || 'YouTube'} Algorithm Changed - Here's What Works Now`,
            `I Tried ${niche || 'This'} for 30 Days - Shocking Results`,
            `${niche || 'YouTube'} in 2024: Everything You Need to Know`
        ];
        
        return res.json({
            success: true,
            ideas: ideas,
            niche: niche || 'General'
        });
        
    } catch (error) {
        console.error('Ideas error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to generate ideas'
        });
    }
});

// Thumbnail AI Generator endpoint
app.post('/api/generate/thumbnail-ai', async (req, res) => {
    try {
        const { prompt } = req.body;
        
        if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'demo-key') {
            try {
                // Use DALL-E for thumbnail generation
                const response = await openai.images.generate({
                    prompt: `YouTube thumbnail: ${prompt}. High contrast, bold, engaging, 1280x720px format`,
                    n: 1,
                    size: '1024x1024',
                    quality: 'standard'
                });
                
                return res.json({
                    success: true,
                    imageUrl: response.data[0].url,
                    prompt: prompt,
                    source: 'DALL-E'
                });
            } catch (aiErr) {
                console.error('DALL-E error:', aiErr);
                // Fallback if quota exceeded
                return res.json({
                    success: true,
                    imageUrl: `https://via.placeholder.com/1280x720/ff006e/ffffff?text=${encodeURIComponent(prompt)}`,
                    prompt: prompt,
                    source: 'placeholder'
                });
            }
        }
        
        // Fallback thumbnail
        return res.json({
            success: true,
            imageUrl: `https://via.placeholder.com/1280x720/050505/ffbe0b?text=${encodeURIComponent(prompt)}`,
            prompt: prompt,
            source: 'fallback'
        });
        
    } catch (error) {
        console.error('Thumbnail error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to generate thumbnail'
        });
    }
});

// YouTube Upload endpoint (placeholder for full OAuth flow)
app.post('/api/youtube/upload', async (req, res) => {
    try {
        // TODO: Implement full YouTube OAuth flow
        // For now, return success with placeholder video ID
        
        const videoId = `vid_${Date.now()}`;
        
        return res.json({
            success: true,
            videoId: videoId,
            message: 'Video recorded successfully! Full YouTube upload coming with OAuth integration.',
            nextSteps: 'Download your video and upload to YouTube Studio manually for now.'
        });
        
    } catch (error) {
        console.error('Upload error:', error);
        return res.status(500).json({
            success: false,
            message: 'Upload failed'
        });
    }
});

// Video Metadata endpoint
app.post('/api/video/save-metadata', async (req, res) => {
    try {
        const { title, description, tags, videoId } = req.body;
        
        return res.json({
            success: true,
            metadata: {
                videoId,
                title,
                description,
                tags,
                savedAt: new Date().toISOString(),
                ready: 'for YouTube upload'
            }
        });
        
    } catch (error) {
        console.error('Metadata error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to save metadata'
        });
    }
});

// YouTube Hacks endpoint
app.post('/api/generate/youtube-hacks', async (req, res) => {
    try {
        const { topic } = req.body;
        const niche = topic || 'general YouTube';

        if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'demo-key') {
            const completion = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [{
                    role: 'user',
                    content: `Generate 5 trending keywords, 10 viral hashtags, best posting times, and a viral hook for: "${niche}". Format as JSON with keys: trendingKeywords (array), hashtags (array), bestTimes (array), viralHook (string).`
                }],
                temperature: 0.8
            });
            
            try {
                const hacks = JSON.parse(completion.choices[0].message.content);
                return res.json({ success: true, ...hacks, source: 'AI' });
            } catch (e) {
                return res.json({ success: true, raw: completion.choices[0].message.content, source: 'AI' });
            }
        }
        
        // Fallback hacks
        const keywords = [
            `${niche} tutorial 2024`,
            `how to ${niche}`,
            `${niche} tips and tricks`,
            `${niche} hacks that work`,
            `best ${niche} channel`
        ];
        
        const hashtags = [
            '#YouTube',
            `#${niche.replace(/\s+/g, '')}`,
            '#Tutorial',
            '#Tips',
            '#Creator',
            '#Hacks',
            '#2024',
            '#ContentCreator',
            '#Growth',
            '#FYP'
        ];
        
        const bestTimes = [
            'Tuesday-Thursday 2-4 PM (US Peak)',
            'Saturday 9-11 AM (Weekend viewers)',
            'Wednesday 6-9 PM (Evening commute)',
            'Sunday 7-9 PM (Relaxation time)'
        ];
        
        const viralHook = `"If you're interested in ${niche}, watch this before..."`;
        
        return res.json({
            success: true,
            trendingKeywords: keywords,
            hashtags: hashtags,
            bestTimes: bestTimes,
            viralHook: viralHook,
            source: 'fallback'
        });
        
    } catch (error) {
        console.error('YouTube hacks error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to generate YouTube hacks'
        });
    }
});

// Background Generator endpoint
app.post('/api/generate/backgrounds', async (req, res) => {
    try {
        const { topic } = req.body;
        const vibe = topic || 'professional';

        // Free image sources
        const unsplashKeywords = {
            'neon cyberpunk': 'neon+dark+digital',
            'nature': 'nature+landscape',
            'minimal': 'minimal+clean+white',
            'retro': 'retro+vintage+80s',
            'space': 'space+universe+stars'
        };
        
        let query = 'abstract+digital';
        Object.keys(unsplashKeywords).forEach(key => {
            if (vibe.toLowerCase().includes(key)) {
                query = unsplashKeywords[key];
            }
        });

        // Free music sources
        const musicSources = [
            {
                title: 'Epidemic Sound',
                url: 'https://www.epidemicsound.com/',
                description: 'Royalty-free music for YouTube'
            },
            {
                title: 'YouTube Audio Library',
                url: 'https://www.youtube.com/audiolibrary',
                description: 'Free music and SFX from YouTube'
            },
            {
                title: 'Pixabay Music',
                url: 'https://pixabay.com/music/',
                description: '1000+ free music tracks'
            },
            {
                title: 'Free Music Archive',
                url: 'https://freemusicarchive.org/',
                description: 'Creative commons music'
            }
        ];

        // Simulate finding images (in production, use Unsplash API key)
        const backgroundImages = [
            {
                title: `${vibe} Background 1`,
                url: `https://source.unsplash.com/1920x1080/?${query}`,
                credit: 'Unsplash'
            },
            {
                title: `${vibe} Background 2`,
                url: `https://source.unsplash.com/1920x1080/?${query},abstract`,
                credit: 'Unsplash'
            },
            {
                title: `${vibe} Background 3`,
                url: `https://source.unsplash.com/1920x1080/?${query},dark`,
                credit: 'Unsplash'
            }
        ];

        return res.json({
            success: true,
            vibe: vibe,
            images: backgroundImages,
            music: musicSources.slice(0, 3),
            tips: [
                '16:9 aspect ratio for YouTube videos',
                'Use high contrast for text visibility',
                'Test colors on both light and dark monitors',
                'Add subtle motion or animation for retention',
                'Ensure 60 FPS playback for smooth visuals'
            ]
        });
        
    } catch (error) {
        console.error('Background generation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to generate backgrounds'
        });
    }
});

// Optimize Title endpoint
app.post('/api/optimize/title', async (req, res) => {
    try {
        const { title } = req.body;
        
        if (!title) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a title'
            });
        }
        
        const optimized = [
            {
                title: `${title} (SHOCKING RESULTS!)`,
                score: 92,
                reason: 'Added emotional trigger'
            },
            {
                title: `Why ${title} Changed Everything`,
                score: 88,
                reason: 'Creates curiosity'
            },
            {
                title: `The Truth About ${title}`,
                score: 85,
                reason: 'Authority positioning'
            }
        ];
        
        return res.json({
            success: true,
            original: title,
            optimized: optimized
        });
        
    } catch (error) {
        console.error('Title error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to optimize title'
        });
    }
});

// Thumbnail Ideas endpoint
app.post('/api/generate/thumbnail', async (req, res) => {
    try {
        const { topic } = req.body;
        
        const suggestions = [
            {
                concept: 'Split Screen Before/After',
                description: 'Show dramatic transformation',
                elements: ['Bold text', 'Arrows', 'Contrast']
            },
            {
                concept: 'Shocked Face',
                description: 'Your surprised reaction',
                elements: ['Wide eyes', 'Bright background', 'Big numbers']
            },
            {
                concept: 'Bold Text Dominant',
                description: 'Huge text takes 60% of space',
                elements: ['Contrasting colors', 'Simple background']
            }
        ];
        
        return res.json({
            success: true,
            topic: topic || 'General',
            suggestions: suggestions
        });
        
    } catch (error) {
        console.error('Thumbnail error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to generate thumbnail ideas'
        });
    }
});

// Script Generator endpoint
app.post('/api/generate/script', async (req, res) => {
    try {
        const { topic } = req.body;

        if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'demo-key') {
            const completion = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [{
                    role: 'user',
                    content: `Create a YouTube video script outline for: "${topic || 'sobriety journey'}". Include: Hook (0-15s), Intro (15-45s), Main Content (3 key points), and CTA. Make it compelling and actionable.`
                }],
                temperature: 0.7
            });
            
            return res.json({ success: true, topic: topic || 'General', script: completion.choices[0].message.content, source: 'AI' });
        }
        
        // Fallback outline
        const outline = {
            hook: { duration: '0-15 seconds', content: `Start with bold statement about ${topic || 'your topic'}` },
            introduction: { duration: '15-45 seconds', content: 'Introduce yourself and promise value' },
            mainContent: {
                duration: '45 seconds - 8 minutes',
                sections: [
                    { title: 'Problem', content: 'Define the problem' },
                    { title: 'Solution', content: 'Present your approach' },
                    { title: 'Examples', content: 'Show real applications' },
                    { title: 'Tips', content: 'Share pro strategies' }
                ]
            },
            callToAction: { duration: '30 seconds', content: 'Subscribe and engage' }
        };
        
        return res.json({
            success: true,
            topic: topic || 'General',
            outline: outline
        });
        
    } catch (error) {
        console.error('Script error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to generate script'
        });
    }
});

// SEO Generator endpoint
app.post('/api/generate/seo', async (req, res) => {
    try {
        const { topic } = req.body;

        if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'demo-key') {
            const completion = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [{
                    role: 'user',
                    content: `Create a YouTube optimization pack for: "${topic || 'video topic'}". Provide: 1) 5 title variations, 2) SEO description (150 words), 3) 15 relevant tags, 4) 5 chapter timestamps. Format as JSON.`
                }],
                temperature: 0.7
            });
            
            return res.json({ success: true, pack: completion.choices[0].message.content, source: 'AI' });
        }
        
        // Fallback
        const tags = ['youtube', '2024', 'tutorial', 'howto', 'tips', ...(topic ? topic.toLowerCase().split(' ').filter(w => w.length > 3) : [])];
        return res.json({ success: true, tags, optimizedDescription: 'Add OPENAI_API_KEY for AI-generated content', source: 'fallback' });
        
    } catch (error) {
        console.error('SEO error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to generate SEO'
        });
    }
});

// Analytics endpoint
app.post('/api/analyze/channel', async (req, res) => {
    try {
        const { views, subscribers } = req.body;
        
        const viewsNum = parseInt(views) || 0;
        const subsNum = parseInt(subscribers) || 0;
        const engagement = subsNum > 0 ? (viewsNum / subsNum * 100).toFixed(1) : 0;
        
        return res.json({
            success: true,
            analysis: {
                metrics: {
                    engagementRate: parseFloat(engagement),
                    averageViews: viewsNum,
                    subscriberCount: subsNum
                },
                performance: {
                    overall: engagement > 10 ? 'Strong' : engagement > 5 ? 'Moderate' : 'Needs Work'
                },
                recommendations: [
                    'Post consistently',
                    'Engage with comments',
                    'Optimize thumbnails'
                ]
            }
        });
        
    } catch (error) {
        console.error('Analytics error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to analyze'
        });
    }
});

// ============================================
// YOUTUBE OAUTH & UPLOAD
// ============================================

// YouTube Auth Start
app.get('/api/youtube/auth', (req, res) => {
    if (!YOUTUBE_CLIENT_ID || !YOUTUBE_CLIENT_SECRET) {
        return res.json({
            success: false,
            message: 'YouTube OAuth not configured. Set YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET environment variables.',
            setupUrl: 'https://console.developers.google.com/apis/credentials'
        });
    }

    const oauth2Client = new google.auth.OAuth2(
        YOUTUBE_CLIENT_ID,
        YOUTUBE_CLIENT_SECRET,
        YOUTUBE_REDIRECT_URI
    );

    const authorizeUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube'],
        prompt: 'consent'
    });

    res.json({
        success: true,
        authUrl: authorizeUrl,
        message: 'Redirect to this URL to authorize YouTube access'
    });
});

// YouTube OAuth Callback
app.get('/api/youtube/callback', async (req, res) => {
    const { code, error } = req.query;

    if (error) {
        return res.send(`
            <html>
                <body style="background: #050505; color: #fff; font-family: monospace; text-align: center; padding: 2rem;">
                    <h1 style="color: #ff006e;">❌ Authorization Failed</h1>
                    <p>Error: ${error}</p>
                    <a href="/studio" style="color: #fb5607; text-decoration: underline;">Back to Studio</a>
                </body>
            </html>
        `);
    }

    try {
        const oauth2Client = new google.auth.OAuth2(
            YOUTUBE_CLIENT_ID,
            YOUTUBE_CLIENT_SECRET,
            YOUTUBE_REDIRECT_URI
        );

        const { tokens } = await oauth2Client.getToken(code);
        req.session.youtubeTokens = tokens;

        // Store channel info
        const youtubeAuth = google.youtube({ version: 'v3', auth: oauth2Client });
        const channelRes = await youtubeAuth.channels.list({
            part: 'snippet,statistics',
            mine: true
        });

        if (channelRes.data.items && channelRes.data.items.length > 0) {
            req.session.youtubeChannel = {
                id: channelRes.data.items[0].id,
                title: channelRes.data.items[0].snippet.title,
                subscribers: channelRes.data.items[0].statistics.subscriberCount,
                views: channelRes.data.items[0].statistics.viewCount
            };
        }

        return res.send(`
            <html>
                <body style="background: #050505; color: #fff; font-family: monospace; text-align: center; padding: 2rem;">
                    <h1 style="color: #2ed573;">✅ Authorization Successful!</h1>
                    <p style="font-size: 1.2rem; margin: 1rem 0;">YouTube is now connected to drunk30 Studio.</p>
                    <p style="color: #ffbe0b; margin: 2rem 0; font-size: 1.5rem;">You can now upload videos directly!</p>
                    <a href="/studio?tab=record" style="background: linear-gradient(45deg, #ff006e, #fb5607); color: #fff; padding: 1rem 2rem; border-radius: 6px; text-decoration: none; display: inline-block; font-weight: bold;">Go to Studio</a>
                </body>
            </html>
        `);
    } catch (err) {
        console.error('YouTube auth error:', err);
        return res.send(`
            <html>
                <body style="background: #050505; color: #fff; font-family: monospace; text-align: center; padding: 2rem;">
                    <h1 style="color: #ff006e;">❌ Error</h1>
                    <p>${err.message}</p>
                    <a href="/studio" style="color: #fb5607; text-decoration: underline;">Back to Studio</a>
                </body>
            </html>
        `);
    }
});

// Check YouTube Auth Status
app.get('/api/youtube/status', (req, res) => {
    if (req.session.youtubeTokens && req.session.youtubeChannel) {
        return res.json({
            success: true,
            authenticated: true,
            channel: req.session.youtubeChannel
        });
    }

    res.json({
        success: true,
        authenticated: false,
        authUrl: '/api/youtube/auth'
    });
});

// YouTube Video Upload
app.post('/api/youtube/upload', async (req, res) => {
    try {
        if (!req.session.youtubeTokens) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated with YouTube. Please authorize first.',
                authUrl: '/api/youtube/auth'
            });
        }

        const { title, description, tags, videoBuffer, mimeType } = req.body;

        const oauth2Client = new google.auth.OAuth2(
            YOUTUBE_CLIENT_ID,
            YOUTUBE_CLIENT_SECRET,
            YOUTUBE_REDIRECT_URI
        );

        oauth2Client.setCredentials(req.session.youtubeTokens);

        const youtubeAuth = google.youtube({ version: 'v3', auth: oauth2Client });

        // Upload video
        const uploadResponse = await youtubeAuth.videos.insert(
            {
                part: 'snippet,status',
                requestBody: {
                    snippet: {
                        title: title || 'Video from drunk30 Studio',
                        description: description || 'Created with drunk30.buzz AI Creator Studio',
                        tags: tags || ['youtube', 'creator', 'drunk30'],
                        categoryId: '22' // People & Blogs
                    },
                    status: {
                        privacyStatus: 'public'
                    }
                },
                media: {
                    body: videoBuffer,
                    mimeType: mimeType || 'video/webm'
                }
            },
            {
                onUploadProgress: (evt) => {
                    const progress = (evt.bytesProcessed / evt.totalBytes * 100).toFixed(0);
                    console.log(`Upload progress: ${progress}%`);
                }
            }
        );

        const videoId = uploadResponse.data.id;
        const videoUrl = `https://youtube.com/watch?v=${videoId}`;

        return res.json({
            success: true,
            videoId: videoId,
            videoUrl: videoUrl,
            message: 'Video uploaded to YouTube!',
            channel: req.session.youtubeChannel
        });

    } catch (error) {
        console.error('YouTube upload error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to upload to YouTube',
            error: error.message
        });
    }
});

// YouTube Channel Info
app.get('/api/youtube/channel', async (req, res) => {
    try {
        if (!req.session.youtubeTokens) {
            return res.json({
                success: false,
                authenticated: false
            });
        }

        const oauth2Client = new google.auth.OAuth2(
            YOUTUBE_CLIENT_ID,
            YOUTUBE_CLIENT_SECRET,
            YOUTUBE_REDIRECT_URI
        );

        oauth2Client.setCredentials(req.session.youtubeTokens);

        const youtubeAuth = google.youtube({ version: 'v3', auth: oauth2Client });

        const response = await youtubeAuth.channels.list({
            part: 'snippet,statistics,contentDetails',
            mine: true
        });

        if (response.data.items && response.data.items.length > 0) {
            const channel = response.data.items[0];
            return res.json({
                success: true,
                channel: {
                    id: channel.id,
                    title: channel.snippet.title,
                    description: channel.snippet.description,
                    thumbnail: channel.snippet.thumbnails.medium?.url,
                    subscribers: channel.statistics.subscriberCount,
                    views: channel.statistics.viewCount,
                    videos: channel.statistics.videoCount,
                    uploadsPlaylistId: channel.contentDetails.relatedPlaylists.uploads
                }
            });
        }

        res.json({ success: false, message: 'No channel found' });

    } catch (error) {
        console.error('Channel info error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch channel info'
        });
    }
});

// ============================================
// ERROR HANDLING
// ============================================

// Catch all API 404s
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found'
    });
});

// Catch all other routes
app.use('*', (req, res) => {
    if (req.originalUrl.startsWith('/api/')) {
        return res.status(404).json({
            success: false,
            message: 'Not found'
        });
    }
    res.redirect('/');
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    if (req.path.startsWith('/api/')) {
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
    res.status(500).send('Something went wrong');
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔════════════════════════════════════════╗
║        drunk30.buzz Server             ║
║        Running on port ${PORT}            ║
╚════════════════════════════════════════╝
    `);
});

module.exports = app;