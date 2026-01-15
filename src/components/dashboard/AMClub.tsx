import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow, format } from "date-fns";
import { bg, enUS } from "date-fns/locale";
import {
  MessageSquare,
  Search,
  Plus,
  ThumbsUp,
  MessageCircle,
  Eye,
  Clock,
  Tag,
  Pin,
  Trophy,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  HelpCircle,
  Megaphone,
  Bookmark,
  Send,
  ChevronUp,
  ChevronDown,
  Flag,
  Edit,
  Trash2,
} from "lucide-react";

interface ForumPost {
  id: string;
  title: string;
  content: string;
  category: 'question' | 'discussion' | 'announcement' | 'tip' | 'showcase';
  tags: string[];
  author_id: string;
  author_name: string;
  author_image?: string;
  created_at: string;
  updated_at: string;
  is_pinned: boolean;
  is_solved: boolean;
  view_count: number;
  upvotes: number;
  reply_count: number;
}

interface ForumReply {
  id: string;
  post_id: string;
  content: string;
  author_id: string;
  author_name: string;
  author_image?: string;
  created_at: string;
  updated_at: string;
  upvotes: number;
  is_answer: boolean;
}

// Mock data for demonstration - in production, this would come from Supabase
const MOCK_POSTS: ForumPost[] = [
  {
    id: "1",
    title: "Best practices for post-processing SLA prints?",
    content: "I've been working with SLA printing for a few months now, and I'm still struggling with consistent post-processing results. What are your best practices for washing and curing times? Any tips for avoiding warping during the curing process?",
    category: "question",
    tags: ["SLA", "post-processing", "resin", "curing"],
    author_id: "user1",
    author_name: "Иван Петров",
    author_image: undefined,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    is_pinned: false,
    is_solved: false,
    view_count: 42,
    upvotes: 8,
    reply_count: 5,
  },
  {
    id: "2",
    title: "Announcement: BAMAS Working Group Meeting - February 2026",
    content: "Dear members, we're excited to announce the next BAMAS Working Group meeting scheduled for February 15th, 2026. The main topics will include: 1) Industry collaboration updates, 2) New standards implementation, 3) Funding opportunities discussion.",
    category: "announcement",
    tags: ["meeting", "working-group", "BAMAS"],
    author_id: "admin",
    author_name: "BAMAS Admin",
    author_image: undefined,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    is_pinned: true,
    is_solved: false,
    view_count: 156,
    upvotes: 24,
    reply_count: 12,
  },
  {
    id: "3",
    title: "Tip: Optimize support structures for metal LPBF",
    content: "After extensive testing, here's my approach to minimizing support material in metal LPBF:\n\n1. Design self-supporting angles (>45° from horizontal)\n2. Use lattice supports instead of solid\n3. Optimize orientation for heat dissipation\n4. Consider part consolidation\n\nThis has reduced our post-processing time by 40%!",
    category: "tip",
    tags: ["LPBF", "metal", "supports", "optimization"],
    author_id: "user2",
    author_name: "Maria Georgieva",
    author_image: undefined,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    is_pinned: false,
    is_solved: false,
    view_count: 89,
    upvotes: 32,
    reply_count: 8,
  },
  {
    id: "4",
    title: "Showcase: Titanium aerospace bracket - 60% weight reduction",
    content: "We recently completed a project to redesign a conventional aluminum bracket for aerospace application. Using topology optimization and Ti-6Al-4V LPBF, we achieved:\n\n- 60% weight reduction\n- 15% stiffness increase\n- Part consolidation from 4 pieces to 1\n\nHappy to share more details if interested!",
    category: "showcase",
    tags: ["aerospace", "titanium", "topology-optimization", "case-study"],
    author_id: "user3",
    author_name: "Dimitar Nikolov",
    author_image: undefined,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    is_pinned: false,
    is_solved: false,
    view_count: 234,
    upvotes: 45,
    reply_count: 15,
  },
  {
    id: "5",
    title: "Discussion: Future of AM in Bulgarian industry",
    content: "I'd like to start a discussion about the future direction of additive manufacturing in Bulgaria. What industries do you see adopting AM in the next 5 years? What barriers need to be overcome? How can BAMAS help facilitate this transition?",
    category: "discussion",
    tags: ["Bulgaria", "industry", "future", "strategy"],
    author_id: "user4",
    author_name: "Elena Todorova",
    author_image: undefined,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    is_pinned: false,
    is_solved: false,
    view_count: 178,
    upvotes: 28,
    reply_count: 22,
  },
];

