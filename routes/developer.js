const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');

// Developer Portal Data
router.get('/portal/categories', (req, res) => {
  try {
    const categories = {
      platforms: [
        { name: 'iOS', description: 'Build apps for iPhone and iPod touch', icon: 'Smartphone' },
        { name: 'iPadOS', description: 'Create experiences for iPad', icon: 'Monitor' },
        { name: 'macOS', description: 'Develop for Mac computers', icon: 'Monitor' },
        { name: 'tvOS', description: 'Build apps for Apple TV', icon: 'Tv' },
        { name: 'watchOS', description: 'Create apps for Apple Watch', icon: 'Watch' },
        { name: 'visionOS', description: 'Build spatial computing experiences', icon: 'Glasses' }
      ],
      tools: [
        { name: 'Swift', description: 'Powerful programming language', icon: 'Code' },
        { name: 'SwiftUI', description: 'Modern UI framework', icon: 'Palette' },
        { name: 'SF Symbols', description: 'Consistent iconography', icon: 'Settings' },
        { name: 'Swift Playground', description: 'Interactive learning', icon: 'BookOpen' },
        { name: 'TestFlight', description: 'Beta testing platform', icon: 'Cloud' },
        { name: 'Xcode', description: 'Complete development environment', icon: 'Wrench' },
        { name: 'Xcode Cloud', description: 'Continuous integration', icon: 'Cloud' }
      ],
      topics: [
        { name: 'Accessibility', description: 'Inclusive app design', icon: 'Users' },
        { name: 'App Extensions', description: 'Extend app functionality', icon: 'Settings' },
        { name: 'App Store', description: 'Distribution and discovery', icon: 'Download' },
        { name: 'Audio & Video', description: 'Media processing', icon: 'Camera' },
        { name: 'Augmented Reality', description: 'AR experiences', icon: 'Glasses' },
        { name: 'Design', description: 'UI/UX best practices', icon: 'Palette' },
        { name: 'Distribution', description: 'App deployment', icon: 'Cloud' },
        { name: 'Education', description: 'Learning resources', icon: 'GraduationCap' },
        { name: 'Fonts', description: 'Typography', icon: 'FileText' },
        { name: 'Games', description: 'Game development', icon: 'Gamepad2' },
        { name: 'Health & Fitness', description: 'Health data integration', icon: 'Shield' },
        { name: 'In-App Purchase', description: 'Monetization', icon: 'Settings' },
        { name: 'Localization', description: 'Multi-language support', icon: 'Users' },
        { name: 'Maps & Location', description: 'Location services', icon: 'Settings' },
        { name: 'Machine Learning', description: 'AI integration', icon: 'Brain' },
        { name: 'Open Source', description: 'Open source projects', icon: 'Code' },
        { name: 'Security', description: 'App security', icon: 'Lock' },
        { name: 'Safari & Web', description: 'Web integration', icon: 'Monitor' }
      ]
    };

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch developer portal categories',
      error: error.message
    });
  }
});

