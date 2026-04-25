export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      aulas: {
        Row: {
          centro_id: string
          created_at: string
          id: string
          nombre: string
        }
        Insert: {
          centro_id: string
          created_at?: string
          id?: string
          nombre: string
        }
        Update: {
          centro_id?: string
          created_at?: string
          id?: string
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "aulas_centro_id_fkey"
            columns: ["centro_id"]
            isOneToOne: false
            referencedRelation: "centros"
            referencedColumns: ["id"]
          }
        ]
      }
      centros: {
        Row: {
          created_at: string
          id: string
          nombre: string
        }
        Insert: {
          created_at?: string
          id?: string
          nombre: string
        }
        Update: {
          created_at?: string
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      inventario: {
        Row: {
          aula_id: string | null
          caracteristicas: Json | null
          categoria: string | null
          centro_id: string
          codigo: string
          created_at: string
          estado: Database["public"]["Enums"]["inventory_status"]
          id: string
          imagen_url: string | null
          marca: string | null
          modelo: string | null
          nombre: string
          numero_serie: string | null
          observaciones: string | null
          ubicacion: string | null
          unidades: number
          updated_at: string
        }
        Insert: {
          aula_id?: string | null
          caracteristicas?: Json | null
          categoria?: string | null
          centro_id: string
          codigo: string
          created_at?: string
          estado?: Database["public"]["Enums"]["inventory_status"]
          id?: string
          imagen_url?: string | null
          marca?: string | null
          modelo?: string | null
          nombre: string
          numero_serie?: string | null
          observaciones?: string | null
          ubicacion?: string | null
          unidades?: number
          updated_at?: string
        }
        Update: {
          aula_id?: string | null
          caracteristicas?: Json | null
          categoria?: string | null
          centro_id?: string
          codigo?: string
          created_at?: string
          estado?: Database["public"]["Enums"]["inventory_status"]
          id?: string
          imagen_url?: string | null
          marca?: string | null
          modelo?: string | null
          nombre?: string
          numero_serie?: string | null
          observaciones?: string | null
          ubicacion?: string | null
          unidades?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventario_aula_id_fkey"
            columns: ["aula_id"]
            isOneToOne: false
            referencedRelation: "aulas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventario_centro_id_fkey"
            columns: ["centro_id"]
            isOneToOne: false
            referencedRelation: "centros"
            referencedColumns: ["id"]
          }
        ]
      }
      perfiles: {
        Row: {
          centro_id: string | null
          created_at: string
          id: string
          nombre: string | null
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          centro_id?: string | null
          created_at?: string
          id: string
          nombre?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          centro_id?: string | null
          created_at?: string
          id?: string
          nombre?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: [
          {
            foreignKeyName: "perfiles_centro_id_fkey"
            columns: ["centro_id"]
            isOneToOne: false
            referencedRelation: "centros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "perfiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_centro_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      inventory_status: "bueno" | "regular" | "malo" | "baja"
      user_role: "admin" | "centro"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