const MOCK_REPLIES: ForumReply[] = [
  {
    id: "r1",
    post_id: "1",
    content: "For SLA post-processing, I recommend:\n\n1. Use a two-stage IPA wash (dirty then clean)\n2. Wash for 10-15 minutes total\n3. Let parts air dry before curing\n4. Cure on a rotating platform for even exposure\n\nThis has given me consistent results!",
    author_id: "user2",
    author_name: "Maria Georgieva",
    author_image: undefined,
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    upvotes: 5,
    is_answer: false,
  },
  {
    id: "r2",
    post_id: "1",
    content: "To avoid warping during curing, try:\n- Support the part on a stable surface\n- Use lower intensity UV for longer time\n- Don't cure parts that are still wet\n- Consider using a glycerin bath for clear resins",
    author_id: "user3",
    author_name: "Dimitar Nikolov",
    author_image: undefined,
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    upvotes: 3,
    is_answer: true,
  },
];

const CATEGORIES = [
  { value: 'all', label: 'All Posts', icon: MessageSquare },
  { value: 'question', label: 'Questions', icon: HelpCircle },
  { value: 'discussion', label: 'Discussions', icon: MessageCircle },
  { value: 'announcement', label: 'Announcements', icon: Megaphone },
  { value: 'tip', label: 'Tips & Tricks', icon: Lightbulb },
  { value: 'showcase', label: 'Showcase', icon: Trophy },
];

const POPULAR_TAGS = [
  "LPBF", "SLA", "SLS", "FDM", "metal", "polymer", "post-processing",
  "design", "materials", "software", "medical", "aerospace", "automotive",
  "Bulgaria", "certification", "standards", "training"
];