// Forum Categories and Discussions
router.get('/forum/categories', (req, res) => {
  try {
    const categories = {
      programming: {
        title: 'Programming Languages',
        description: 'Dive into the world of programming languages used for app development.',
        color: 'green',
        tags: ['Swift', 'General'],
        discussions: [
          { 
            id: 1,
            title: 'MenuBarExtra with .window style: .onHover modifier...', 
            time: '9h', 
            status: 'open',
            replies: 12,
            views: 156,
            author: 'Developer123'
          },
          { 
            id: 2,
            title: 'Undefined symbol', 
            time: '3d', 
            status: 'open',
            replies: 8,
            views: 89,
            author: 'SwiftDev'
          },
          { 
            id: 3,
            title: 'App mysteriously crashing in CFNetwork.LoaderQ...', 
            time: '1w', 
            status: 'open',
            replies: 15,
            views: 234,
            author: 'iOSExpert'
          }
        ]
      },
      ui: {
        title: 'UI Frameworks',
        description: 'Explore the various UI frameworks available for building app interfaces.',
        color: 'blue',
        tags: ['SwiftUI', 'General', 'UIKit', 'AppKit'],
        discussions: [
          { 
            id: 4,
            title: 'How To Position Controls With SwiftUI', 
            time: '1h', 
            status: 'solved',
            replies: 5,
            views: 78,
            author: 'SwiftUIGuru'
          },
          { 
            id: 5,
            title: 'Why isn\'t Liquid Glass effect applied when using...', 
            time: '1h', 
            status: 'solved',
            replies: 3,
            views: 45,
            author: 'DesignerPro'
          },
          { 
            id: 6,
            title: 'The Widget Image display on iOS26 transparency...', 
            time: '2h', 
            status: 'open',
            replies: 7,
            views: 92,
            author: 'WidgetMaster'
          }
        ]
      },
      safari: {
        title: 'Safari & Web',
        description: 'Explore the integration of web technologies within your app.',
        color: 'purple',
        tags: ['General'],
        discussions: [
          { 
            id: 7,
            title: 'Calling webViewWebContentProcessDidTerminate on...', 
            time: '11m', 
            status: 'open',
            replies: 2,
            views: 23,
            author: 'WebDev'
          },
          { 
            id: 8,
            title: 'iOS 26 is there a way to completely disable deleting...', 
            time: '2h', 
            status: 'open',
            replies: 4,
            views: 67,
            author: 'iOSDev'
          },
          { 
            id: 9,
            title: 'iOS 26 Safari & WebView: VisualViewport.offsetTo...', 
            time: '2d', 
            status: 'open',
            replies: 9,
            views: 134,
            author: 'SafariExpert'
          }
        ]
      },
      spatial: {
        title: 'Spatial Computing',
        description: 'Discuss spatial computing on Apple platforms and Vision Pro development.',
        color: 'orange',
        tags: ['Reality Composer Pro', 'General', 'ARKit'],
        discussions: [
          { 
            id: 10,
            title: 'VisionPro Enterprise.license file', 
            time: '1h', 
            status: 'open',
            replies: 6,
            views: 89,
            author: 'VisionProDev'
          },
          { 
            id: 11,
            title: 'Header Blur Effect on visionOS SwiftUI', 
            time: '3h', 
            status: 'open',
            replies: 4,
            views: 56,
            author: 'SpatialDesigner'
          },
          { 
            id: 12,
            title: 'Spatial Computing, ARPointCloud (rawFeaturePoints)', 
            time: '11h', 
            status: 'open',
            replies: 8,
            views: 112,
            author: 'ARExpert'
          }
        ]
      }
    };

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch forum categories',
      error: error.message
    });
  }
});

// Create new discussion
router.post('/forum/discussions', verifyToken, (req, res) => {
  try {
    const { category, title, content, tags } = req.body;
    
    if (!category || !title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Category, title, and content are required'
      });
    }

    const newDiscussion = {
      id: Date.now(),
      title,
      content,
      category,
      tags: tags || [],
      author: req.user.name,
      authorId: req.user.id,
      time: 'now',
      status: 'open',
      replies: 0,
      views: 0,
      createdAt: new Date()
    };

    // In a real app, you would save this to a database
    res.json({
      success: true,
      message: 'Discussion created successfully',
      data: newDiscussion
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create discussion',
      error: error.message
    });
  }
});

// Get discussion by ID
router.get('/forum/discussions/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // In a real app, you would fetch this from a database
    const discussion = {
      id: parseInt(id),
      title: 'Sample Discussion',
      content: 'This is a sample discussion content...',
      category: 'programming',
      tags: ['Swift', 'iOS'],
      author: 'SampleUser',
      time: '2h',
      status: 'open',
      replies: 5,
      views: 123,
      createdAt: new Date(),
      comments: [
        {
          id: 1,
          author: 'Commenter1',
          content: 'This is a helpful comment...',
          time: '1h',
          likes: 3
        },
        {
          id: 2,
          author: 'Commenter2',
          content: 'Another useful comment...',
          time: '30m',
          likes: 1
        }
      ]
    };

    res.json({
      success: true,
      data: discussion
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch discussion',
      error: error.message
    });
  }
});

