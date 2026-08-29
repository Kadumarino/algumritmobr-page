// Cliente Supabase usado SOMENTE no navegador (dentro de <script> das páginas),
// nunca durante o build estático — os dados precisam estar sempre atualizados
// sem exigir um novo deploy a cada depoimento/comentário aprovado.
//
// A "anon key" é pública por design: o acesso real é controlado pelas
// políticas de Row Level Security definidas em supabase/schema.sql (leitura
// só de registros aprovados, inserção sempre como pendente).
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const supabaseEnabled = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = supabaseEnabled
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export interface DepoimentoPublico {
  id: string;
  nome: string;
  instagram: string;
  texto: string;
  created_at: string;
}

export interface Comentario {
  id: string;
  instagram: string;
  texto: string;
  likes_count: number;
  created_at: string;
}

export interface BookPost {
  id: string;
  tipo: 'video' | 'foto';
  pinned: boolean;
  instagram_url: string;
  thumbnail_url: string;
  titulo: string | null;
  created_at: string;
}

/** Gera uma cor HSL estável a partir de uma string (ex.: @instagram). */
export function corAvatar(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const matiz = Math.abs(hash) % 360;
  return `hsl(${matiz}, 45%, 32%)`;
}

/** Primeira letra visível do @ (ignora "@" se a pessoa digitar). */
export function inicialAvatar(instagram: string): string {
  const limpo = instagram.replace(/^@/, '').trim();
  return (limpo.charAt(0) || '?').toUpperCase();
}