const AMClub = () => {
  const { t, language } = useLanguage();
  const { user, isSuperAdmin, isAdmin } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<ForumPost[]>(MOCK_POSTS);
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"recent" | "popular" | "unanswered">("recent");
  const [isNewPostOpen, setIsNewPostOpen] = useState(false);
  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    category: "question" as ForumPost["category"],
    tags: [] as string[],
    newTag: "",
  });
  const [newReply, setNewReply] = useState("");
  
  const dateLocale = language === 'bg' ? bg : enUS;
  
  // Filter and sort posts
  const filteredPosts = posts.filter(post => {
    // Category filter
    if (selectedCategory !== "all" && post.category !== selectedCategory) return false;
    
    // Tag filter
    if (selectedTags.length > 0 && !selectedTags.some(tag => post.tags.includes(tag))) return false;
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        post.title.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query) ||
        post.tags.some(tag => tag.toLowerCase().includes(query)) ||
        post.author_name.toLowerCase().includes(query)
      );
    }
    
    return true;
  }).sort((a, b) => {
    // Pinned posts always first
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    
    // Then sort by selected criteria
    switch (sortBy) {
      case "recent":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case "popular":
        return (b.upvotes + b.reply_count * 2) - (a.upvotes + a.reply_count * 2);
      case "unanswered":
        if (a.is_solved && !b.is_solved) return 1;
        if (!a.is_solved && b.is_solved) return -1;
        return a.reply_count - b.reply_count;
      default:
        return 0;
    }
  });
  
  const loadReplies = (postId: string) => {
    // In production, fetch from Supabase
    setReplies(MOCK_REPLIES.filter(r => r.post_id === postId));
  };
  
  const handleViewPost = (post: ForumPost) => {
    setSelectedPost(post);
    loadReplies(post.id);
    // Increment view count (in production, this would be a Supabase call)
    setPosts(prev => prev.map(p => 
      p.id === post.id ? { ...p, view_count: p.view_count + 1 } : p
    ));
  };
  
  const handleCreatePost = async () => {
    if (!newPost.title.trim() || !newPost.content.trim()) {
      toast({
        title: t("dashboard.amclub.error.validation") || "Validation Error",
        description: t("dashboard.amclub.error.required") || "Title and content are required",
        variant: "destructive",
      });
      return;
    }
    
    // In production, this would create in Supabase
    const post: ForumPost = {
      id: `new-${Date.now()}`,
      title: newPost.title,
      content: newPost.content,
      category: newPost.category,
      tags: newPost.tags,
      author_id: user?.id || "",
      author_name: user?.name || "Unknown",
      author_image: user?.image,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_pinned: false,
      is_solved: false,
      view_count: 0,
      upvotes: 0,
      reply_count: 0,
    };
    
    setPosts(prev => [post, ...prev]);
    setNewPost({ title: "", content: "", category: "question", tags: [], newTag: "" });
    setIsNewPostOpen(false);
    
    toast({
      title: t("dashboard.amclub.success.created") || "Post Created",
      description: t("dashboard.amclub.success.createdDesc") || "Your post has been published",
    });
  };
  
  const handleAddReply = async () => {
    if (!newReply.trim() || !selectedPost) return;
    
    const reply: ForumReply = {
      id: `reply-${Date.now()}`,
      post_id: selectedPost.id,
      content: newReply,
      author_id: user?.id || "",
      author_name: user?.name || "Unknown",
      author_image: user?.image,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      upvotes: 0,
      is_answer: false,
    };
    
    setReplies(prev => [...prev, reply]);
    setPosts(prev => prev.map(p => 
      p.id === selectedPost.id ? { ...p, reply_count: p.reply_count + 1 } : p
    ));
    setNewReply("");
    
    toast({
      title: t("dashboard.amclub.success.replied") || "Reply Posted",
      description: t("dashboard.amclub.success.repliedDesc") || "Your reply has been added",
    });
  };
  
  const handleUpvote = (postId: string) => {
    setPosts(prev => prev.map(p => 
      p.id === postId ? { ...p, upvotes: p.upvotes + 1 } : p
    ));
  };
  
  const handleUpvoteReply = (replyId: string) => {
    setReplies(prev => prev.map(r => 
      r.id === replyId ? { ...r, upvotes: r.upvotes + 1 } : r
    ));
  };
  
  const handleAddTag = () => {
    if (newPost.newTag.trim() && !newPost.tags.includes(newPost.newTag.trim())) {
      setNewPost(prev => ({
        ...prev,
        tags: [...prev.tags, prev.newTag.trim()],
        newTag: "",
      }));
    }
  };
  
  const handleRemoveTag = (tag: string) => {
    setNewPost(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  };
  
  const toggleTagFilter = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };
  
  const getCategoryIcon = (category: ForumPost["category"]) => {
    switch (category) {
      case 'question': return <HelpCircle className="h-4 w-4" />;
      case 'discussion': return <MessageCircle className="h-4 w-4" />;
      case 'announcement': return <Megaphone className="h-4 w-4" />;
      case 'tip': return <Lightbulb className="h-4 w-4" />;
      case 'showcase': return <Trophy className="h-4 w-4" />;
    }
  };
  
  const getCategoryColor = (category: ForumPost["category"]) => {
    switch (category) {
      case 'question': return 'bg-blue-500/10 text-blue-600 border-blue-500/30';
      case 'discussion': return 'bg-purple-500/10 text-purple-600 border-purple-500/30';
      case 'announcement': return 'bg-red-500/10 text-red-600 border-red-500/30';
      case 'tip': return 'bg-green-500/10 text-green-600 border-green-500/30';
      case 'showcase': return 'bg-orange-500/10 text-orange-600 border-orange-500/30';
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          <h2 className="text-2xl font-bold">{t("dashboard.amclub.title") || "AM Club"}</h2>
        </div>
        <Button onClick={() => setIsNewPostOpen(true)} className="rounded-full">
          <Plus className="mr-2 h-4 w-4" />
          {t("dashboard.amclub.newPost") || "New Post"}
        </Button>
      </div>
      
      <p className="text-muted-foreground">
        {t("dashboard.amclub.description") || "Community forum for additive manufacturing discussions, questions, and knowledge sharing"}
      </p>
      
      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder={t("dashboard.amclub.search.placeholder") || "Search posts..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-full pl-10"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                <SelectTrigger className="w-full sm:w-[150px] rounded-full">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">{t("dashboard.amclub.sort.recent") || "Most Recent"}</SelectItem>
                  <SelectItem value="popular">{t("dashboard.amclub.sort.popular") || "Most Popular"}</SelectItem>
                  <SelectItem value="unanswered">{t("dashboard.amclub.sort.unanswered") || "Unanswered"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <Button
                  key={cat.value}
                  variant={selectedCategory === cat.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.value)}
                  className="rounded-full"
                >
                  <cat.icon className="mr-1 h-3 w-3" />
                  {cat.label}
                </Button>
              ))}
            </div>
            
            {/* Popular Tags */}
            <div className="flex flex-wrap gap-1">
              <Tag className="h-4 w-4 text-muted-foreground mr-1" />
              {POPULAR_TAGS.slice(0, 10).map(tag => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer rounded-full text-xs"
                  onClick={() => toggleTagFilter(tag)}
                >
                  {tag}
                </Badge>
              ))}
              {selectedTags.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTags([])}
                  className="text-xs h-5 px-2"
                >
                  Clear filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Posts List */}
        <div className="lg:col-span-2 space-y-4">
          {filteredPosts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t("dashboard.amclub.noPosts") || "No posts found"}</p>
              </CardContent>
            </Card>
          ) : (
            filteredPosts.map(post => (
              <Card
                key={post.id}
                className={`cursor-pointer hover:shadow-md transition-shadow ${
                  post.is_pinned ? 'border-primary/50 bg-primary/5' : ''
                }`}
                onClick={() => handleViewPost(post)}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Votes column */}
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => { e.stopPropagation(); handleUpvote(post.id); }}
                      >
                        <ChevronUp className="h-5 w-5" />
                      </Button>
                      <span className="font-semibold text-foreground">{post.upvotes}</span>
                      <span className="text-xs">{t("dashboard.amclub.votes") || "votes"}</span>
                    </div>
                    
                    {/* Content column */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {post.is_pinned && (
                            <Pin className="h-4 w-4 text-primary" />
                          )}
                          {post.is_solved && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          <Badge variant="outline" className={`rounded-full ${getCategoryColor(post.category)}`}>
                            {getCategoryIcon(post.category)}
                            <span className="ml-1">{post.category}</span>
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: dateLocale })}
                        </span>
                      </div>
                      
                      <h3 className="font-semibold mt-2 line-clamp-1">{post.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{post.content}</p>
                      
                      <div className="flex flex-wrap gap-1 mt-2">
                        {post.tags.slice(0, 4).map(tag => (
                          <Badge key={tag} variant="secondary" className="rounded-full text-xs">{tag}</Badge>
                        ))}
                        {post.tags.length > 4 && (
                          <Badge variant="secondary" className="rounded-full text-xs">+{post.tags.length - 4}</Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={post.author_image} />
                            <AvatarFallback className="text-[8px]">
                              {post.author_name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{post.author_name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {post.view_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            {post.reply_count}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        
        {/* Sidebar */}
        <div className="space-y-4">
          {/* Stats Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t("dashboard.amclub.stats.title") || "Community Stats"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("dashboard.amclub.stats.posts") || "Total Posts"}</span>
                <span className="font-semibold">{posts.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("dashboard.amclub.stats.questions") || "Questions"}</span>
                <span className="font-semibold">{posts.filter(p => p.category === 'question').length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("dashboard.amclub.stats.solved") || "Solved"}</span>
                <span className="font-semibold text-green-600">{posts.filter(p => p.is_solved).length}</span>
              </div>
            </CardContent>
          </Card>
          
          {/* Top Contributors */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                {t("dashboard.amclub.topContributors") || "Top Contributors"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { name: "Maria Georgieva", posts: 15, answers: 28 },
                { name: "Dimitar Nikolov", posts: 12, answers: 22 },
                { name: "Иван Петров", posts: 8, answers: 15 },
              ].map((contributor, i) => (
                <div key={contributor.name} className="flex items-center gap-2">
                  <span className="text-lg font-bold text-muted-foreground w-5">{i + 1}</span>
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-[8px]">
                      {contributor.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{contributor.name}</p>
                    <p className="text-xs text-muted-foreground">{contributor.answers} answers</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          
          {/* Guidelines */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t("dashboard.amclub.guidelines.title") || "Community Guidelines"}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>• {t("dashboard.amclub.guidelines.respectful") || "Be respectful and professional"}</p>
              <p>• {t("dashboard.amclub.guidelines.searchFirst") || "Search before asking"}</p>
              <p>• {t("dashboard.amclub.guidelines.detailed") || "Provide detailed questions"}</p>
              <p>• {t("dashboard.amclub.guidelines.share") || "Share your knowledge"}</p>
              <p>• {t("dashboard.amclub.guidelines.acknowledge") || "Acknowledge helpful answers"}</p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Post Detail Dialog */}
      <Dialog open={!!selectedPost} onOpenChange={(open) => !open && setSelectedPost(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
          {selectedPost && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedPost.is_pinned && <Pin className="h-4 w-4 text-primary" />}
                  {selectedPost.is_solved && <CheckCircle className="h-4 w-4 text-green-500" />}
                  <Badge variant="outline" className={`rounded-full ${getCategoryColor(selectedPost.category)}`}>
                    {getCategoryIcon(selectedPost.category)}
                    <span className="ml-1">{selectedPost.category}</span>
                  </Badge>
                </div>
                <DialogTitle className="text-xl">{selectedPost.title}</DialogTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={selectedPost.author_image} />
                    <AvatarFallback className="text-[8px]">
                      {selectedPost.author_name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <span>{selectedPost.author_name}</span>
                  <span>•</span>
                  <span>{formatDistanceToNow(new Date(selectedPost.created_at), { addSuffix: true, locale: dateLocale })}</span>
                </div>
              </DialogHeader>
              
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4">
                  {/* Post Content */}
                  <div className="whitespace-pre-wrap text-sm">{selectedPost.content}</div>
                  
                  <div className="flex flex-wrap gap-1">
                    {selectedPost.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="rounded-full">{tag}</Badge>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {selectedPost.view_count} views
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="h-4 w-4" />
                      {selectedPost.upvotes} upvotes
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-4 w-4" />
                      {selectedPost.reply_count} replies
                    </span>
                  </div>
                  
                  <Separator />
                  
                  {/* Replies */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">
                      {t("dashboard.amclub.replies") || "Replies"} ({replies.length})
                    </h4>
                    
                    {replies.map(reply => (
                      <Card key={reply.id} className={reply.is_answer ? 'border-green-500/50 bg-green-500/5' : ''}>
                        <CardContent className="p-4">
                          {reply.is_answer && (
                            <Badge className="mb-2 rounded-full bg-green-500">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Accepted Answer
                            </Badge>
                          )}
                          <p className="text-sm whitespace-pre-wrap">{reply.content}</p>
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Avatar className="h-4 w-4">
                                <AvatarImage src={reply.author_image} />
                                <AvatarFallback className="text-[6px]">
                                  {reply.author_name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <span>{reply.author_name}</span>
                              <span>•</span>
                              <span>{formatDistanceToNow(new Date(reply.created_at), { addSuffix: true, locale: dateLocale })}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUpvoteReply(reply.id)}
                            >
                              <ThumbsUp className="mr-1 h-3 w-3" />
                              {reply.upvotes}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    {/* Reply Form */}
                    <div className="space-y-2">
                      <Label>{t("dashboard.amclub.yourReply") || "Your Reply"}</Label>
                      <Textarea
                        value={newReply}
                        onChange={(e) => setNewReply(e.target.value)}
                        placeholder={t("dashboard.amclub.replyPlaceholder") || "Share your thoughts or answer..."}
                        className="min-h-[100px]"
                      />
                      <Button
                        onClick={handleAddReply}
                        disabled={!newReply.trim()}
                        className="rounded-full"
                      >
                        <Send className="mr-2 h-4 w-4" />
                        {t("dashboard.amclub.postReply") || "Post Reply"}
                      </Button>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* New Post Dialog */}
      <Dialog open={isNewPostOpen} onOpenChange={setIsNewPostOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t("dashboard.amclub.createPost") || "Create New Post"}</DialogTitle>
            <DialogDescription>
              {t("dashboard.amclub.createPostDesc") || "Share a question, tip, or start a discussion"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("dashboard.amclub.form.category") || "Category"}</Label>
              <Select
                value={newPost.category}
                onValueChange={(v) => setNewPost(prev => ({ ...prev, category: v as ForumPost["category"] }))}
              >
                <SelectTrigger className="rounded-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.filter(c => c.value !== 'all').map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <span className="flex items-center gap-2">
                        <cat.icon className="h-4 w-4" />
                        {cat.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>{t("dashboard.amclub.form.title") || "Title"}</Label>
              <Input
                value={newPost.title}
                onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                placeholder={t("dashboard.amclub.form.titlePlaceholder") || "What's your question or topic?"}
                className="rounded-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label>{t("dashboard.amclub.form.content") || "Content"}</Label>
              <Textarea
                value={newPost.content}
                onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                placeholder={t("dashboard.amclub.form.contentPlaceholder") || "Provide details..."}
                className="min-h-[150px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label>{t("dashboard.amclub.form.tags") || "Tags"}</Label>
              <div className="flex gap-2">
                <Input
                  value={newPost.newTag}
                  onChange={(e) => setNewPost(prev => ({ ...prev, newTag: e.target.value }))}
                  placeholder={t("dashboard.amclub.form.addTag") || "Add a tag..."}
                  className="rounded-full"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                />
                <Button variant="outline" onClick={handleAddTag} className="rounded-full">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {newPost.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="rounded-full">
                    {tag}
                    <button onClick={() => handleRemoveTag(tag)} className="ml-1 hover:text-destructive">×</button>
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                <span className="text-xs text-muted-foreground mr-1">Suggestions:</span>
                {POPULAR_TAGS.slice(0, 6).map(tag => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="cursor-pointer rounded-full text-xs"
                    onClick={() => !newPost.tags.includes(tag) && setNewPost(prev => ({ ...prev, tags: [...prev.tags, tag] }))}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewPostOpen(false)} className="rounded-full">
              {t("common.cancel") || "Cancel"}
            </Button>
            <Button onClick={handleCreatePost} className="rounded-full">
              {t("dashboard.amclub.publish") || "Publish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AMClub;