// Developer Tools Data
router.get('/tools/categories', (req, res) => {
  try {
    const categories = {
      'code-signing': {
        title: 'Code Signing',
        description: 'Demystify code signing and its importance in app development.',
        color: 'purple',
        tags: ['General', 'Certificates, Identifiers & Profiles', 'Notarization', 'Entitlements'],
        discussions: [
          { 
            id: 1,
            title: 'Building macOS apps with Xcode 26 on macOS...', 
            time: '2h', 
            status: 'solved',
            replies: 8,
            views: 123,
            hasChat: true
          },
          { 
            id: 2,
            title: 'Notary Request Stuck In Pending', 
            time: '13h', 
            status: 'open',
            replies: 5,
            views: 89
          },
          { 
            id: 3,
            title: 'Tap To Pay Entitlement Not Working', 
            time: '1d', 
            status: 'open',
            replies: 12,
            views: 156
          }
        ]
      },
      community: {
        title: 'Community',
        description: 'This is a dedicated space for developers to connect and collaborate.',
        color: 'green',
        tags: ['Apple Developers', 'Apple Arcade', 'Swift Student Challenge', 'TestFlight'],
        discussions: [
          { 
            id: 4,
            title: 'Review rejected hidden features、web game and web...', 
            time: '5h', 
            status: 'open',
            replies: 3,
            views: 45
          },
          { 
            id: 5,
            title: 'Possible to bring back "Time in Bed" iOS feature?', 
            time: '9h', 
            status: 'open',
            replies: 7,
            views: 78
          },
          { 
            id: 6,
            title: 'HELP ME', 
            time: '2d', 
            status: 'open',
            replies: 15,
            views: 234
          }
        ]
      }
    };

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch developer tools categories',
      error: error.message
    });
  }
});

// App Store Distribution Data
router.get('/app-store/platforms', (req, res) => {
  try {
    const platforms = [
      { 
        name: 'iOS App Store', 
        description: 'Distribute iPhone and iPod touch apps',
        users: '1.8B+',
        revenue: '$85B+',
        color: 'blue'
      },
      { 
        name: 'macOS App Store', 
        description: 'Distribute Mac applications',
        users: '100M+',
        revenue: '$8B+',
        color: 'gray'
      },
      { 
        name: 'tvOS App Store', 
        description: 'Distribute Apple TV apps',
        users: '25M+',
        revenue: '$1B+',
        color: 'purple'
      },
      { 
        name: 'watchOS App Store', 
        description: 'Distribute Apple Watch apps',
        users: '100M+',
        revenue: '$2B+',
        color: 'green'
      },
      { 
        name: 'visionOS App Store', 
        description: 'Distribute spatial computing apps',
        users: '1M+',
        revenue: '$100M+',
        color: 'orange'
      }
    ];

    res.json({
      success: true,
      data: platforms
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch app store platforms',
      error: error.message
    });
  }
});

// App Store Analytics
router.get('/app-store/analytics', verifyToken, (req, res) => {
  try {
    const analytics = {
      downloads: { value: '1.2M', change: '+15%' },
      activeUsers: { value: '850K', change: '+8%' },
      revenue: { value: '$125K', change: '+22%' },
      rating: { value: '4.8', change: '+0.2' },
      conversionRate: { value: '12.5%', change: '+2.1%' },
      retentionRate: { value: '68%', change: '+5%' }
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch app store analytics',
      error: error.message
    });
  }
});

// Submit app for review
router.post('/app-store/submit', verifyToken, (req, res) => {
  try {
    const { appName, version, platform, metadata } = req.body;
    
    if (!appName || !version || !platform) {
      return res.status(400).json({
        success: false,
        message: 'App name, version, and platform are required'
      });
    }

    const submission = {
      id: Date.now(),
      appName,
      version,
      platform,
      metadata,
      status: 'pending',
      submittedBy: req.user.id,
      submittedAt: new Date(),
      estimatedReviewTime: '24-48 hours'
    };

    // In a real app, you would save this to a database and integrate with App Store Connect API
    res.json({
      success: true,
      message: 'App submitted for review successfully',
      data: submission
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to submit app for review',
      error: error.message
    });
  }
});

// Get submission status
router.get('/app-store/submissions/:id', verifyToken, (req, res) => {
  try {
    const { id } = req.params;
    
    // In a real app, you would fetch this from a database
    const submission = {
      id: parseInt(id),
      appName: 'Sample App',
      version: '1.0.0',
      platform: 'iOS',
      status: 'in_review',
      submittedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      estimatedReviewTime: '24-48 hours',
      reviewNotes: 'App is currently under review by Apple'
    };

    res.json({
      success: true,
      data: submission
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch submission status',
      error: error.message
    });
  }
});

module.exports = router;
