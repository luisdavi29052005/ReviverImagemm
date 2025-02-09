export interface Database {
  public: {
    Tables: {
      processed_images: {
        Row: {
          id: string;
          user_id: string;
          original_url: string;
          processed_url: string;
          file_size: number;
          file_type: string;
          width: number | null;
          height: number | null;
          settings: {
            version: string;
            bgUpsampler: 'none' | 'realesrgan';
            realEsrgan: string;
            upscale: number;
          };
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          original_url: string;
          processed_url: string;
          file_size: number;
          file_type: string;
          width?: number | null;
          height?: number | null;
          settings: {
            version: string;
            bgUpsampler: 'none' | 'realesrgan';
            realEsrgan: string;
            upscale: number;
          };
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          original_url?: string;
          processed_url?: string;
          file_size?: number;
          file_type?: string;
          width?: number | null;
          height?: number | null;
          settings?: {
            version: string;
            bgUpsampler: 'none' | 'realesrgan';
            realEsrgan: string;
            upscale: number;
          };
          created_at?: string;
        };
      };
    };
    Views: {
      [key: string]: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
    };
    Functions: {
      [key: string]: unknown;
    };
    Enums: {
      [key: string]: unknown;
    };
  };
}