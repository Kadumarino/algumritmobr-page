import { defineCollection, z } from 'astro:content';

const repertorio = defineCollection({
  type: 'data',
  schema: z.object({
    parte: z.string(),
    ordem: z.number(),
    formacao: z.string(),
    decadas: z.array(
      z.object({
        decada: z.string(),
        musicas: z.array(
          z.object({
            titulo: z.string(),
            artista: z.string(),
          })
        ),
      })
    ),
  }),
});

const depoimentos = defineCollection({
  type: 'data',
  schema: z.object({
    nome: z.string(),
    evento: z.string(),
    texto: z.string(),
    data: z.string().optional(),
  }),
});

export const collections = { repertorio, depoimentos };
