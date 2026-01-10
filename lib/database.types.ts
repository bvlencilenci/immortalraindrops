export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tracks: {
        Row: {
          id: string
          created_at: string
          title: string
          artist: string
          genre: string | null
          media_type: 'song' | 'dj set' | 'video' | 'image'
          audio_key: string
          image_key: string
          tile_index: number
          release_date: string
          duration: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          artist: string
          genre?: string | null
          media_type: 'song' | 'dj set' | 'video' | 'image'
          audio_key: string
          image_key: string
          tile_index: number
          release_date: string
          duration?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          artist?: string
          genre?: string | null
          media_type?: 'song' | 'dj set' | 'video' | 'image'
          audio_key?: string
          image_key?: string
          tile_index?: number
          release_date?: string
          duration?: string | null
        }
      }
    }
  }
}
