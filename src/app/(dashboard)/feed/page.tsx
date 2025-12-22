"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ApiClient } from "@/lib/api";
import PostCard from "@/components/feed/PostCard";

export default function FeedPage() {
    const { data: session } = useSession();
    // @ts-ignore
    const agencyName = session?.user?.agencyName || "";

    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newPostContent, setNewPostContent] = useState("");
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [whatsappNumber, setWhatsappNumber] = useState("");
    const [mediaPreview, setMediaPreview] = useState<string | null>(null);
    const [isPosting, setIsPosting] = useState(false);

    const fetchFeed = async () => {
        try {
            const data = await ApiClient.get<any[]>('/feed/');
            setPosts(data);
        } catch (e) {
            console.error("Failed to load feed", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeed();

        // Mark all notifications as read when viewing the feed
        const markNotificationsRead = async () => {
            try {
                await ApiClient.post('/notifications/read-all', {});
            } catch (error) {
                console.error("Failed to mark notifications as read", error);
            }
        };

        markNotificationsRead();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setMediaFile(file);
            setMediaPreview(URL.createObjectURL(file));
        }
    };

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPostContent.trim()) return;

        setIsPosting(true);
        try {
            let mediaUrls: string[] = [];

            // Upload Media if exists
            if (mediaFile) {
                const formData = new FormData();
                formData.append('file', mediaFile);
                // We need a raw fetch or ApiClient support for FormData. 
                // Assuming ApiClient might stringify body. Using fetch for multipart.
                // Or better, creating a helper. For now direct fetch.
                // Upload using ApiClient which handles FormData and Base URL
                const data = await ApiClient.post<{ url: string }>('/media/upload', formData);
                mediaUrls.push(data.url);
            }

            await ApiClient.post('/feed/', {
                content: newPostContent,
                mediaUrls: mediaUrls,
                whatsappCtaNumber: whatsappNumber
            });

            setNewPostContent("");
            setMediaFile(null);
            setMediaPreview(null);
            setWhatsappNumber("");
            fetchFeed(); // Refresh feed
        } catch (e) {
            console.error("Failed to create post", e);
            alert("Failed to create post");
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Agency Feed</h1>

            {/* Create Post Widget */}
            <div className="bg-white rounded-lg shadow p-4 mb-8">
                <div className="flex space-x-3">
                    <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                            {agencyName[0] || 'U'}
                        </div>
                    </div>
                    <div className="min-w-0 flex-1">
                        <form onSubmit={handleCreatePost}>
                            <div>
                                <label htmlFor="comment" className="sr-only">
                                    About
                                </label>
                                <textarea
                                    id="comment"
                                    name="comment"
                                    rows={3}
                                    className="shadow-sm block w-full focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border border-gray-300 rounded-md p-2"
                                    placeholder={`What's new at ${agencyName}?`}
                                    value={newPostContent}
                                    onChange={(e) => setNewPostContent(e.target.value)}
                                />
                            </div>

                            {/* Media Preview */}
                            {mediaPreview && (
                                <div className="mt-2 relative">
                                    <img src={mediaPreview} alt="Preview" className="h-32 w-auto rounded-md object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => { setMediaFile(null); setMediaPreview(null); }}
                                        className="absolute top-0 left-0 bg-red-600 text-white rounded-full p-1 -ml-2 -mt-2 shadow-sm hover:bg-red-700"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                    </button>
                                </div>
                            )}

                            <div className="mt-3">
                                <input
                                    type="text"
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2"
                                    placeholder="WhatsApp Number (Optional - defaults to agency profile)"
                                    value={whatsappNumber}
                                    onChange={(e) => setWhatsappNumber(e.target.value)}
                                />
                            </div>

                            <div className="mt-3 flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <label className="cursor-pointer group inline-flex items-center text-sm space-x-2 text-gray-500 hover:text-gray-900">
                                        <span>📷 Add Photo</span>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*,video/*"
                                            onChange={handleFileChange}
                                        />
                                    </label>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isPosting || !newPostContent.trim()}
                                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                >
                                    {isPosting ? 'Posting...' : 'Post'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Feed List */}
            {loading ? (
                <div className="text-center py-10">Loading feed...</div>
            ) : posts.length === 0 ? (
                <div className="text-center py-10 text-gray-500">No posts yet. Be the first to share!</div>
            ) : (
                <div className="space-y-6">
                    {posts.map((post) => (
                        <PostCard key={post.id} post={post} onInteract={fetchFeed} />
                    ))}
                </div>
            )}
        </div>
    );
}
