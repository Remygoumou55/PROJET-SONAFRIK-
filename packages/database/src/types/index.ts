export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admin_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json
          type?: string
        }
        Relationships: []
      }
      album_genres: {
        Row: {
          album_id: string
          genre_id: string
        }
        Insert: {
          album_id: string
          genre_id: string
        }
        Update: {
          album_id?: string
          genre_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "album_genres_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "album_genres_genre_id_fkey"
            columns: ["genre_id"]
            isOneToOne: false
            referencedRelation: "genres"
            referencedColumns: ["id"]
          },
        ]
      }
      albums: {
        Row: {
          cover_path: string | null
          created_at: string
          created_by: string | null
          creator_id: string
          deleted_at: string | null
          description: string | null
          id: string
          label_id: string | null
          metadata: Json
          publication_status: string
          published_at: string | null
          rejection_reason: string | null
          release_date: string | null
          release_type: string
          slug: string
          submitted_at: string | null
          title: string
          upc: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          cover_path?: string | null
          created_at?: string
          created_by?: string | null
          creator_id: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          label_id?: string | null
          metadata?: Json
          publication_status?: string
          published_at?: string | null
          rejection_reason?: string | null
          release_date?: string | null
          release_type?: string
          slug: string
          submitted_at?: string | null
          title: string
          upc?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          cover_path?: string | null
          created_at?: string
          created_by?: string | null
          creator_id?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          label_id?: string | null
          metadata?: Json
          publication_status?: string
          published_at?: string | null
          rejection_reason?: string | null
          release_date?: string | null
          release_type?: string
          slug?: string
          submitted_at?: string | null
          title?: string
          upc?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "albums_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "albums_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "labels"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_profiles: {
        Row: {
          banner_path: string | null
          bio: string | null
          cover_images: string[]
          cover_path: string | null
          cover_updated_at: string | null
          created_at: string
          creator_id: string
          genres: string[]
          is_public: boolean
          profile_photo: string | null
          slug: string
          social_links: Json
          stage_name: string
          updated_at: string
          updated_by: string | null
          verified: boolean
          verified_at: string | null
        }
        Insert: {
          banner_path?: string | null
          bio?: string | null
          cover_images?: string[]
          cover_path?: string | null
          cover_updated_at?: string | null
          created_at?: string
          creator_id: string
          genres?: string[]
          is_public?: boolean
          profile_photo?: string | null
          slug: string
          social_links?: Json
          stage_name: string
          updated_at?: string
          updated_by?: string | null
          verified?: boolean
          verified_at?: string | null
        }
        Update: {
          banner_path?: string | null
          bio?: string | null
          cover_images?: string[]
          cover_path?: string | null
          cover_updated_at?: string | null
          created_at?: string
          creator_id?: string
          genres?: string[]
          is_public?: boolean
          profile_photo?: string | null
          slug?: string
          social_links?: Json
          stage_name?: string
          updated_at?: string
          updated_by?: string | null
          verified?: boolean
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artist_profiles_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: true
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: unknown
          metadata: Json
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json
          user_agent?: string | null
        }
        Relationships: []
      }
      beat_purchases: {
        Row: {
          amount_gnf: number
          beat_id: string
          buyer_id: string
          commission_gnf: number
          created_at: string
          creator_id: string
          id: string
          license_type: string
          net_gnf: number
        }
        Insert: {
          amount_gnf?: number
          beat_id: string
          buyer_id: string
          commission_gnf?: number
          created_at?: string
          creator_id: string
          id?: string
          license_type?: string
          net_gnf?: number
        }
        Update: {
          amount_gnf?: number
          beat_id?: string
          buyer_id?: string
          commission_gnf?: number
          created_at?: string
          creator_id?: string
          id?: string
          license_type?: string
          net_gnf?: number
        }
        Relationships: [
          {
            foreignKeyName: "beat_purchases_beat_id_fkey"
            columns: ["beat_id"]
            isOneToOne: false
            referencedRelation: "beats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beat_purchases_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beat_purchases_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      beats: {
        Row: {
          audio_full_path: string | null
          audio_preview_path: string | null
          bpm: number | null
          cover_path: string | null
          created_at: string
          creator_id: string
          deleted_at: string | null
          description: string | null
          genre: string | null
          id: string
          key: string | null
          license_type: string
          price_gnf: number
          publication_status: string
          slug: string
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          audio_full_path?: string | null
          audio_preview_path?: string | null
          bpm?: number | null
          cover_path?: string | null
          created_at?: string
          creator_id: string
          deleted_at?: string | null
          description?: string | null
          genre?: string | null
          id?: string
          key?: string | null
          license_type?: string
          price_gnf?: number
          publication_status?: string
          slug: string
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          audio_full_path?: string | null
          audio_preview_path?: string | null
          bpm?: number | null
          cover_path?: string | null
          created_at?: string
          creator_id?: string
          deleted_at?: string | null
          description?: string | null
          genre?: string | null
          id?: string
          key?: string | null
          license_type?: string
          price_gnf?: number
          publication_status?: string
          slug?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "beats_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          contract_type: Database["public"]["Enums"]["contract_type"]
          counterparty_name: string
          created_at: string
          creator_id: string
          deleted_at: string | null
          end_date: string | null
          id: string
          revenue_share_percent: number | null
          signed_at: string | null
          start_date: string | null
          terms: string | null
          updated_at: string
          work_id: string
        }
        Insert: {
          contract_type: Database["public"]["Enums"]["contract_type"]
          counterparty_name: string
          created_at?: string
          creator_id: string
          deleted_at?: string | null
          end_date?: string | null
          id?: string
          revenue_share_percent?: number | null
          signed_at?: string | null
          start_date?: string | null
          terms?: string | null
          updated_at?: string
          work_id: string
        }
        Update: {
          contract_type?: Database["public"]["Enums"]["contract_type"]
          counterparty_name?: string
          created_at?: string
          creator_id?: string
          deleted_at?: string | null
          end_date?: string | null
          id?: string
          revenue_share_percent?: number | null
          signed_at?: string | null
          start_date?: string | null
          terms?: string | null
          updated_at?: string
          work_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_work_id_fkey"
            columns: ["work_id"]
            isOneToOne: false
            referencedRelation: "works"
            referencedColumns: ["id"]
          },
        ]
      }
      contributors: {
        Row: {
          created_at: string
          display_name: string
          id: string
          ipi: string | null
          profile_id: string | null
          role: Database["public"]["Enums"]["contributor_role"]
          updated_at: string
          work_id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          ipi?: string | null
          profile_id?: string | null
          role: Database["public"]["Enums"]["contributor_role"]
          updated_at?: string
          work_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          ipi?: string | null
          profile_id?: string | null
          role?: Database["public"]["Enums"]["contributor_role"]
          updated_at?: string
          work_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contributors_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contributors_work_id_fkey"
            columns: ["work_id"]
            isOneToOne: false
            referencedRelation: "works"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_roles: {
        Row: {
          accepted_at: string
          created_at: string
          creator_id: string
          deleted_at: string | null
          id: string
          invited_by: string | null
          member_id: string
          role: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          accepted_at?: string
          created_at?: string
          creator_id: string
          deleted_at?: string | null
          id?: string
          invited_by?: string | null
          member_id: string
          role: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          accepted_at?: string
          created_at?: string
          creator_id?: string
          deleted_at?: string | null
          id?: string
          invited_by?: string | null
          member_id?: string
          role?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_roles_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_roles_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_roles_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_verifications: {
        Row: {
          created_at: string
          created_by: string | null
          creator_id: string
          document_path: string | null
          document_type: string | null
          id: string
          label_id: string | null
          metadata: Json
          notes: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string | null
          updated_at: string
          updated_by: string | null
          verification_type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          creator_id: string
          document_path?: string | null
          document_type?: string | null
          id?: string
          label_id?: string | null
          metadata?: Json
          notes?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          updated_by?: string | null
          verification_type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          creator_id?: string
          document_path?: string | null
          document_type?: string | null
          id?: string
          label_id?: string | null
          metadata?: Json
          notes?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          updated_by?: string | null
          verification_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_verifications_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_verifications_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "labels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_verifications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      creators: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          label_id: string | null
          owner_id: string
          status: string
          tier: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          label_id?: string | null
          owner_id: string
          status?: string
          tier?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          label_id?: string | null
          owner_id?: string
          status?: string
          tier?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creators_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "labels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creators_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          user_id?: string
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          created_at: string
          description: string | null
          enabled: boolean
          id: string
          metadata: Json
          name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          metadata?: Json
          name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          metadata?: Json
          name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feature_flags_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          follower_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          follower_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          follower_id?: string
        }
        Relationships: []
      }
      genres: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      label_members: {
        Row: {
          created_at: string
          deleted_at: string | null
          invited_by: string | null
          joined_at: string
          label_id: string
          member_id: string
          role: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          invited_by?: string | null
          joined_at?: string
          label_id: string
          member_id: string
          role: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          invited_by?: string | null
          joined_at?: string
          label_id?: string
          member_id?: string
          role?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "label_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "label_members_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "labels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "label_members_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      labels: {
        Row: {
          country_code: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          id: string
          logo_path: string | null
          name: string
          owner_id: string
          slug: string
          updated_at: string
          updated_by: string | null
          verified: boolean
          website_url: string | null
        }
        Insert: {
          country_code?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          logo_path?: string | null
          name: string
          owner_id: string
          slug: string
          updated_at?: string
          updated_by?: string | null
          verified?: boolean
          website_url?: string | null
        }
        Update: {
          country_code?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          logo_path?: string | null
          name?: string
          owner_id?: string
          slug?: string
          updated_at?: string
          updated_by?: string | null
          verified?: boolean
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "labels_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      likes: {
        Row: {
          created_at: string
          track_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          track_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          track_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      metadata_audit_log: {
        Row: {
          action: string
          actor_id: string
          audit_metadata_id: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          payload: Json
          row_version: number
          source: string
          status: string
          updated_at: string
          validation_state: string
          visibility: string
        }
        Insert: {
          action: string
          actor_id: string
          audit_metadata_id: string
          created_at?: string
          entity_id: string
          entity_type: string
          id: string
          payload?: Json
          row_version?: number
          source?: string
          status?: string
          updated_at?: string
          validation_state?: string
          visibility?: string
        }
        Update: {
          action?: string
          actor_id?: string
          audit_metadata_id?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          payload?: Json
          row_version?: number
          source?: string
          status?: string
          updated_at?: string
          validation_state?: string
          visibility?: string
        }
        Relationships: []
      }
      metadata_fingerprint_records: {
        Row: {
          archived_at: string | null
          created_at: string
          creator_id: string | null
          fingerprint_id: string
          hash: string | null
          payload: Json
          row_version: number
          status: string
          track_id: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          creator_id?: string | null
          fingerprint_id: string
          hash?: string | null
          payload: Json
          row_version?: number
          status?: string
          track_id: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          creator_id?: string | null
          fingerprint_id?: string
          hash?: string | null
          payload?: Json
          row_version?: number
          status?: string
          track_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "metadata_fingerprint_records_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      metadata_isrc_registry: {
        Row: {
          created_at: string
          isrc: string
          metadata_id: string | null
          reserved_at: string | null
          reserved_by: string | null
          row_version: number
          status: string
          track_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          isrc: string
          metadata_id?: string | null
          reserved_at?: string | null
          reserved_by?: string | null
          row_version?: number
          status?: string
          track_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          isrc?: string
          metadata_id?: string | null
          reserved_at?: string | null
          reserved_by?: string | null
          row_version?: number
          status?: string
          track_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "metadata_isrc_registry_metadata_id_fkey"
            columns: ["metadata_id"]
            isOneToOne: false
            referencedRelation: "metadata_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metadata_isrc_registry_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      metadata_isrc_sequence: {
        Row: {
          country_code: string
          last_designation: number
          registrant_code: string
          row_version: number
          updated_at: string
          year_of_reference: string
        }
        Insert: {
          country_code: string
          last_designation?: number
          registrant_code: string
          row_version?: number
          updated_at?: string
          year_of_reference: string
        }
        Update: {
          country_code?: string
          last_designation?: number
          registrant_code?: string
          row_version?: number
          updated_at?: string
          year_of_reference?: string
        }
        Relationships: []
      }
      metadata_platform_health: {
        Row: {
          checked_at: string
          id: number
        }
        Insert: {
          checked_at?: string
          id?: number
        }
        Update: {
          checked_at?: string
          id?: number
        }
        Relationships: []
      }
      metadata_records: {
        Row: {
          archived_at: string | null
          created_at: string
          creator_id: string | null
          entity_id: string
          entity_type: string
          id: string
          payload: Json
          row_version: number
          status: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          creator_id?: string | null
          entity_id: string
          entity_type: string
          id: string
          payload: Json
          row_version?: number
          status?: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          creator_id?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          payload?: Json
          row_version?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      metadata_registry_index: {
        Row: {
          created_at: string
          id: string
          identifier_type: string
          identifier_value: string
          metadata_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          identifier_type: string
          identifier_value: string
          metadata_id: string
        }
        Update: {
          created_at?: string
          id?: string
          identifier_type?: string
          identifier_value?: string
          metadata_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "metadata_registry_index_metadata_id_fkey"
            columns: ["metadata_id"]
            isOneToOne: false
            referencedRelation: "metadata_records"
            referencedColumns: ["id"]
          },
        ]
      }
      metadata_release_records: {
        Row: {
          archived_at: string | null
          created_at: string
          creator_id: string | null
          payload: Json
          release_id: string
          row_version: number
          status: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          creator_id?: string | null
          payload: Json
          release_id: string
          row_version?: number
          status?: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          creator_id?: string | null
          payload?: Json
          release_id?: string
          row_version?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      metadata_upc_registry: {
        Row: {
          album_id: string | null
          created_at: string
          reserved_at: string | null
          reserved_by: string | null
          row_version: number
          status: string
          upc: string
          updated_at: string
        }
        Insert: {
          album_id?: string | null
          created_at?: string
          reserved_at?: string | null
          reserved_by?: string | null
          row_version?: number
          status?: string
          upc: string
          updated_at?: string
        }
        Update: {
          album_id?: string | null
          created_at?: string
          reserved_at?: string | null
          reserved_by?: string | null
          row_version?: number
          status?: string
          upc?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "metadata_upc_registry_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
        ]
      }
      metadata_version_snapshots: {
        Row: {
          action: string
          created_at: string
          creator_id: string | null
          entity_id: string
          entity_type: string
          row_version: number
          snapshot: Json
          source: string
          status: string
          updated_at: string
          validation_state: string
          version_id: string
          visibility: string
        }
        Insert: {
          action: string
          created_at?: string
          creator_id?: string | null
          entity_id: string
          entity_type: string
          row_version?: number
          snapshot: Json
          source?: string
          status?: string
          updated_at?: string
          validation_state?: string
          version_id: string
          visibility?: string
        }
        Update: {
          action?: string
          created_at?: string
          creator_id?: string | null
          entity_id?: string
          entity_type?: string
          row_version?: number
          snapshot?: Json
          source?: string
          status?: string
          updated_at?: string
          validation_state?: string
          version_id?: string
          visibility?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          data: Json
          id: string
          read_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          data?: Json
          id?: string
          read_at?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          data?: Json
          id?: string
          read_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ownership_versions: {
        Row: {
          created_at: string
          created_by: string
          id: string
          snapshot: Json
          version_number: number
          work_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          snapshot?: Json
          version_number?: number
          work_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          snapshot?: Json
          version_number?: number
          work_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ownership_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ownership_versions_work_id_fkey"
            columns: ["work_id"]
            isOneToOne: false
            referencedRelation: "works"
            referencedColumns: ["id"]
          },
        ]
      }
      ownerships: {
        Row: {
          contributor_id: string
          created_at: string
          effective_date: string
          id: string
          ownership_type: Database["public"]["Enums"]["ownership_type"]
          share_percent: number
          territory: string
          updated_at: string
          work_id: string
        }
        Insert: {
          contributor_id: string
          created_at?: string
          effective_date?: string
          id?: string
          ownership_type?: Database["public"]["Enums"]["ownership_type"]
          share_percent: number
          territory?: string
          updated_at?: string
          work_id: string
        }
        Update: {
          contributor_id?: string
          created_at?: string
          effective_date?: string
          id?: string
          ownership_type?: Database["public"]["Enums"]["ownership_type"]
          share_percent?: number
          territory?: string
          updated_at?: string
          work_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ownerships_contributor_id_fkey"
            columns: ["contributor_id"]
            isOneToOne: false
            referencedRelation: "contributors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ownerships_work_id_fkey"
            columns: ["work_id"]
            isOneToOne: false
            referencedRelation: "works"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_intents: {
        Row: {
          amount_gnf: number
          confirmed_at: string | null
          created_at: string
          currency: string
          expires_at: string
          failed_at: string | null
          id: string
          initiated_at: string
          metadata: Json
          provider: string
          provider_phone: string
          provider_ref: string | null
          purpose: string
          status: string
          updated_at: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount_gnf: number
          confirmed_at?: string | null
          created_at?: string
          currency?: string
          expires_at?: string
          failed_at?: string | null
          id?: string
          initiated_at?: string
          metadata?: Json
          provider: string
          provider_phone: string
          provider_ref?: string | null
          purpose: string
          status?: string
          updated_at?: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount_gnf?: number
          confirmed_at?: string | null
          created_at?: string
          currency?: string
          expires_at?: string
          failed_at?: string | null
          id?: string
          initiated_at?: string
          metadata?: Json
          provider?: string
          provider_phone?: string
          provider_ref?: string | null
          purpose?: string
          status?: string
          updated_at?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_intents_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_accounts: {
        Row: {
          account_holder_name: string
          bank_name: string | null
          created_at: string
          deleted_at: string | null
          display_name: string
          iban: string | null
          id: string
          is_default: boolean
          metadata: Json
          phone_number: string | null
          type: string
          updated_at: string
          user_id: string
          verified: boolean
        }
        Insert: {
          account_holder_name: string
          bank_name?: string | null
          created_at?: string
          deleted_at?: string | null
          display_name: string
          iban?: string | null
          id?: string
          is_default?: boolean
          metadata?: Json
          phone_number?: string | null
          type: string
          updated_at?: string
          user_id: string
          verified?: boolean
        }
        Update: {
          account_holder_name?: string
          bank_name?: string | null
          created_at?: string
          deleted_at?: string | null
          display_name?: string
          iban?: string | null
          id?: string
          is_default?: boolean
          metadata?: Json
          phone_number?: string | null
          type?: string
          updated_at?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: []
      }
      payout_audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          metadata: Json
          new_status: string
          performed_by: string
          previous_status: string | null
          reason: string | null
          withdrawal_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          metadata?: Json
          new_status: string
          performed_by: string
          previous_status?: string | null
          reason?: string | null
          withdrawal_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          metadata?: Json
          new_status?: string
          performed_by?: string
          previous_status?: string | null
          reason?: string | null
          withdrawal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_audit_logs_withdrawal_id_fkey"
            columns: ["withdrawal_id"]
            isOneToOne: false
            referencedRelation: "withdrawals"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_batches: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          notes: string | null
          processed_at: string | null
          status: string
          total_amount_gnf: number
          updated_at: string
          withdrawal_count: number
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          notes?: string | null
          processed_at?: string | null
          status?: string
          total_amount_gnf?: number
          updated_at?: string
          withdrawal_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          notes?: string | null
          processed_at?: string | null
          status?: string
          total_amount_gnf?: number
          updated_at?: string
          withdrawal_count?: number
        }
        Relationships: []
      }
      permissions: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      playback_positions: {
        Row: {
          position_seconds: number
          track_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          position_seconds?: number
          track_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          position_seconds?: number
          track_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playback_positions_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      playlist_tracks: {
        Row: {
          added_at: string
          added_by: string | null
          playlist_id: string
          position: number
          track_id: string
        }
        Insert: {
          added_at?: string
          added_by?: string | null
          playlist_id: string
          position?: number
          track_id: string
        }
        Update: {
          added_at?: string
          added_by?: string | null
          playlist_id?: string
          position?: number
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_tracks_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_tracks_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          cover_path: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          is_public: boolean
          title: string
          total_duration_seconds: number
          track_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          cover_path?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean
          title: string
          total_duration_seconds?: number
          track_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          cover_path?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean
          title?: string
          total_duration_seconds?: number
          track_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: string | null
          avatar_path: string | null
          avatar_url: string | null
          backup_email: string | null
          bio: string | null
          city: string | null
          country_code: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          email: string | null
          fraud_score: number
          full_name: string | null
          id: string
          is_premium: boolean
          locale: string
          main_genre: string | null
          mtn_money_number: string | null
          onboarding_completed: boolean
          orange_money_number: string | null
          origin_region: string | null
          phone: string | null
          preferred_language: string | null
          premium_expires_at: string | null
          role: string | null
          song_language: string | null
          stage_name: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          account_type?: string | null
          avatar_path?: string | null
          avatar_url?: string | null
          backup_email?: string | null
          bio?: string | null
          city?: string | null
          country_code?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          email?: string | null
          fraud_score?: number
          full_name?: string | null
          id: string
          is_premium?: boolean
          locale?: string
          main_genre?: string | null
          mtn_money_number?: string | null
          onboarding_completed?: boolean
          orange_money_number?: string | null
          origin_region?: string | null
          phone?: string | null
          preferred_language?: string | null
          premium_expires_at?: string | null
          role?: string | null
          song_language?: string | null
          stage_name?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          account_type?: string | null
          avatar_path?: string | null
          avatar_url?: string | null
          backup_email?: string | null
          bio?: string | null
          city?: string | null
          country_code?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          email?: string | null
          fraud_score?: number
          full_name?: string | null
          id?: string
          is_premium?: boolean
          locale?: string
          main_genre?: string | null
          mtn_money_number?: string | null
          onboarding_completed?: boolean
          orange_money_number?: string | null
          origin_region?: string | null
          phone?: string | null
          preferred_language?: string | null
          premium_expires_at?: string | null
          role?: string | null
          song_language?: string | null
          stage_name?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action: string
          count: number
          created_at: string
          id: string
          identifier: string
          window_start: string
        }
        Insert: {
          action: string
          count?: number
          created_at?: string
          id?: string
          identifier: string
          window_start?: string
        }
        Update: {
          action?: string
          count?: number
          created_at?: string
          id?: string
          identifier?: string
          window_start?: string
        }
        Relationships: []
      }
      rights_claims: {
        Row: {
          claim_type: Database["public"]["Enums"]["rights_claim_type"]
          claimant_id: string
          created_at: string
          description: string
          evidence_url: string | null
          id: string
          resolution_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["rights_claim_status"]
          updated_at: string
          work_id: string
        }
        Insert: {
          claim_type: Database["public"]["Enums"]["rights_claim_type"]
          claimant_id: string
          created_at?: string
          description: string
          evidence_url?: string | null
          id?: string
          resolution_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["rights_claim_status"]
          updated_at?: string
          work_id: string
        }
        Update: {
          claim_type?: Database["public"]["Enums"]["rights_claim_type"]
          claimant_id?: string
          created_at?: string
          description?: string
          evidence_url?: string | null
          id?: string
          resolution_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["rights_claim_status"]
          updated_at?: string
          work_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rights_claims_claimant_id_fkey"
            columns: ["claimant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rights_claims_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rights_claims_work_id_fkey"
            columns: ["work_id"]
            isOneToOne: false
            referencedRelation: "works"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          created_by: string | null
          permission_id: string
          role_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          permission_id: string
          role_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      royalty_calculations: {
        Row: {
          artist_id: string
          created_at: string
          creator_id: string | null
          cycle_id: string
          gross_amount_gnf: number
          id: string
          listen_share_percent: number
          net_amount_gnf: number
          paid_at: string | null
          platform_commission_gnf: number
          status: string
          updated_at: string
          valid_listen_count: number
        }
        Insert: {
          artist_id: string
          created_at?: string
          creator_id?: string | null
          cycle_id: string
          gross_amount_gnf?: number
          id?: string
          listen_share_percent?: number
          net_amount_gnf?: number
          paid_at?: string | null
          platform_commission_gnf?: number
          status?: string
          updated_at?: string
          valid_listen_count?: number
        }
        Update: {
          artist_id?: string
          created_at?: string
          creator_id?: string | null
          cycle_id?: string
          gross_amount_gnf?: number
          id?: string
          listen_share_percent?: number
          net_amount_gnf?: number
          paid_at?: string | null
          platform_commission_gnf?: number
          status?: string
          updated_at?: string
          valid_listen_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "royalty_calculations_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "royalty_calculations_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "royalty_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      royalty_cycles: {
        Row: {
          artist_count: number
          created_at: string
          distributed_at: string | null
          id: string
          period_end: string
          period_start: string
          revenue_pool_gnf: number
          revenue_pool_percent: number
          status: string
          total_revenue_gnf: number
          total_valid_listens: number
          updated_at: string
        }
        Insert: {
          artist_count?: number
          created_at?: string
          distributed_at?: string | null
          id?: string
          period_end: string
          period_start: string
          revenue_pool_gnf?: number
          revenue_pool_percent?: number
          status?: string
          total_revenue_gnf?: number
          total_valid_listens?: number
          updated_at?: string
        }
        Update: {
          artist_count?: number
          created_at?: string
          distributed_at?: string | null
          id?: string
          period_end?: string
          period_start?: string
          revenue_pool_gnf?: number
          revenue_pool_percent?: number
          status?: string
          total_revenue_gnf?: number
          total_valid_listens?: number
          updated_at?: string
        }
        Relationships: []
      }
      stream_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json
          position_seconds: number
          session_id: string
          track_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          position_seconds?: number
          session_id: string
          track_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          position_seconds?: number
          session_id?: string
          track_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stream_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "stream_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_events_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          device_id: string | null
          fraud_flags: string[]
          id: string
          ip_address: unknown
          is_valid_listen: boolean
          last_heartbeat_at: string
          listen_percentage: number
          platform: string
          quality_kbps: number | null
          started_at: string
          total_duration_seconds: number
          total_listened_seconds: number
          track_file_id: string | null
          track_id: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          device_id?: string | null
          fraud_flags?: string[]
          id?: string
          ip_address?: unknown
          is_valid_listen?: boolean
          last_heartbeat_at?: string
          listen_percentage?: number
          platform?: string
          quality_kbps?: number | null
          started_at?: string
          total_duration_seconds?: number
          total_listened_seconds?: number
          track_file_id?: string | null
          track_id: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          device_id?: string | null
          fraud_flags?: string[]
          id?: string
          ip_address?: unknown
          is_valid_listen?: boolean
          last_heartbeat_at?: string
          listen_percentage?: number
          platform?: string
          quality_kbps?: number | null
          started_at?: string
          total_duration_seconds?: number
          total_listened_seconds?: number
          track_file_id?: string | null
          track_id?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stream_sessions_track_file_id_fkey"
            columns: ["track_file_id"]
            isOneToOne: false
            referencedRelation: "track_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_sessions_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      studios: {
        Row: {
          address: string | null
          city: string | null
          country_code: string
          created_at: string
          created_by: string | null
          creator_id: string
          deleted_at: string | null
          id: string
          is_primary: boolean
          name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country_code?: string
          created_at?: string
          created_by?: string | null
          creator_id: string
          deleted_at?: string | null
          id?: string
          is_primary?: boolean
          name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country_code?: string
          created_at?: string
          created_by?: string | null
          creator_id?: string
          deleted_at?: string | null
          id?: string
          is_primary?: boolean
          name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "studios_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          features: Json
          id: string
          is_active: boolean
          name: string
          price_gnf: number
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          features?: Json
          id?: string
          is_active?: boolean
          name: string
          price_gnf: number
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          features?: Json
          id?: string
          is_active?: boolean
          name?: string
          price_gnf?: number
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          category: Database["public"]["Enums"]["setting_category"]
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          category?: Database["public"]["Enums"]["setting_category"]
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          category?: Database["public"]["Enums"]["setting_category"]
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "system_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tips: {
        Row: {
          amount_gnf: number
          commission_gnf: number
          created_at: string
          id: string
          message: string | null
          net_gnf: number
          recipient_id: string
          sender_id: string
          status: string
        }
        Insert: {
          amount_gnf: number
          commission_gnf?: number
          created_at?: string
          id?: string
          message?: string | null
          net_gnf?: number
          recipient_id: string
          sender_id: string
          status?: string
        }
        Update: {
          amount_gnf?: number
          commission_gnf?: number
          created_at?: string
          id?: string
          message?: string | null
          net_gnf?: number
          recipient_id?: string
          sender_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "tips_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tips_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      track_credits: {
        Row: {
          contributor_name: string
          contributor_profile_id: string | null
          created_at: string
          display_order: number
          id: string
          role: string
          track_id: string
          updated_at: string
        }
        Insert: {
          contributor_name: string
          contributor_profile_id?: string | null
          created_at?: string
          display_order?: number
          id?: string
          role: string
          track_id: string
          updated_at?: string
        }
        Update: {
          contributor_name?: string
          contributor_profile_id?: string | null
          created_at?: string
          display_order?: number
          id?: string
          role?: string
          track_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "track_credits_contributor_profile_id_fkey"
            columns: ["contributor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "track_credits_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      track_files: {
        Row: {
          bitrate_kbps: number | null
          content_hash: string | null
          created_at: string
          created_by: string | null
          duration_seconds: number | null
          file_path: string
          file_size_bytes: number | null
          format: string
          id: string
          integrity_message: string | null
          integrity_status: string
          is_primary: boolean
          track_id: string
          updated_at: string
          updated_by: string | null
          validated_at: string | null
        }
        Insert: {
          bitrate_kbps?: number | null
          content_hash?: string | null
          created_at?: string
          created_by?: string | null
          duration_seconds?: number | null
          file_path: string
          file_size_bytes?: number | null
          format: string
          id?: string
          integrity_message?: string | null
          integrity_status?: string
          is_primary?: boolean
          track_id: string
          updated_at?: string
          updated_by?: string | null
          validated_at?: string | null
        }
        Update: {
          bitrate_kbps?: number | null
          content_hash?: string | null
          created_at?: string
          created_by?: string | null
          duration_seconds?: number | null
          file_path?: string
          file_size_bytes?: number | null
          format?: string
          id?: string
          integrity_message?: string | null
          integrity_status?: string
          is_primary?: boolean
          track_id?: string
          updated_at?: string
          updated_by?: string | null
          validated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "track_files_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      track_genres: {
        Row: {
          genre_id: string
          track_id: string
        }
        Insert: {
          genre_id: string
          track_id: string
        }
        Update: {
          genre_id?: string
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "track_genres_genre_id_fkey"
            columns: ["genre_id"]
            isOneToOne: false
            referencedRelation: "genres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "track_genres_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      tracks: {
        Row: {
          album_id: string | null
          bpm: number | null
          created_at: string
          created_by: string | null
          creator_id: string
          deleted_at: string | null
          duration_seconds: number | null
          explicit: boolean
          id: string
          isrc: string | null
          language: string
          metadata: Json
          musical_key: string | null
          publication_status: string
          published_at: string | null
          rejection_reason: string | null
          slug: string
          submitted_at: string | null
          title: string
          track_number: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          album_id?: string | null
          bpm?: number | null
          created_at?: string
          created_by?: string | null
          creator_id: string
          deleted_at?: string | null
          duration_seconds?: number | null
          explicit?: boolean
          id?: string
          isrc?: string | null
          language?: string
          metadata?: Json
          musical_key?: string | null
          publication_status?: string
          published_at?: string | null
          rejection_reason?: string | null
          slug: string
          submitted_at?: string | null
          title: string
          track_number?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          album_id?: string | null
          bpm?: number | null
          created_at?: string
          created_by?: string | null
          creator_id?: string
          deleted_at?: string | null
          duration_seconds?: number | null
          explicit?: boolean
          id?: string
          isrc?: string | null
          language?: string
          metadata?: Json
          musical_key?: string | null
          publication_status?: string
          published_at?: string | null
          rejection_reason?: string | null
          slug?: string
          submitted_at?: string | null
          title?: string
          track_number?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tracks_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracks_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount_gnf: number
          commission_gnf: number
          created_at: string
          currency: string
          description: string | null
          id: string
          metadata: Json
          net_amount_gnf: number
          payment_method: string | null
          payment_reference: string | null
          processed_at: string | null
          status: string
          type: string
          updated_at: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount_gnf: number
          commission_gnf?: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          metadata?: Json
          net_amount_gnf: number
          payment_method?: string | null
          payment_reference?: string | null
          processed_at?: string | null
          status?: string
          type: string
          updated_at?: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount_gnf?: number
          commission_gnf?: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          metadata?: Json
          net_amount_gnf?: number
          payment_method?: string | null
          payment_reference?: string | null
          processed_at?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          artist_comment_replies: boolean
          audio_quality: string
          autoplay_on_cellular: boolean
          autoplay_on_wifi: boolean
          awards_reminders: boolean
          created_at: string
          data_saver: boolean
          email_notifications: boolean
          explicit_content_allowed: boolean
          language: string
          marketing_notifications: boolean
          new_releases_alerts: boolean
          profile_visibility: string
          push_notifications: boolean
          show_listening_activity: boolean
          sms_notifications: boolean
          timezone: string
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          artist_comment_replies?: boolean
          audio_quality?: string
          autoplay_on_cellular?: boolean
          autoplay_on_wifi?: boolean
          awards_reminders?: boolean
          created_at?: string
          data_saver?: boolean
          email_notifications?: boolean
          explicit_content_allowed?: boolean
          language?: string
          marketing_notifications?: boolean
          new_releases_alerts?: boolean
          profile_visibility?: string
          push_notifications?: boolean
          show_listening_activity?: boolean
          sms_notifications?: boolean
          timezone?: string
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          artist_comment_replies?: boolean
          audio_quality?: string
          autoplay_on_cellular?: boolean
          autoplay_on_wifi?: boolean
          awards_reminders?: boolean
          created_at?: string
          data_saver?: boolean
          email_notifications?: boolean
          explicit_content_allowed?: boolean
          language?: string
          marketing_notifications?: boolean
          new_releases_alerts?: boolean
          profile_visibility?: string
          push_notifications?: boolean
          show_listening_activity?: boolean
          sms_notifications?: boolean
          timezone?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          role_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          role_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          created_at: string
          created_by: string | null
          device_id: string | null
          device_name: string | null
          expires_at: string | null
          id: string
          ip_address: unknown
          last_active_at: string
          platform: string | null
          revoked_at: string | null
          session_token_hash: string | null
          updated_at: string
          updated_by: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          device_id?: string | null
          device_name?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown
          last_active_at?: string
          platform?: string | null
          revoked_at?: string | null
          session_token_hash?: string | null
          updated_at?: string
          updated_by?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          device_id?: string | null
          device_name?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown
          last_active_at?: string
          platform?: string | null
          revoked_at?: string | null
          session_token_hash?: string | null
          updated_at?: string
          updated_by?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_ledger: {
        Row: {
          amount_gnf: number
          balance_after_gnf: number
          created_at: string
          entry_type: string
          id: string
          metadata: Json
          reason: string
          reference_id: string | null
          reference_type: string | null
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount_gnf: number
          balance_after_gnf: number
          created_at?: string
          entry_type: string
          id?: string
          metadata?: Json
          reason: string
          reference_id?: string | null
          reference_type?: string | null
          user_id: string
          wallet_id: string
        }
        Update: {
          amount_gnf?: number
          balance_after_gnf?: number
          created_at?: string
          entry_type?: string
          id?: string
          metadata?: Json
          reason?: string
          reference_id?: string | null
          reference_type?: string | null
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_ledger_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance_gnf: number
          created_at: string
          currency: string
          id: string
          total_credited_gnf: number
          total_debited_gnf: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance_gnf?: number
          created_at?: string
          currency?: string
          id?: string
          total_credited_gnf?: number
          total_debited_gnf?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance_gnf?: number
          created_at?: string
          currency?: string
          id?: string
          total_credited_gnf?: number
          total_debited_gnf?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          amount_gnf: number
          batch_id: string | null
          created_at: string
          fee_gnf: number
          id: string
          net_amount_gnf: number
          payout_account_id: string
          processed_at: string | null
          processed_by: string | null
          reference: string | null
          rejection_reason: string | null
          status: string
          updated_at: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount_gnf: number
          batch_id?: string | null
          created_at?: string
          fee_gnf?: number
          id?: string
          net_amount_gnf: number
          payout_account_id: string
          processed_at?: string | null
          processed_by?: string | null
          reference?: string | null
          rejection_reason?: string | null
          status?: string
          updated_at?: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount_gnf?: number
          batch_id?: string | null
          created_at?: string
          fee_gnf?: number
          id?: string
          net_amount_gnf?: number
          payout_account_id?: string
          processed_at?: string | null
          processed_by?: string | null
          reference?: string | null
          rejection_reason?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "payout_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawals_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      works: {
        Row: {
          created_at: string
          creator_id: string
          deleted_at: string | null
          description: string | null
          genre: string | null
          id: string
          iswc: string | null
          language: string
          metadata: Json
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          deleted_at?: string | null
          description?: string | null
          genre?: string | null
          id?: string
          iswc?: string | null
          language?: string
          metadata?: Json
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          deleted_at?: string | null
          description?: string | null
          genre?: string | null
          id?: string
          iswc?: string | null
          language?: string
          metadata?: Json
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "works_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      admin_dashboard_stats: {
        Row: {
          active_users_30d: number | null
          amount_recharged_today_gnf: number | null
          payments_confirmed_today: number | null
          payments_failed_today: number | null
          total_wallet_balance_gnf: number | null
          unread_alerts: number | null
          valid_streams_today: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      _assert_admin: { Args: never; Returns: undefined }
      _assert_creator_owner: {
        Args: { p_creator_id: string }
        Returns: undefined
      }
      add_payout_account: {
        Args: {
          p_account_holder_name: string
          p_bank_name?: string
          p_display_name: string
          p_iban?: string
          p_is_default?: boolean
          p_phone_number?: string
          p_type: string
        }
        Returns: string
      }
      append_stream_session_fraud_flags: {
        Args: { p_flags: string[]; p_session_id: string }
        Returns: undefined
      }
      approve_payout_request: {
        Args: { p_withdrawal_id: string }
        Returns: Json
      }
      assign_admin_role: { Args: { p_user_id: string }; Returns: undefined }
      assign_role_for_account_type: {
        Args: {
          p_account_type: string
          p_assigned_by?: string
          p_user_id: string
        }
        Returns: undefined
      }
      become_artist_for_current_user: { Args: never; Returns: Json }
      bootstrap_admin_if_none: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      calculate_royalties: { Args: { p_cycle_id: string }; Returns: Json }
      can_edit_creator: {
        Args: { p_creator_id: string; p_user_id?: string }
        Returns: boolean
      }
      can_manage_creator: {
        Args: { p_creator_id: string; p_user_id?: string }
        Returns: boolean
      }
      can_manage_label: {
        Args: { p_label_id: string; p_user_id?: string }
        Returns: boolean
      }
      cancel_payout_request: {
        Args: { p_reason?: string; p_withdrawal_id: string }
        Returns: Json
      }
      check_rate_limit: {
        Args: {
          p_action: string
          p_identifier: string
          p_max_count: number
          p_window_seconds?: number
        }
        Returns: boolean
      }
      complete_onboarding: {
        Args: { p_account_type: string; p_full_name: string }
        Returns: Json
      }
      complete_stream_session: {
        Args: {
          p_position_seconds: number
          p_session_id: string
          p_total_duration_seconds: number
        }
        Returns: boolean
      }
      confirm_payment_intent: {
        Args: { p_intent_id: string; p_provider_ref: string }
        Returns: Json
      }
      count_unread_notifications: { Args: never; Returns: number }
      create_notification: {
        Args: {
          p_body: string
          p_data?: Json
          p_title: string
          p_type: Database["public"]["Enums"]["notification_type"]
          p_user_id: string
        }
        Returns: undefined
      }
      create_payout_batch: {
        Args: { p_name: string; p_notes?: string }
        Returns: string
      }
      creator_is_active_public: {
        Args: { p_creator_id: string }
        Returns: boolean
      }
      distribute_royalties: { Args: { p_cycle_id: string }; Returns: Json }
      ensure_creator_for_current_user: { Args: never; Returns: string }
      expire_stale_payment_intents: { Args: never; Returns: number }
      f_unaccent: { Args: { "": string }; Returns: string }
      get_active_royalty_cycle: { Args: never; Returns: Json }
      get_admin_payout_queue: {
        Args: { p_limit?: number; p_status?: string }
        Returns: Json
      }
      get_creator_audience_stats: {
        Args: { p_creator_id: string }
        Returns: Json
      }
      get_creator_engagement_stats: {
        Args: { p_creator_id: string }
        Returns: Json
      }
      get_creator_revenue_stats: {
        Args: { p_creator_id: string }
        Returns: Json
      }
      get_creator_royalty_history: {
        Args: { p_creator_id: string; p_limit?: number }
        Returns: Json
      }
      get_creator_stream_analytics: {
        Args: { p_creator_id: string; p_period_days?: number }
        Returns: Json
      }
      get_creator_stream_stats: {
        Args: { p_creator_id: string }
        Returns: Json
      }
      get_creator_stream_timeline: {
        Args: { p_creator_id: string; p_days?: number }
        Returns: Json
      }
      get_creator_top_albums: {
        Args: { p_creator_id: string; p_limit?: number }
        Returns: Json
      }
      get_creator_top_tracks: {
        Args: { p_creator_id: string; p_limit?: number }
        Returns: Json
      }
      get_discovery_feed: { Args: { p_limit?: number }; Returns: Json }
      get_engagement_stats: {
        Args: { p_entity_id: string; p_entity_type: string }
        Returns: Json
      }
      get_feature_flags: {
        Args: never
        Returns: {
          enabled: boolean
          name: string
        }[]
      }
      get_follow_count: {
        Args: { p_entity_id: string; p_entity_type: string }
        Returns: number
      }
      get_launch_progress: { Args: never; Returns: Json }
      get_like_count: { Args: { p_track_id: string }; Returns: number }
      get_my_recent_activity: {
        Args: { p_limit?: number }
        Returns: {
          action: string
          created_at: string
          entity_type: string
          id: string
          metadata: Json
        }[]
      }
      get_new_releases: {
        Args: { p_days?: number; p_limit?: number; p_type?: string }
        Returns: Json
      }
      get_payout_summary: { Args: never; Returns: Json }
      get_playback_position: { Args: { p_track_id: string }; Returns: number }
      get_recommendations: { Args: { p_limit?: number }; Returns: Json }
      get_royalty_cycle_summary: { Args: { p_cycle_id: string }; Returns: Json }
      get_similar_tracks: {
        Args: { p_limit?: number; p_track_id: string }
        Returns: Json
      }
      get_suggested_albums: { Args: { p_limit?: number }; Returns: Json }
      get_suggested_artists: { Args: { p_limit?: number }; Returns: Json }
      get_system_setting: { Args: { p_key: string }; Returns: Json }
      get_trending_tracks: {
        Args: { p_limit?: number; p_window?: string }
        Returns: Json
      }
      get_user_payouts: { Args: { p_limit?: number }; Returns: Json }
      get_wallet_balance: { Args: { p_user_id?: string }; Returns: number }
      has_permission: {
        Args: { p_permission_code: string; p_user_id: string }
        Returns: boolean
      }
      has_public_artist_profile: {
        Args: { p_creator_id: string }
        Returns: boolean
      }
      has_streaming_permission: {
        Args: { p_user_id?: string }
        Returns: boolean
      }
      is_admin: { Args: { p_user_id: string }; Returns: boolean }
      is_artist_account: { Args: { p_user_id?: string }; Returns: boolean }
      is_creator_member: {
        Args: { p_creator_id: string; p_user_id?: string }
        Returns: boolean
      }
      is_favorited: {
        Args: { p_entity_id: string; p_entity_type: string }
        Returns: boolean
      }
      is_following: {
        Args: { p_entity_id: string; p_entity_type: string }
        Returns: boolean
      }
      is_label_member: {
        Args: { p_label_id: string; p_user_id?: string }
        Returns: boolean
      }
      is_liked: { Args: { p_track_id: string }; Returns: boolean }
      is_premium_user: { Args: { p_user_id?: string }; Returns: boolean }
      log_audit_event: {
        Args: {
          p_action: string
          p_actor_id: string
          p_entity_id?: string
          p_entity_type?: string
          p_ip_address?: unknown
          p_metadata?: Json
          p_user_agent?: string
        }
        Returns: string
      }
      log_audit_event_authenticated: {
        Args: {
          p_action: string
          p_entity_id?: string
          p_entity_type?: string
          p_metadata?: Json
        }
        Returns: string
      }
      mark_all_notifications_read: { Args: never; Returns: number }
      mark_notification_read: {
        Args: { p_notification_id: string }
        Returns: undefined
      }
      mark_payout_paid: {
        Args: { p_reference: string; p_withdrawal_id: string }
        Returns: Json
      }
      metadata_advance_isrc_sequence: {
        Args: {
          p_country_code: string
          p_registrant_code: string
          p_year_of_reference: string
        }
        Returns: {
          country_code: string
          last_designation: number
          registrant_code: string
          updated_at: string
          year_of_reference: string
        }[]
      }
      metadata_reserve_isrc: {
        Args: { p_actor_id: string; p_isrc: string }
        Returns: {
          created_at: string
          isrc: string
          metadata_id: string | null
          reserved_at: string | null
          reserved_by: string | null
          row_version: number
          status: string
          track_id: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "metadata_isrc_registry"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      metadata_reserve_upc: {
        Args: { p_actor_id: string; p_upc: string }
        Returns: {
          album_id: string | null
          created_at: string
          reserved_at: string | null
          reserved_by: string | null
          row_version: number
          status: string
          upc: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "metadata_upc_registry"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      open_royalty_cycle: {
        Args: {
          p_period_end: string
          p_period_start: string
          p_revenue_pool_percent?: number
          p_total_revenue_gnf: number
        }
        Returns: string
      }
      process_payout_request: {
        Args: { p_batch_id?: string; p_withdrawal_id: string }
        Returns: Json
      }
      purchase_beat: {
        Args: { p_beat_id: string; p_buyer_id: string }
        Returns: string
      }
      reject_payout_request: {
        Args: { p_reason: string; p_withdrawal_id: string }
        Returns: Json
      }
      request_withdrawal: {
        Args: { p_amount_gnf: number; p_payout_account_id: string }
        Returns: string
      }
      review_album_publication: {
        Args: {
          p_album_id: string
          p_rejection_reason?: string
          p_status: string
        }
        Returns: undefined
      }
      review_creator_verification: {
        Args: {
          p_rejection_reason?: string
          p_status: string
          p_verification_id: string
        }
        Returns: undefined
      }
      review_track_publication: {
        Args: {
          p_rejection_reason?: string
          p_status: string
          p_track_id: string
        }
        Returns: undefined
      }
      save_playback_position: {
        Args: { p_position_seconds: number; p_track_id: string }
        Returns: undefined
      }
      search_catalog: {
        Args: { p_limit?: number; p_query: string }
        Returns: Json
      }
      send_tip: {
        Args: { p_amount_gnf: number; p_receiver_creator_id: string }
        Returns: Json
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      start_stream_session: {
        Args: {
          p_device_id?: string
          p_platform?: string
          p_quality_kbps?: number
          p_total_duration_seconds?: number
          p_track_id: string
        }
        Returns: string
      }
      submit_album_for_review: {
        Args: { p_album_id: string }
        Returns: undefined
      }
      submit_creator_verification: {
        Args: { p_verification_id: string }
        Returns: undefined
      }
      submit_track_for_review: {
        Args: { p_track_id: string }
        Returns: undefined
      }
      subscribe_premium: { Args: { p_plan_type?: string }; Returns: Json }
      toggle_favorite: {
        Args: { p_entity_id: string; p_entity_type: string }
        Returns: boolean
      }
      toggle_follow: {
        Args: { p_entity_id: string; p_entity_type: string }
        Returns: boolean
      }
      toggle_like: { Args: { p_track_id: string }; Returns: boolean }
      topup_wallet: {
        Args: {
          p_amount_gnf: number
          p_description?: string
          p_payment_method: string
          p_payment_reference?: string
        }
        Returns: Json
      }
      unaccent: { Args: { "": string }; Returns: string }
      update_stream_heartbeat: {
        Args: { p_position_seconds: number; p_session_id: string }
        Returns: undefined
      }
    }
    Enums: {
      contract_type:
        | "sync"
        | "license"
        | "distribution"
        | "publishing"
        | "management"
      contributor_role:
        | "author"
        | "composer"
        | "lyricist"
        | "producer"
        | "arranger"
        | "performer"
      notification_type:
        | "stream_milestone"
        | "royalty_paid"
        | "verification_updated"
        | "rights_claim_updated"
        | "system"
      ownership_type: "master" | "publishing" | "neighboring"
      rights_claim_status: "pending" | "accepted" | "rejected" | "escalated"
      rights_claim_type: "ownership" | "infringement" | "takedown"
      setting_category: "streaming" | "wallet" | "creator" | "admin" | "general"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      contract_type: [
        "sync",
        "license",
        "distribution",
        "publishing",
        "management",
      ],
      contributor_role: [
        "author",
        "composer",
        "lyricist",
        "producer",
        "arranger",
        "performer",
      ],
      notification_type: [
        "stream_milestone",
        "royalty_paid",
        "verification_updated",
        "rights_claim_updated",
        "system",
      ],
      ownership_type: ["master", "publishing", "neighboring"],
      rights_claim_status: ["pending", "accepted", "rejected", "escalated"],
      rights_claim_type: ["ownership", "infringement", "takedown"],
      setting_category: ["streaming", "wallet", "creator", "admin", "general"],
    },
  },
} as const
