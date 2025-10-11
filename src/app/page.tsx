"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useRMStore, type Character } from "@/Store/store";

type PagedCharacters = {
    info: { pages: number; next: string | null; prev: string | null };
    results: Character[];
};

async function fetchCharacters(page: number, query: string): Promise<PagedCharacters> {
    const qs = new URLSearchParams({ page: String(page), ...(query ? { name: query } : {}) });
    const res = await fetch(`https://rickandmortyapi.com/api/character?${qs.toString()}`);
    if (!res.ok) return { info: { pages: 0, next: null, prev: null }, results: [] };
    return res.json();
}

async function fetchCharacter(id: string): Promise<Character> {
    const res = await fetch(`https://rickandmortyapi.com/api/character/${id}`);
    if (!res.ok) throw new Error("Personaje no encontrado");
    return res.json();
}

export default function Page() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const query = useRMStore((s) => s.query);
    const setQuery = useRMStore((s) => s.setQuery);
    const toggleFavorite = useRMStore((s) => s.toggleFavorite);
    const isFavorite = useRMStore((s) => s.isFavorite);

    const idParam = searchParams.get("id");
    const pageParam = Number(searchParams.get("p") ?? "1");
    const qParam = searchParams.get("q") ?? "";

    useEffect(() => {
        setQuery(qParam);
    }, [qParam, setQuery]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [list, setList] = useState<PagedCharacters | null>(null);
    const [detail, setDetail] = useState<Character | null>(null);

    useEffect(() => {
        let isAlive = true;
        setLoading(true);
        setError(null);

        (async () => {
            try {
                if (idParam) {
                    const characterDetail = await fetchCharacter(idParam);
                    if (!isAlive) return;
                    setDetail(characterDetail);
                    setList(null);
                } else {
                    const listData = await fetchCharacters(
                        Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1,
                        qParam
                    );
                    if (!isAlive) return;
                    setList(listData);
                    setDetail(null);
                }
            } catch (e: any) {
                if (!isAlive) return;
                setError(e?.message ?? "Error desconocido");
            } finally {
                if (!isAlive)
                    return;
                setLoading(false);
            }
        })();

        return () => {
            isAlive = false;
        };
    }, [idParam, pageParam, qParam]);

    const makeUrl = useMemo(() => {
        return (next: Partial<{ id: string | null; p: number; q: string }>) => {
            const u = new URLSearchParams();
            const qNext = typeof next.q === "string" ? next.q : qParam;
            const pageNext = typeof next.p === "number" ? next.p : pageParam;
            const idNext = next.id === null ? null : (next.id ?? idParam);

            if (idNext) u.set("id", String(idNext));
            if (qNext) u.set("q", qNext);
            if (pageNext && pageNext > 1) u.set("p", String(pageNext));

            const qs = u.toString();
            return qs ? `/?${qs}` : `/`;
        };
    }, [idParam, pageParam, qParam]);

    return (
        <div className="max-w-6xl mx-auto p-4">
            <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">Rick & Morty — Cards</h1>

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    router.push(makeUrl({ id: null, p: 1, q: query.trim() }));
                }}
                className="flex gap-2 mb-6"
            >
                <input
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar personaje..."
                />
                <button className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                    Buscar
                </button>
            </form>

            {loading && <p className="text-center text-gray-600">Cargando...</p>}
            {error && <p className="text-center text-red-500 bg-red-50 p-3 rounded-lg">{error}</p>}

            {!loading && idParam && detail && (
                <article className="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="md:flex">
                        <div className="md:flex-shrink-0">
                            <img
                                className="h-48 w-full object-cover md:w-48"
                                src={detail.image}
                                alt={detail.name}
                            />
                        </div>
                        <div className="p-8">
                            <button
                                className="mb-4 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                                onClick={() => router.push(makeUrl({ id: null }))}
                            >
                                ← Volver
                            </button>
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">{detail.name}</h3>
                            <p className="text-lg text-gray-600 mb-2">{detail.status} • {detail.species}</p>
                            <p className="text-gray-700 mb-1"><span className="font-semibold">Origen:</span> {detail.origin.name}</p>
                            <p className="text-gray-700 mb-4"><span className="font-semibold">Ubicación:</span> {detail.location.name}</p>
                            <button
                                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                                onClick={() => toggleFavorite(detail)}
                            >
                                {isFavorite(detail.id) ? "★ Quitar favorito" : "☆ Añadir favorito"}
                            </button>
                        </div>
                    </div>
                </article>
            )}

            {!loading && !idParam && list && (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {list.results.map((c) => (
                            <article
                                key={c.id}
                                className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transform transition-transform hover:scale-105 hover:shadow-lg"
                                onClick={() => router.push(makeUrl({ id: String(c.id) }))}
                            >
                                <img
                                    className="w-full h-48 object-cover"
                                    src={c.image}
                                    alt={c.name}
                                />
                                <div className="p-4">
                                    <div className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full mb-2">
                                        {c.status} • {c.species}
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-800">{c.name}</h3>
                                </div>
                            </article>
                        ))}
                    </div>

                    <div className="flex justify-between items-center mt-8">
                        <button
                            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                            disabled={pageParam <= 1}
                            onClick={() => router.push(makeUrl({ p: pageParam - 1 }))}
                        >
                            ← Anterior
                        </button>
                        <span className="text-gray-600 font-medium">
              Página {pageParam} de {list.info.pages}
            </span>
                        <button
                            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            disabled={!list.info.next}
                            onClick={() => router.push(makeUrl({ p: pageParam + 1 }))}
                        >
                            Siguiente →
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}