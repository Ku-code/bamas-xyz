import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatErrorForToast } from "@/lib/error-messages";
import {
  loadWGFeedPosts,
  createWGFeedPost,
  deleteWGFeedPost,
  createWGComment,
  deleteWGComment,
  type WGFeedPostWithUser,
} from "@/lib/working-groups";
import { Send, Trash2, MessageSquare, Loader2 } from "lucide-react";
import { format } from "date-fns";
import type { WGPermissions } from "@/lib/wg-permissions";

interface CollaborationFeedProps {
  workingGroupId: string;
  permissions: WGPermissions;
}

const CollaborationFeed = ({ workingGroupId, permissions }: CollaborationFeedProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<WGFeedPostWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [postContent, setPostContent] = useState("");
  const [commentContents, setCommentContents] = useState<Record<string, string>>({});

  useEffect(() => {
    loadPosts();
  }, [workingGroupId]);

  const loadPosts = async () => {
    setIsLoading(true);
    try {
      const postsData = await loadWGFeedPosts(workingGroupId);
      setPosts(postsData);
    } catch (error: any) {
      console.error("Error loading feed posts:", error);
      const errorInfo = formatErrorForToast(
        error,
        t("dashboard.workinggroups.feed.error.title") || "Error Loading Feed",
        t("dashboard.workinggroups.feed.error.loadFailed") || "Failed to load feed posts"
      );
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!user || !postContent.trim()) return;

    try {
      await createWGFeedPost({
        working_group_id: workingGroupId,
        user_id: user.id,
        content: postContent.trim(),
        attachments: [],
        tags: [],
      });
      toast({
        title: t("dashboard.workinggroups.feed.create.success.title") || "Post Created",
        description: t("dashboard.workinggroups.feed.create.success.description") || "Your post has been published.",
      });
      setPostContent("");
      await loadPosts();
    } catch (error: any) {
      console.error("Error creating post:", error);
      const errorInfo = formatErrorForToast(
        error,
        t("dashboard.workinggroups.feed.create.error.title") || "Failed to Create Post",
        t("dashboard.workinggroups.feed.create.error.description") || "Failed to create post"
      );
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm(t("dashboard.workinggroups.feed.delete.confirm") || "Are you sure you want to delete this post?")) {
      return;
    }

    try {
      await deleteWGFeedPost(postId);
      toast({
        title: t("dashboard.workinggroups.feed.delete.success.title") || "Post Deleted",
        description: t("dashboard.workinggroups.feed.delete.success.description") || "Post has been deleted successfully.",
      });
      await loadPosts();
    } catch (error: any) {
      console.error("Error deleting post:", error);
      const errorInfo = formatErrorForToast(
        error,
        t("dashboard.workinggroups.feed.delete.error.title") || "Failed to Delete Post",
        t("dashboard.workinggroups.feed.delete.error.description") || "Failed to delete post"
      );
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    }
  };

  const handleCreateComment = async (postId: string) => {
    if (!user || !commentContents[postId]?.trim()) return;

    try {
      await createWGComment({
        post_id: postId,
        user_id: user.id,
        content: commentContents[postId].trim(),
      });
      setCommentContents({ ...commentContents, [postId]: "" });
      await loadPosts();
    } catch (error: any) {
      console.error("Error creating comment:", error);
      const errorInfo = formatErrorForToast(
        error,
        t("dashboard.workinggroups.feed.comment.error.title") || "Failed to Create Comment",
        t("dashboard.workinggroups.feed.comment.error.description") || "Failed to create comment"
      );
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteWGComment(commentId);
      await loadPosts();
    } catch (error: any) {
      console.error("Error deleting comment:", error);
      toast({
        title: t("dashboard.workinggroups.feed.comment.delete.error.title") || "Failed to Delete Comment",
        description: t("dashboard.workinggroups.feed.comment.delete.error.description") || "Failed to delete comment",
        variant: "destructive",
      });
    }
  };

  const canDeletePost = (post: WGFeedPostWithUser): boolean => {
    if (!user) return false;
    return post.user_id === user.id || permissions.canManageMembers;
  };

  const canDeleteComment = (comment: any): boolean => {
    if (!user) return false;
    return comment.user_id === user.id || permissions.canManageMembers;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Post Creation Form */}
      {permissions.canPost && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <Textarea
                placeholder={t("dashboard.workinggroups.feed.placeholder") || "Share an update, ask a question, or post a link..."}
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                rows={3}
              />
              <div className="flex justify-end">
                <Button onClick={handleCreatePost} disabled={!postContent.trim()}>
                  <Send className="h-4 w-4 mr-2" />
                  {t("dashboard.workinggroups.feed.post") || "Post"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feed Posts */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-muted-foreground">
                {t("dashboard.workinggroups.feed.empty") || "No posts yet. Be the first to share something!"}
              </div>
            </CardContent>
          </Card>
        ) : (
          posts.map((post) => (
            <Card key={post.id}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Post Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={post.user?.image || undefined} />
                        <AvatarFallback>
                          {post.user?.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{post.user?.name || "Unknown"}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(post.created_at), "PPp")}
                        </p>
                      </div>
                    </div>
                    {canDeletePost(post) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePost(post.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Post Content */}
                  <div className="whitespace-pre-wrap">{post.content}</div>

                  {/* Comments Section */}
                  <div className="space-y-3">
                    <Separator />
                    {post.comments && post.comments.length > 0 && (
                      <div className="space-y-3 pl-4 border-l-2">
                        {post.comments.map((comment: any) => (
                          <div key={comment.id} className="space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={comment.user?.image || undefined} />
                                  <AvatarFallback className="text-xs">
                                    {comment.user?.name?.charAt(0) || "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium">{comment.user?.name || "Unknown"}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {format(new Date(comment.created_at), "PPp")}
                                  </p>
                                </div>
                              </div>
                              {canDeleteComment(comment) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => handleDeleteComment(comment.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                            <p className="text-sm whitespace-pre-wrap ml-8">{comment.content}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Comment Input */}
                    {permissions.canPost && (
                      <div className="flex items-end gap-2">
                        <Textarea
                          placeholder={t("dashboard.workinggroups.feed.comment.placeholder") || "Write a comment..."}
                          value={commentContents[post.id] || ""}
                          onChange={(e) => setCommentContents({ ...commentContents, [post.id]: e.target.value })}
                          rows={2}
                          className="flex-1"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleCreateComment(post.id)}
                          disabled={!commentContents[post.id]?.trim()}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default CollaborationFeed;

