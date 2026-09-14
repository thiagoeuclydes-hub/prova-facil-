
export type QuestionLevel = 'Fácil' | 'Intermediário' | 'Médio' | 'Difícil' | 'Universitário' | 'Concurso' | 'Mestrado/Doutorado';
export type QuestionType = 'fechada' | 'aberta';

export interface QuestionSkeleton {
  id: string;
  tipo: QuestionType;
  nivel: QuestionLevel;
  opcoesCount?: number;
}

export interface Question {
  numero: number;
  tipo: QuestionType;
  nivel: QuestionLevel;
  enunciado: string;
  alternativas?: string[];
}

export interface GabaritoItem {
  numero: number;
  resposta_correta?: string;
  resposta_esperada?: string;
}

export interface Prova {
  versao: string;
  questoes: Question[];
  gabarito: GabaritoItem[];
}

export interface ExamData {
  provas: Prova[];
}
