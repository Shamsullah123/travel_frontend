"use client";

import { useEffect, useState } from "react";
import { ApiClient } from "@/lib/api";

interface Post {
    id: string;
    agencyName: string;
    content: string;
    mediaUrls: string[];
    postType: string;
    status: string;
    isFeatured: boolean;
    likesCount: number;
    createdAt: string;
}

export default function ModerationPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPosts = async () => {
        try {
            const data = await ApiClient.get<Post[]>('/admin/posts');
            setPosts(data);
        } catch (e) {
            console.error("Failed to load posts", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleReject = async (id: string) => {
        if (!confirm("Are you sure you want to reject this post?")) return;
        try {
            await ApiClient.patch(`/admin/posts/${id}`, { status: "rejected" });
            fetchPosts(); // Refresh
        } catch (e) {
            console.error("Failed to reject post", e);
            alert("Failed to reject post");
        }
    };

    const handleToggleFeature = async (post: Post) => {
        try {
            await ApiClient.patch(`/admin/posts/${post.id}`, { isFeatured: !post.isFeatured });
            fetchPosts(); // Refresh
        } catch (e) {
            console.error("Failed to toggle feature", e);
            alert("Failed to toggle feature");
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Content Moderation</h1>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul role="list" className="divide-y divide-gray-200">
                    {posts.map((post) => (
                        <li key={post.id} className="block hover:bg-gray-50">
                            <div className="px-4 py-4 sm:px-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <p className="text-sm font-medium text-indigo-600 truncate">{post.agencyName}</p>
                                        <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${post.status === 'active' ? 'bg-green-100 text-green-800' :
                                            post.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {post.status}
                                        </span>
                                        {post.isFeatured && (
                                            <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                Featured
                                            </span>
                                        )}
                                    </div>
                                    <div className="ml-2 flex-shrink-0 flex">
                                        <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                            {post.postType}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-2 sm:flex sm:justify-between">
                                    <div className="sm:flex">
                                        <p className="flex items-center text-sm text-gray-500">
                                            {post.content.length > 100 ? `${post.content.substring(0, 100)}...` : post.content}
                                        </p>
                                    </div>
                                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                        <p>
                                            Likes: {post.likesCount}
                                        </p>
                                        <p className="ml-4">
                                            {new Date(post.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-4 flex space-x-3 justify-end">
                                    <button
                                        onClick={() => handleToggleFeature(post)}
                                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                                    >
                                        {post.isFeatured ? "Unfeature" : "Feature"}
                                    </button>
                                    {post.status !== 'rejected' && (
                                        <button
                                            onClick={() => handleReject(post.id)}
                                            className="text-red-600 hover:text-red-900 text-sm font-medium"
                                        >
                                            Reject
                                        </button>
                                    )}
                                </div>
                            </div>
                        </li>
                    ))}
                    {posts.length === 0 && !loading && (
                        <div className="px-4 py-8 text-center text-gray-500">
                            No posts found.
                        </div>
                    )}
                </ul>
            </div>
        </div>
    );
}
