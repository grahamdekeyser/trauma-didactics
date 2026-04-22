// Hand-written Database type. Regenerate from the live schema with:
//   npx supabase gen types typescript --project-id <ref> > src/lib/supabase/database.types.ts
export type Database = {
  public: {
    Tables: {
      sessions: {
        Row: {
          id: string;
          type: "breakfast_club" | "fracture_conference" | "virtuohsu";
          date: string;
          topic: string | null;
          webex_url: string | null;
          is_cancelled: boolean;
          cancellation_note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: "breakfast_club" | "fracture_conference" | "virtuohsu";
          date: string;
          topic?: string | null;
          webex_url?: string | null;
          is_cancelled?: boolean;
          cancellation_note?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["sessions"]["Insert"]>;
        Relationships: [];
      };
      papers: {
        Row: {
          id: string;
          session_id: string;
          title: string;
          citation: string | null;
          pubmed_url: string | null;
          pdf_path: string | null;
          needs_cleanup: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          title: string;
          citation?: string | null;
          pubmed_url?: string | null;
          pdf_path?: string | null;
          needs_cleanup?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["papers"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "papers_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      wish_list: {
        Row: {
          id: string;
          topic: string;
          submitter_name: string;
          submitter_user_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          topic: string;
          submitter_name: string;
          submitter_user_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["wish_list"]["Insert"]>;
        Relationships: [];
      };
      wish_list_votes: {
        Row: {
          wish_list_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          wish_list_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["wish_list_votes"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "wish_list_votes_wish_list_id_fkey";
            columns: ["wish_list_id"];
            isOneToOne: false;
            referencedRelation: "wish_list";
            referencedColumns: ["id"];
          },
        ];
      };
      research_ideas: {
        Row: {
          id: string;
          title: string;
          references: string;
          description: string;
          submitter_role: "resident" | "faculty";
          submitter_user_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          references?: string;
          description: string;
          submitter_role: "resident" | "faculty";
          submitter_user_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["research_ideas"]["Insert"]>;
        Relationships: [];
      };
      webinars: {
        Row: {
          id: string;
          title: string;
          date: string;
          url: string;
          source: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          date: string;
          url: string;
          source?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["webinars"]["Insert"]>;
        Relationships: [];
      };
      resources: {
        Row: {
          id: string;
          label: string;
          url: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          label: string;
          url: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["resources"]["Insert"]>;
        Relationships: [];
      };
      admins: {
        Row: {
          email: string;
          added_at: string;
        };
        Insert: {
          email: string;
          added_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["admins"]["Insert"]>;
        Relationships: [];
      };
      teaching_cases: {
        Row: {
          id: string;
          fracture_type: string;
          notes: string | null;
          submitter_user_id: string | null;
          submitter_name: string | null;
          submitter_email: string | null;
          submitted_at: string;
        };
        Insert: {
          id?: string;
          fracture_type: string;
          notes?: string | null;
          submitter_user_id?: string | null;
          submitter_name?: string | null;
          submitter_email?: string | null;
          submitted_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["teaching_cases"]["Insert"]
        >;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: {
      session_type: "breakfast_club" | "fracture_conference" | "virtuohsu";
      submitter_role: "resident" | "faculty";
    };
  };
};
