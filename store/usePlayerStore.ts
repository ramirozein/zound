import { create } from "zustand";

export interface Song {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  audioUrl?: string;
}

export type RepeatMode = "off" | "all" | "one";

interface PlayerState {
  currentSong: Song | null;
  queue: Song[];
  queueIndex: number;
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  shuffle: boolean;
  repeat: RepeatMode;
  playSong: (song: Song) => void;
  playQueue: (songs: Song[], startIndex?: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  togglePlay: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setPlaying: (playing: boolean) => void;
  setVolume: (val: number) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
}

function pickShuffleIndex(length: number, exclude: number): number {
  if (length <= 1) return 0;
  let idx = Math.floor(Math.random() * (length - 1));
  if (idx >= exclude) idx += 1;
  return idx;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentSong: null,
  queue: [],
  queueIndex: -1,
  isPlaying: false,
  volume: 50,
  currentTime: 0,
  duration: 0,
  shuffle: false,
  repeat: "off",

  playSong: (song) => set({
    currentSong: song,
    isPlaying: !!song.audioUrl,
    queue: [song],
    queueIndex: 0,
    currentTime: 0,
    duration: 0,
  }),

  playQueue: (songs, startIndex = 0) => {
    if (songs.length === 0) return;
    const index = Math.max(0, Math.min(startIndex, songs.length - 1));
    set({
      queue: songs,
      queueIndex: index,
      currentSong: songs[index],
      isPlaying: !!songs[index].audioUrl,
      currentTime: 0,
      duration: 0,
    });
  },

  playNext: () => {
    const { queue, queueIndex, shuffle, repeat } = get();
    if (queue.length === 0 || queueIndex === -1) return;

    let nextIndex: number;
    if (shuffle && queue.length > 1) {
      nextIndex = pickShuffleIndex(queue.length, queueIndex);
    } else if (queueIndex < queue.length - 1) {
      nextIndex = queueIndex + 1;
    } else if (repeat === "all") {
      nextIndex = 0;
    } else {
      set({ isPlaying: false, currentTime: 0 });
      return;
    }

    set({
      queueIndex: nextIndex,
      currentSong: queue[nextIndex],
      isPlaying: !!queue[nextIndex].audioUrl,
      currentTime: 0,
      duration: 0,
    });
  },

  playPrevious: () => {
    const { queue, queueIndex, shuffle, repeat } = get();
    if (queue.length === 0 || queueIndex === -1) return;

    let prevIndex: number;
    if (shuffle && queue.length > 1) {
      prevIndex = pickShuffleIndex(queue.length, queueIndex);
    } else if (queueIndex > 0) {
      prevIndex = queueIndex - 1;
    } else if (repeat === "all") {
      prevIndex = queue.length - 1;
    } else {
      set({ currentTime: 0 });
      return;
    }

    set({
      queueIndex: prevIndex,
      currentSong: queue[prevIndex],
      isPlaying: !!queue[prevIndex].audioUrl,
      currentTime: 0,
      duration: 0,
    });
  },

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying && !!state.currentSong })),
  toggleShuffle: () => set((state) => ({ shuffle: !state.shuffle })),
  toggleRepeat: () => set((state) => ({
    repeat: state.repeat === "off" ? "all" : state.repeat === "all" ? "one" : "off",
  })),
  setPlaying: (playing) => set({ isPlaying: playing }),
  setVolume: (volume) => set({ volume }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
}));
