"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, ChangeEvent, FormEvent } from "react";
import styles from "./style.module.css";

type PostMedia = {
    id: string;
    postId: string;
    filePath: string;
    fileType: string;
    fileOrder: number;
    createdAt: string;
};

type Post = {
    id: string;
    userId: string;
    title: string | null;
    generalCaption: string | null;
    status: string;
    createdAt: string;
    updatedAt: string;
    media?: PostMedia[];
};

export default function DashboardPage() {

    const router = useRouter();

    const [posts, setPosts] = useState<Post[]>([]);
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);

    const [title, setTitle] = useState("");
    const [generalCaption, setGeneralCaption] = useState("");

    const [file, setFile] = useState<File | null>(null);

    const [loadingPosts, setLoadingPosts] = useState(false);
    const [creatingPost, setCreatingPost] = useState(false);
    const [uploadingMedia, setUploadingMedia] = useState(false);

    const [message, setMessage] = useState("");

    const [checkingAuth, setCheckingAuth] = useState(true);

    async function fetchPosts() {
        try {
            setLoadingPosts(true);
            setMessage("");

            const response = await fetch("/api/posts", {
                method: "GET",
                credentials: "include",
            });

            const data = await response.json();

            if (!response.ok) {
                setMessage(data.error || "Erro ao buscar posts.");
                return;
            }

            setPosts(data);
        } catch {
            setMessage("Erro ao buscar posts.");
        } finally {
            setLoadingPosts(false);
        }
    }

    async function fetchPostById(postId: string) {
        try {
            setMessage("");

            const response = await fetch(`/api/posts/${postId}`, {
                method: "GET",
                credentials: "include",
            });

            const data = await response.json();

            if (!response.ok) {
                setMessage(data.error || "Erro ao buscar post.");
                return;
            }

            setSelectedPost(data);
        } catch {
            setMessage("Erro ao buscar post.");
        }
    }

    async function handleCreatePost(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();

        try {
            setCreatingPost(true);
            setMessage("");

            const response = await fetch("/api/posts", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title,
                    generalCaption,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setMessage(data.error || "Erro ao criar post.");
                return;
            }

            setTitle("");
            setGeneralCaption("");
            setSelectedPost(data);
            await fetchPosts();
            await fetchPostById(data.id);
            setMessage("Post criado com sucesso.");
        } catch {
            setMessage("Erro ao criar post.");
        } finally {
            setCreatingPost(false);
        }
    }

    async function handleUploadMedia(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (!selectedPost) {
            setMessage("Selecione um post antes de enviar mídia.");
            return;
        }

        if (!file) {
            setMessage("Selecione um arquivo.");
            return;
        }

        try {
            setUploadingMedia(true);
            setMessage("");

            const formData = new FormData();
            formData.append("file", file);
            formData.append("fileOrder", "0");

            const response = await fetch(`/api/posts/${selectedPost.id}/media`, {
                method: "POST",
                credentials: "include",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                setMessage(data.error || "Erro ao enviar mídia.");
                return;
            }

            setFile(null);
            await fetchPostById(selectedPost.id);
            await fetchPosts();
            setMessage("Mídia enviada com sucesso.");
        } catch {
            setMessage("Erro ao enviar mídia.");
        } finally {
            setUploadingMedia(false);
        }
    }

    async function handleLogout() {
        await fetch("/api/auth/logout", {
            method: "POST",
            credentials: "include",
        });

        router.replace("/login");
    }

    function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
        const selectedFile = e.target.files?.[0] || null;
        setFile(selectedFile);
    }

    useEffect(() => {
        async function init() {
            const res = await fetch("/api/auth/me", {
                credentials: "include",
            });

            if (!res.ok) {
                router.replace("/login");
                return;
            }

            await fetchPosts();
            setCheckingAuth(false);
        }

        init();
    }, [router]);

    if (checkingAuth) {
        return <p>Carregando...</p>;
    }

    return (
        <main className={styles.main}>
            <h1 className={styles.title}>Dashboard</h1>

            <button onClick={handleLogout} className={styles.button}>
                Sair
            </button>

            {message && <p className={styles.message}>{message}</p>}

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Criar post</h2>

                <form onSubmit={handleCreatePost} className={styles.form}>
                    <input
                        type="text"
                        placeholder="Título do post"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className={styles.input}
                    />

                    <textarea
                        placeholder="Legenda geral"
                        value={generalCaption}
                        onChange={(e) => setGeneralCaption(e.target.value)}
                        rows={5}
                        className={styles.textarea}
                    />

                    <button
                        type="submit"
                        disabled={creatingPost}
                        className={styles.button}
                    >
                        {creatingPost ? "Criando..." : "Criar post"}
                    </button>
                </form>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Posts</h2>

                {loadingPosts ? (
                    <p className={styles.emptyText}>Carregando posts...</p>
                ) : posts.length === 0 ? (
                    <p className={styles.emptyText}>Nenhum post encontrado.</p>
                ) : (
                    <div className={styles.postsList}>
                        {posts.map((post) => (
                            <button
                                key={post.id}
                                onClick={() => fetchPostById(post.id)}
                                className={styles.postItem}
                            >
                                <strong className={styles.postTitle}>
                                    {post.title || "Sem título"}
                                </strong>
                                <p className={styles.postCaption}>
                                    {post.generalCaption || "Sem legenda"}
                                </p>
                            </button>
                        ))}
                    </div>
                )}
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Post selecionado</h2>

                {!selectedPost ? (
                    <p className={styles.emptyText}>Selecione um post.</p>
                ) : (
                    <div className={styles.selectedPost}>
                        <h3 className={styles.selectedPostTitle}>
                            {selectedPost.title || "Sem título"}
                        </h3>
                        <p className={styles.selectedPostCaption}>
                            {selectedPost.generalCaption || "Sem legenda"}
                        </p>

                        <div className={styles.uploadSection}>
                            <h4 className={styles.subTitle}>Enviar mídia</h4>

                            <form onSubmit={handleUploadMedia} className={styles.formSmall}>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className={styles.input}
                                />

                                <button
                                    type="submit"
                                    disabled={uploadingMedia}
                                    className={styles.button}
                                >
                                    {uploadingMedia ? "Enviando..." : "Enviar mídia"}
                                </button>
                            </form>
                        </div>

                        <div>
                            <h4 className={styles.subTitle}>Mídias</h4>

                            {!selectedPost.media || selectedPost.media.length === 0 ? (
                                <p className={styles.emptyText}>Nenhuma mídia enviada.</p>
                            ) : (
                                <div className={styles.mediaContainer}>
                                    {selectedPost.media.map((item) => (
                                        <div key={item.id} className={styles.mediaCard}>
                                            <img
                                                src={item.filePath}
                                                alt="Mídia do post"
                                                className={styles.mediaImage}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </section>
        </main>
    );
}