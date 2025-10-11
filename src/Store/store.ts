"use client";

import {create} from 'zustand';

export type Character = {
    id: number;
    name: string;
    status: "Alive" | "Dead" | "Unknown";
    species: string;
    type: string;
    gender: string;
    origin: {name: string; url: string};
    location: {name: string; url: string};
    image: string;
};

type RMState = {
    query: string;
    setQuery: (q: string) => void;

    favorites: Record<number, Character>;
    toggleFavorite: (c: Character) => void;
    isFavorite: (id: number) => boolean;
};

export const useRMStore = create<RMState>((set, get) => ({
    query: "",
    favorites: {},

    setQuery: (q) => set({query: q}),

    toggleFavorite: (c) =>
        set((state) => {
            const copy = {...state.favorites};
            if (copy[c.id]) delete copy[c.id];
            else copy[c.id] = c;
            return {favorites: copy};
        }),

    isFavorite: (id) => Boolean(get().favorites[id])
}));