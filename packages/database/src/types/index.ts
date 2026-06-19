export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          phone: string | null;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          avatar_path: string | null;
          bio: string | null;
          city: string | null;
          country_code: string | null;
          account_type: "auditeur" | "artiste" | "auditeur_artiste" | null;
          locale: string;
          fraud_score: number;
          onboarding_completed: boolean;
          is_premium: boolean;
          premium_expires_at: string | null;
          role: "listener" | "artist" | "superadmin" | null;
          stage_name: string | null;
          main_genre: string | null;
          song_language: string | null;
          origin_region: string | null;
          orange_money_number: string | null;
          mtn_money_number: string | null;
          preferred_language: string | null;
          backup_email: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id: string;
          phone?: string | null;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          avatar_path?: string | null;
          bio?: string | null;
          city?: string | null;
          country_code?: string | null;
          account_type?: "auditeur" | "artiste" | "auditeur_artiste" | null;
          locale?: string;
          fraud_score?: number;
          onboarding_completed?: boolean;
          is_premium?: boolean;
          premium_expires_at?: string | null;
          role?: "listener" | "artist" | "superadmin" | null;
          stage_name?: string | null;
          main_genre?: string | null;
          song_language?: string | null;
          origin_region?: string | null;
          orange_money_number?: string | null;
          mtn_money_number?: string | null;
          preferred_language?: string | null;
          backup_email?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Update: {
          phone?: string | null;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          avatar_path?: string | null;
          bio?: string | null;
          city?: string | null;
          country_code?: string | null;
          account_type?: "auditeur" | "artiste" | "auditeur_artiste" | null;
          locale?: string;
          fraud_score?: number;
          onboarding_completed?: boolean;
          is_premium?: boolean;
          premium_expires_at?: string | null;
          role?: "listener" | "artist" | "superadmin" | null;
          stage_name?: string | null;
          main_genre?: string | null;
          song_language?: string | null;
          origin_region?: string | null;
          orange_money_number?: string | null;
          mtn_money_number?: string | null;
          preferred_language?: string | null;
          backup_email?: string | null;
          updated_by?: string | null;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      roles: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
        };
        Update: {
          name?: string;
          description?: string | null;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      permissions: {
        Row: {
          id: string;
          code: string;
          description: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          code: string;
          description?: string | null;
        };
        Update: {
          code?: string;
          description?: string | null;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      role_permissions: {
        Row: {
          role_id: string;
          permission_id: string;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          role_id: string;
          permission_id: string;
          created_by?: string | null;
        };
        Update: {
          role_id?: string;
          permission_id?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          user_id: string;
          role_id: string;
          assigned_at: string;
          assigned_by: string | null;
        };
        Insert: {
          user_id: string;
          role_id: string;
          assigned_by?: string | null;
        };
        Update: {
          assigned_by?: string | null;
        };
        Relationships: [];
      };
      user_sessions: {
        Row: {
          id: string;
          user_id: string;
          device_id: string | null;
          device_name: string | null;
          platform: "web" | "ios" | "android" | null;
          ip_address: string | null;
          user_agent: string | null;
          session_token_hash: string | null;
          expires_at: string | null;
          revoked_at: string | null;
          last_active_at: string;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          device_id?: string | null;
          device_name?: string | null;
          platform?: "web" | "ios" | "android" | null;
          ip_address?: string | null;
          user_agent?: string | null;
          session_token_hash?: string | null;
          expires_at?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Update: {
          device_id?: string | null;
          device_name?: string | null;
          platform?: "web" | "ios" | "android" | null;
          ip_address?: string | null;
          user_agent?: string | null;
          expires_at?: string | null;
          revoked_at?: string | null;
          last_active_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      user_preferences: {
        Row: {
          user_id: string;
          language: "fr" | "en";
          audio_quality: "64" | "128" | "256" | "auto";
          data_saver: boolean;
          autoplay_on_wifi: boolean;
          autoplay_on_cellular: boolean;
          explicit_content_allowed: boolean;
          profile_visibility: "public" | "private";
          show_listening_activity: boolean;
          push_notifications: boolean;
          email_notifications: boolean;
          sms_notifications: boolean;
          marketing_notifications: boolean;
          awards_reminders: boolean;
          new_releases_alerts: boolean;
          artist_comment_replies: boolean;
          timezone: string;
          created_at: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          user_id: string;
          language?: "fr" | "en";
          audio_quality?: "64" | "128" | "256" | "auto";
          data_saver?: boolean;
          autoplay_on_wifi?: boolean;
          autoplay_on_cellular?: boolean;
          explicit_content_allowed?: boolean;
          profile_visibility?: "public" | "private";
          show_listening_activity?: boolean;
          push_notifications?: boolean;
          email_notifications?: boolean;
          sms_notifications?: boolean;
          marketing_notifications?: boolean;
          awards_reminders?: boolean;
          new_releases_alerts?: boolean;
          artist_comment_replies?: boolean;
          timezone?: string;
          updated_by?: string | null;
        };
        Update: {
          language?: "fr" | "en";
          audio_quality?: "64" | "128" | "256" | "auto";
          data_saver?: boolean;
          autoplay_on_wifi?: boolean;
          autoplay_on_cellular?: boolean;
          explicit_content_allowed?: boolean;
          profile_visibility?: "public" | "private";
          show_listening_activity?: boolean;
          push_notifications?: boolean;
          email_notifications?: boolean;
          sms_notifications?: boolean;
          marketing_notifications?: boolean;
          awards_reminders?: boolean;
          new_releases_alerts?: boolean;
          artist_comment_replies?: boolean;
          timezone?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          category: "system" | "social" | "artist" | "billing" | "security";
          title: string;
          body: string;
          action_url: string | null;
          read_at: string | null;
          priority: "low" | "normal" | "high";
          metadata: Json;
          created_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          category: "system" | "social" | "artist" | "billing" | "security";
          title: string;
          body: string;
          action_url?: string | null;
          read_at?: string | null;
          priority?: "low" | "normal" | "high";
          metadata?: Json;
          deleted_at?: string | null;
        };
        Update: {
          read_at?: string | null;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      labels: {
        Row: {
          id: string;
          name: string;
          slug: string;
          owner_id: string;
          description: string | null;
          logo_path: string | null;
          country_code: string;
          website_url: string | null;
          verified: boolean;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          owner_id: string;
          description?: string | null;
          logo_path?: string | null;
          country_code?: string;
          website_url?: string | null;
          verified?: boolean;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Update: {
          name?: string;
          slug?: string;
          description?: string | null;
          logo_path?: string | null;
          country_code?: string;
          website_url?: string | null;
          verified?: boolean;
          updated_by?: string | null;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      creators: {
        Row: {
          id: string;
          owner_id: string;
          label_id: string | null;
          status: "draft" | "active" | "suspended";
          tier: "emergent" | "croissance" | "etabli";
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          owner_id: string;
          label_id?: string | null;
          status?: "draft" | "active" | "suspended";
          tier?: "emergent" | "croissance" | "etabli";
          created_by?: string | null;
          updated_by?: string | null;
        };
        Update: {
          label_id?: string | null;
          status?: "draft" | "active" | "suspended";
          tier?: "emergent" | "croissance" | "etabli";
          updated_by?: string | null;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      artist_profiles: {
        Row: {
          creator_id: string;
          stage_name: string;
          slug: string;
          bio: string | null;
          genres: string[];
          banner_path: string | null;
          cover_path: string | null;
          social_links: Json;
          is_public: boolean;
          verified: boolean;
          verified_at: string | null;
          created_at: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          creator_id: string;
          stage_name: string;
          slug: string;
          bio?: string | null;
          genres?: string[];
          banner_path?: string | null;
          cover_path?: string | null;
          social_links?: Json;
          is_public?: boolean;
          verified?: boolean;
          updated_by?: string | null;
        };
        Update: {
          stage_name?: string;
          slug?: string;
          bio?: string | null;
          genres?: string[];
          banner_path?: string | null;
          cover_path?: string | null;
          social_links?: Json;
          is_public?: boolean;
          verified?: boolean;
          verified_at?: string | null;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      creator_roles: {
        Row: {
          id: string;
          creator_id: string;
          member_id: string;
          role: "owner" | "manager" | "editor" | "accountant" | "viewer";
          invited_by: string | null;
          accepted_at: string;
          created_at: string;
          updated_at: string;
          updated_by: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          creator_id: string;
          member_id: string;
          role: "owner" | "manager" | "editor" | "accountant" | "viewer";
          invited_by?: string | null;
          accepted_at?: string;
          updated_by?: string | null;
        };
        Update: {
          role?: "owner" | "manager" | "editor" | "accountant" | "viewer";
          updated_by?: string | null;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      label_members: {
        Row: {
          label_id: string;
          member_id: string;
          role: "owner" | "admin" | "a_and_r" | "member";
          invited_by: string | null;
          joined_at: string;
          created_at: string;
          updated_at: string;
          updated_by: string | null;
          deleted_at: string | null;
        };
        Insert: {
          label_id: string;
          member_id: string;
          role: "owner" | "admin" | "a_and_r" | "member";
          invited_by?: string | null;
          updated_by?: string | null;
        };
        Update: {
          role?: "owner" | "admin" | "a_and_r" | "member";
          updated_by?: string | null;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      studios: {
        Row: {
          id: string;
          creator_id: string;
          name: string;
          city: string;
          country_code: string;
          address: string | null;
          is_primary: boolean;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          creator_id: string;
          name: string;
          city?: string;
          country_code?: string;
          address?: string | null;
          is_primary?: boolean;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Update: {
          name?: string;
          city?: string;
          country_code?: string;
          address?: string | null;
          is_primary?: boolean;
          updated_by?: string | null;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      creator_verifications: {
        Row: {
          id: string;
          creator_id: string;
          label_id: string | null;
          verification_type: "identity" | "artist" | "label";
          status: "draft" | "pending" | "approved" | "rejected";
          document_type: "national_id" | "passport" | "business_license" | "other" | null;
          document_path: string | null;
          rejection_reason: string | null;
          notes: string | null;
          metadata: Json;
          submitted_at: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          creator_id: string;
          label_id?: string | null;
          verification_type: "identity" | "artist" | "label";
          status?: "draft" | "pending" | "approved" | "rejected";
          document_type?: "national_id" | "passport" | "business_license" | "other" | null;
          document_path?: string | null;
          notes?: string | null;
          metadata?: Json;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Update: {
          status?: "draft" | "pending" | "approved" | "rejected";
          document_type?: "national_id" | "passport" | "business_license" | "other" | null;
          document_path?: string | null;
          rejection_reason?: string | null;
          notes?: string | null;
          metadata?: Json;
          submitted_at?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      genres: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          sort_order?: number;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          slug?: string;
          description?: string | null;
          sort_order?: number;
          is_active?: boolean;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      albums: {
        Row: {
          id: string;
          creator_id: string;
          label_id: string | null;
          title: string;
          slug: string;
          release_type: "album" | "single" | "ep";
          upc: string | null;
          description: string | null;
          cover_path: string | null;
          release_date: string | null;
          publication_status: "draft" | "pending_review" | "published" | "rejected" | "archived";
          rejection_reason: string | null;
          submitted_at: string | null;
          published_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          creator_id: string;
          label_id?: string | null;
          title: string;
          slug: string;
          release_type?: "album" | "single" | "ep";
          upc?: string | null;
          description?: string | null;
          cover_path?: string | null;
          release_date?: string | null;
          publication_status?: "draft" | "pending_review" | "published" | "rejected" | "archived";
          metadata?: Json;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Update: {
          title?: string;
          slug?: string;
          release_type?: "album" | "single" | "ep";
          upc?: string | null;
          description?: string | null;
          cover_path?: string | null;
          release_date?: string | null;
          publication_status?: "draft" | "pending_review" | "published" | "rejected" | "archived";
          rejection_reason?: string | null;
          metadata?: Json;
          updated_by?: string | null;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      album_genres: {
        Row: { album_id: string; genre_id: string };
        Insert: { album_id: string; genre_id: string };
        Update: { album_id?: string; genre_id?: string };
        Relationships: [];
      };
      tracks: {
        Row: {
          id: string;
          creator_id: string;
          album_id: string | null;
          title: string;
          slug: string;
          track_number: number;
          isrc: string | null;
          duration_seconds: number | null;
          explicit: boolean;
          language: string;
          bpm: number | null;
          musical_key: string | null;
          publication_status: "draft" | "pending_review" | "published" | "rejected" | "archived";
          rejection_reason: string | null;
          submitted_at: string | null;
          published_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          creator_id: string;
          album_id?: string | null;
          title: string;
          slug: string;
          track_number?: number;
          isrc?: string | null;
          duration_seconds?: number | null;
          explicit?: boolean;
          language?: string;
          bpm?: number | null;
          musical_key?: string | null;
          publication_status?: "draft" | "pending_review" | "published" | "rejected" | "archived";
          metadata?: Json;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Update: {
          album_id?: string | null;
          title?: string;
          slug?: string;
          track_number?: number;
          isrc?: string | null;
          duration_seconds?: number | null;
          explicit?: boolean;
          language?: string;
          bpm?: number | null;
          musical_key?: string | null;
          publication_status?: "draft" | "pending_review" | "published" | "rejected" | "archived";
          rejection_reason?: string | null;
          metadata?: Json;
          updated_by?: string | null;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      track_genres: {
        Row: { track_id: string; genre_id: string };
        Insert: { track_id: string; genre_id: string };
        Update: { track_id?: string; genre_id?: string };
        Relationships: [];
      };
      playlists: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          cover_path: string | null;
          is_public: boolean;
          track_count: number;
          total_duration_seconds: number;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          cover_path?: string | null;
          is_public?: boolean;
          track_count?: number;
          total_duration_seconds?: number;
        };
        Update: {
          title?: string;
          description?: string | null;
          cover_path?: string | null;
          is_public?: boolean;
          track_count?: number;
          total_duration_seconds?: number;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      track_credits: {
        Row: {
          id: string;
          track_id: string;
          contributor_profile_id: string | null;
          contributor_name: string;
          role: "artiste_principal" | "featuring" | "auteur" | "compositeur" | "producteur" | "beatmaker" | "mixage" | "mastering";
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          track_id: string;
          contributor_profile_id?: string | null;
          contributor_name: string;
          role: "artiste_principal" | "featuring" | "auteur" | "compositeur" | "producteur" | "beatmaker" | "mixage" | "mastering";
          display_order?: number;
        };
        Update: {
          contributor_profile_id?: string | null;
          contributor_name?: string;
          role?: "artiste_principal" | "featuring" | "auteur" | "compositeur" | "producteur" | "beatmaker" | "mixage" | "mastering";
          display_order?: number;
        };
        Relationships: [];
      };
      playlist_tracks: {
        Row: {
          playlist_id: string;
          track_id: string;
          position: number;
          added_at: string;
          added_by: string | null;
        };
        Insert: {
          playlist_id: string;
          track_id: string;
          position?: number;
          added_by?: string | null;
        };
        Update: {
          position?: number;
        };
        Relationships: [];
      };
      favorites: {
        Row: {
          user_id: string;
          entity_type: "track" | "album" | "artist" | "playlist";
          entity_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          entity_type: "track" | "album" | "artist" | "playlist";
          entity_id: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      stream_sessions: {
        Row: {
          id: string;
          user_id: string;
          track_id: string;
          track_file_id: string | null;
          device_id: string | null;
          platform: "web" | "ios" | "android";
          quality_kbps: number | null;
          started_at: string;
          last_heartbeat_at: string;
          completed_at: string | null;
          total_listened_seconds: number;
          total_duration_seconds: number;
          listen_percentage: number;
          is_valid_listen: boolean;
          fraud_flags: string[];
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          track_id: string;
          track_file_id?: string | null;
          device_id?: string | null;
          platform?: "web" | "ios" | "android";
          quality_kbps?: number | null;
          total_duration_seconds?: number;
          ip_address?: string | null;
          user_agent?: string | null;
        };
        Update: {
          last_heartbeat_at?: string;
          completed_at?: string | null;
          total_listened_seconds?: number;
          total_duration_seconds?: number;
          listen_percentage?: number;
          is_valid_listen?: boolean;
          fraud_flags?: string[];
        };
        Relationships: [];
      };
      stream_events: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          track_id: string;
          event_type: "play" | "pause" | "resume" | "seek" | "complete" | "skip" | "heartbeat";
          position_seconds: number;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id: string;
          track_id: string;
          event_type: "play" | "pause" | "resume" | "seek" | "complete" | "skip" | "heartbeat";
          position_seconds: number;
          metadata?: Json;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      playback_positions: {
        Row: {
          user_id: string;
          track_id: string;
          position_seconds: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          track_id: string;
          position_seconds: number;
        };
        Update: {
          position_seconds?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      track_files: {
        Row: {
          id: string;
          track_id: string;
          format: "mp3" | "aac" | "flac" | "wav";
          bitrate_kbps: number | null;
          file_path: string;
          file_size_bytes: number | null;
          duration_seconds: number | null;
          is_primary: boolean;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          track_id: string;
          format: "mp3" | "aac" | "flac" | "wav";
          bitrate_kbps?: number | null;
          file_path: string;
          file_size_bytes?: number | null;
          duration_seconds?: number | null;
          is_primary?: boolean;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Update: {
          format?: "mp3" | "aac" | "flac" | "wav";
          bitrate_kbps?: number | null;
          file_path?: string;
          file_size_bytes?: number | null;
          duration_seconds?: number | null;
          is_primary?: boolean;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          entity_type: string | null;
          entity_id: string | null;
          metadata: Json;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          action: string;
          entity_type?: string | null;
          entity_id?: string | null;
          metadata?: Json;
          ip_address?: string | null;
          user_agent?: string | null;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      payment_intents: {
        Row: {
          id: string;
          user_id: string;
          wallet_id: string;
          provider: string;
          purpose: string;
          amount_gnf: number;
          currency: string;
          provider_ref: string | null;
          provider_phone: string;
          status: string;
          metadata: Json;
          initiated_at: string;
          confirmed_at: string | null;
          failed_at: string | null;
          expires_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          wallet_id: string;
          provider: string;
          purpose: string;
          amount_gnf: number;
          currency?: string;
          provider_ref?: string | null;
          provider_phone: string;
          status?: string;
          metadata?: Json;
          initiated_at?: string;
          confirmed_at?: string | null;
          failed_at?: string | null;
          expires_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: string;
          provider_ref?: string | null;
          confirmed_at?: string | null;
          failed_at?: string | null;
          metadata?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      assign_role_for_account_type: {
        Args: {
          p_user_id: string;
          p_account_type: string;
          p_assigned_by?: string;
        };
        Returns: undefined;
      };
      complete_onboarding: {
        Args: {
          p_full_name: string;
          p_account_type: string;
        };
        Returns: Json;
      };
      log_audit_event: {
        Args: {
          p_actor_id: string;
          p_action: string;
          p_entity_type?: string | null;
          p_entity_id?: string | null;
          p_metadata?: Json;
          p_ip_address?: string | null;
          p_user_agent?: string | null;
        };
        Returns: string;
      };
      log_audit_event_authenticated: {
        Args: {
          p_action: string;
          p_entity_type?: string | null;
          p_entity_id?: string | null;
          p_metadata?: Json;
        };
        Returns: string;
      };
      is_admin: {
        Args: { p_user_id: string };
        Returns: boolean;
      };
      mark_notification_read: {
        Args: { p_notification_id: string };
        Returns: undefined;
      };
      mark_all_notifications_read: {
        Args: Record<string, never>;
        Returns: number;
      };
      ensure_creator_for_current_user: {
        Args: Record<string, never>;
        Returns: string;
      };
      become_artist_for_current_user: {
        Args: Record<string, never>;
        Returns: Json;
      };
      submit_creator_verification: {
        Args: { p_verification_id: string };
        Returns: undefined;
      };
      review_creator_verification: {
        Args: {
          p_verification_id: string;
          p_status: string;
          p_rejection_reason?: string | null;
        };
        Returns: undefined;
      };
      is_artist_account: {
        Args: { p_user_id?: string };
        Returns: boolean;
      };
      is_creator_member: {
        Args: { p_creator_id: string; p_user_id?: string };
        Returns: boolean;
      };
      can_manage_creator: {
        Args: { p_creator_id: string; p_user_id?: string };
        Returns: boolean;
      };
      can_edit_creator: {
        Args: { p_creator_id: string; p_user_id?: string };
        Returns: boolean;
      };
      is_label_member: {
        Args: { p_label_id: string; p_user_id?: string };
        Returns: boolean;
      };
      can_manage_label: {
        Args: { p_label_id: string; p_user_id?: string };
        Returns: boolean;
      };
      submit_album_for_review: {
        Args: { p_album_id: string };
        Returns: undefined;
      };
      review_album_publication: {
        Args: {
          p_album_id: string;
          p_status: string;
          p_rejection_reason?: string | null;
        };
        Returns: undefined;
      };
      submit_track_for_review: {
        Args: { p_track_id: string };
        Returns: undefined;
      };
      start_stream_session: {
        Args: {
          p_track_id: string;
          p_platform: string;
          p_quality_kbps?: number | null;
          p_device_id?: string | null;
          p_total_duration_seconds?: number;
        };
        Returns: string;
      };
      update_stream_heartbeat: {
        Args: { p_session_id: string; p_position_seconds: number };
        Returns: undefined;
      };
      complete_stream_session: {
        Args: {
          p_session_id: string;
          p_position_seconds: number;
          p_total_duration_seconds: number;
        };
        Returns: boolean;
      };
      toggle_favorite: {
        Args: { p_entity_type: string; p_entity_id: string };
        Returns: boolean;
      };
      is_favorited: {
        Args: { p_entity_type: string; p_entity_id: string };
        Returns: boolean;
      };
      save_playback_position: {
        Args: { p_track_id: string; p_position_seconds: number };
        Returns: undefined;
      };
      get_playback_position: {
        Args: { p_track_id: string };
        Returns: number;
      };
      has_streaming_permission: {
        Args: { p_user_id?: string };
        Returns: boolean;
      };
      is_premium_user: {
        Args: { p_user_id?: string };
        Returns: boolean;
      };
      // Wallet OS — Sprint 8
      get_wallet_balance: {
        Args: { p_user_id?: string };
        Returns: number;
      };
      subscribe_premium: {
        Args: { p_plan_type?: string };
        Returns: { success: boolean; expires_at: string; amount_debited_gnf: number; plan_type: string };
      };
      add_payout_account: {
        Args: {
          p_type: string;
          p_display_name: string;
          p_account_holder_name: string;
          p_phone_number?: string | null;
          p_iban?: string | null;
          p_bank_name?: string | null;
          p_is_default?: boolean;
        };
        Returns: string;
      };
      request_withdrawal: {
        Args: { p_payout_account_id: string; p_amount_gnf: number };
        Returns: string;
      };
      get_trending_tracks: {
        Args: { p_window?: string; p_limit?: number };
        Returns: Json;
      };
      get_discovery_feed: {
        Args: { p_limit?: number };
        Returns: Json;
      };
      get_new_releases: {
        Args: { p_type?: string; p_days?: number; p_limit?: number };
        Returns: Json;
      };
      get_suggested_artists: {
        Args: { p_limit?: number };
        Returns: Json;
      };
      send_tip: {
        Args: {
          p_receiver_creator_id: string;
          p_amount_gnf: number;
        };
        Returns: Json;
      };
      confirm_payment_intent: {
        Args: { p_intent_id: string; p_provider_ref: string };
        Returns: Json;
      };
      expire_stale_payment_intents: {
        Args: Record<string, never>;
        Returns: number;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// ---------------------------------------------------------------------------
// Wallet OS table types — Sprint 8
// ---------------------------------------------------------------------------

export interface WalletRow {
  id: string;
  user_id: string;
  balance_gnf: number;
  currency: string;
  total_credited_gnf: number;
  total_debited_gnf: number;
  created_at: string;
  updated_at: string;
}

export interface WalletLedgerRow {
  id: string;
  wallet_id: string;
  user_id: string;
  entry_type: "credit" | "debit";
  amount_gnf: number;
  balance_after_gnf: number;
  reason: string;
  reference_id: string | null;
  reference_type: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface TransactionRow {
  id: string;
  user_id: string;
  wallet_id: string;
  type: string;
  status: string;
  amount_gnf: number;
  commission_gnf: number;
  net_amount_gnf: number;
  currency: string;
  payment_method: string | null;
  payment_reference: string | null;
  description: string | null;
  metadata: Record<string, unknown>;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WithdrawalRow {
  id: string;
  user_id: string;
  wallet_id: string;
  payout_account_id: string;
  amount_gnf: number;
  fee_gnf: number;
  net_amount_gnf: number;
  status: string;
  reference: string | null;
  rejection_reason: string | null;
  processed_by: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PayoutAccountRow {
  id: string;
  user_id: string;
  type: string;
  is_default: boolean;
  verified: boolean;
  display_name: string;
  phone_number: string | null;
  iban: string | null;
  bank_name: string | null;
  account_holder_name: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface RoyaltyCycleRow {
  id: string;
  period_start: string;
  period_end: string;
  status: string;
  total_valid_listens: number;
  total_revenue_gnf: number;
  revenue_pool_gnf: number;
  revenue_pool_percent: number;
  artist_count: number;
  distributed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoyaltyCalculationRow {
  id: string;
  cycle_id: string;
  artist_id: string;
  creator_id: string | null;
  valid_listen_count: number;
  listen_share_percent: number;
  gross_amount_gnf: number;
  platform_commission_gnf: number;
  net_amount_gnf: number;
  status: string;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}
