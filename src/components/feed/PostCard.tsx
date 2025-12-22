"use client";

import { useState } from "react";
import { ApiClient } from "@/lib/api";

interface PostProps {
    post: any;
    onInteract: () => void;
}

interface CommentItemProps {
    comment: any;
    postId: string;
    commentIndex: number;
    onInteract: () => void;
    depth?: number;
}

function CommentItem({ comment, postId, commentIndex, onInteract, depth = 0 }: CommentItemProps) {
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [replyText, setReplyText] = useState("");
    const [loading, setLoading] = useState(false);

    const handleReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim()) return;

        setLoading(true);
        try {
            await ApiClient.post(`/feed/${postId}/comment`, {
                text: replyText,
                commentIndex: commentIndex
            });
            setReplyText("");
            setShowReplyForm(false);
            onInteract();
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const maxDepth = 3;
    const indentClass = depth > 0 ? 'ml-6 pl-4 border-l-2 border-indigo-200' : '';

    return (
        <div className={`${indentClass} mb-3`}>
            <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="flex items-start space-x-2">
                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm flex-shrink-0">
                        {comment.user?.[0] || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-baseline space-x-2">
                            <p className="text-sm font-semibold text-gray-900">{comment.user || 'Unknown'}</p>
                            <p className="text-xs text-gray-500">
                                {new Date(comment.createdAt).toLocaleString()}
                            </p>
                        </div>
                        <p className="text-sm text-gray-700 mt-1">{comment.text}</p>

                        {/* Reply Button */}
                        {depth < maxDepth && (
                            <button
                                onClick={() => setShowReplyForm(!showReplyForm)}
                                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium mt-2 flex items-center"
                            >
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                </svg>
                                {showReplyForm ? 'Cancel' : 'Reply'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Reply Form */}
                {showReplyForm && (
                    <form onSubmit={handleReply} className="mt-3 ml-10 flex gap-2">
                        <input
                            type="text"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Write a reply..."
                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm px-3 py-1.5"
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={loading || !replyText.trim()}
                            className="bg-indigo-600 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? 'Posting...' : 'Reply'}
                        </button>
                    </form>
                )}
            </div>

            {/* Nested Replies */}
            {comment.replies && comment.replies.length > 0 && (
                <div className="mt-2">
                    {comment.replies.map((reply: any, index: number) => (
                        <CommentItem
                            key={index}
                            comment={reply}
                            postId={postId}
                            commentIndex={commentIndex}
                            onInteract={onInteract}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function PostCard({ post, onInteract }: PostProps) {
    const [commentText, setCommentText] = useState("");
    const [showComments, setShowComments] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLike = async () => {
        try {
            await ApiClient.post(`/feed/${post.id}/like`, {});
            onInteract();
        } catch (e) {
            console.error(e);
        }
    };

    const handleComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        setLoading(true);
        try {
            await ApiClient.post(`/feed/${post.id}/comment`, { text: commentText });
            setCommentText("");
            onInteract();
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const getCategoryBadge = (type: string) => {
        const styles: Record<string, string> = {
            visa: 'bg-blue-100 text-blue-800',
            umrah: 'bg-green-100 text-green-800',
            trick: 'bg-purple-100 text-purple-800',
            announcement: 'bg-gray-100 text-gray-800'
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase tracking-wide ${styles[type] || styles.announcement}`}>
                {type}
            </span>
        );
    };

    return (
        <div className="bg-white rounded-lg shadow-sm mb-6 border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="p-4 flex items-start justify-between border-b border-gray-50">
                <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg ring-2 ring-white shadow-sm">
                        {post.agencyLogo ? (
                            <img src={ApiClient.getFileUrl(post.agencyLogo) || ''} alt="Logo" className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                            post.agencyName?.[0] || 'A'
                        )}
                    </div>
                    <div className="ml-3">
                        <p className="text-sm font-bold text-gray-900 leading-none">{post.agencyName}</p>
                        <p className="text-xs text-gray-500 mt-1">{new Date(post.createdAt).toLocaleString()}</p>
                    </div>
                </div>
                <div className="flex flex-col items-end space-y-1">
                    {getCategoryBadge(post.postType || 'announcement')}
                    {post.isFeatured && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium">
                            Featured
                        </span>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                <p className="text-gray-800 whitespace-pre-wrap text-[15px] leading-relaxed mb-4">{post.content}</p>

                {post.mediaUrls && post.mediaUrls.length > 0 && (
                    <div className="grid gap-2 grid-cols-1 rounded-lg overflow-hidden border border-gray-100">
                        {post.mediaUrls.map((url: string, index: number) => (
                            <img key={index} src={ApiClient.getFileUrl(url) || ''} alt="Post content" className="w-full h-auto max-h-[500px] object-cover" />
                        ))}
                    </div>
                )}

                {/* WhatsApp CTA */}
                {post.whatsappCtaNumber && (
                    <div className="mt-4">
                        <a
                            href={`https://wa.me/${post.whatsappCtaNumber}?text=${encodeURIComponent(`Hi, I'm interested in your post: "${post.content.substring(0, 50)}${post.content.length > 50 ? '...' : ''}"`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 border-green-200 transition-colors"
                        >
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                            </svg>
                            Chat on WhatsApp
                        </a>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="px-4 py-3 bg-gray-50 flex items-center justify-between border-t border-gray-100">
                <div className="flex space-x-4">
                    <button
                        onClick={handleLike}
                        className="flex items-center text-gray-500 hover:text-red-500 transition-colors"
                    >
                        <span className="mr-1">❤️</span> {post.likesCount}
                    </button>
                    <button
                        onClick={() => setShowComments(!showComments)}
                        className="flex items-center text-gray-500 hover:text-indigo-500 transition-colors"
                    >
                        <span className="mr-1">💬</span> {post.commentsCount}
                    </button>
                </div>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div className="border-t border-gray-100 bg-gray-50">
                    {/* Existing Comments with Nested Replies */}
                    {post.comments && post.comments.length > 0 && (
                        <div className="px-4 py-3 max-h-96 overflow-y-auto">
                            {post.comments.map((comment: any, index: number) => (
                                <CommentItem
                                    key={index}
                                    comment={comment}
                                    postId={post.id}
                                    commentIndex={index}
                                    onInteract={onInteract}
                                    depth={0}
                                />
                            ))}
                        </div>
                    )}

                    {/* Top-Level Comment Input Form */}
                    <div className="px-4 py-3 border-t border-gray-200">
                        <form onSubmit={handleComment} className="flex gap-2">
                            <input
                                type="text"
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder="Write a comment..."
                                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
                            />
                            <button
                                type="submit"
                                disabled={loading || !commentText.trim()}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? 'Posting...' : 'Post'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
