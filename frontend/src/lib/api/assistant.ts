import { api } from "./client";

export interface KnowledgeMatch {
  content: string;
  similarity: number;
}

export const assistantApi = {
  // The Go backend embeds the question and searches the knowledge base.
  searchKnowledge: (question: string) =>
    api.post<KnowledgeMatch[]>("/assistant/knowledge/search", { question }),
};
