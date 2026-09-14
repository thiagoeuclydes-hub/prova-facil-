import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check route
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      time: new Date().toISOString(),
      hasKey: !!process.env.GEMINI_API_KEY
    });
  });

  // Lazy AI Client Helper
  const getAIClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY não configurada. Por favor, adicione sua chave em Settings > Secrets.");
    }
    return new GoogleGenAI({ 
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  };

  // API route for exam generation
  app.post("/api/generate-exam", async (req, res) => {
    console.log("Request received for exam generation:", req.body.title);
    try {
      const { 
        institution, 
        title, 
        subject, 
        professor, 
        content, 
        skeleton, 
        versions 
      } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not defined in environment variables");
      }

      const systemInstruction = `Você é o motor inteligente do "PROVA FÁCIL", especialista em criar avaliações acadêmicas calibradas rigorosamente por complexidade e extensão.

### REGRAS OBRIGATÓRIAS DE COMPLEXIDADE:
1. Fácil/Intermediário: Conceitos básicos, enunciados diretos (~20-30 palavras).
2. Médio/Difícil: Exige análise e raciocínio lógico (~40-60 palavras).
3. Universitário/Concurso: Rigor técnico, questões estilo ENADE/OAB/Concursos Públicos (~80-100 palavras).
4. Mestrado/Doutorado: Alta complexidade, discussões teóricas profundas, terminologia avançada (~120+ palavras).

### REGRAS PARA QUESTÕES ABERTAS (DISCURSIVAS):
- A resposta esperada no gabarito deve ter, OBRIGATORIAMENTE, no máximo 3 palavras (podendo ser 1, 2 ou 3 palavras).
- A resposta deve ser uma informação exata contida no texto-base (ex: uma data, um nome, um local ou termo técnico).
- Formule o enunciado de modo que a resposta seja objetiva e curta.

### REGRAS DE LINGUAGEM E VOCABULÁRIO:
- PROIBIDO usar termos como: "aula 1", "aula 2", "no texto", "de acordo com o texto", "conforme o texto".
- SUBSTITUIR SEMPRE por: "nas aulas estudadas em sala", "nos textos estudados em sala", "de acordo com as aulas dadas em sala", "conforme estudado em sala".
- O enunciado deve soar como uma avaliação aplicada presencialmente, integrando o conteúdo do texto ao contexto de sala de aula.

### FORMATO DAS ALTERNATIVAS (MÚLTIPLA ESCOLHA):
- NUNCA use letras como a), b), c) ou números.
- Cada alternativa DEVE começar estritamente com o prefixo: "⭕- "

### MÚLTIPLAS VERSÕES E EMBARALHAMENTO:
- Gere versões (A, B, C) com questões embaralhadas e enunciados levemente modificados.
- **ALERTA DE SEGURANÇA**: A posição da resposta correta nas alternativas DEVE ser estritamente aleatória para cada questão e versão.
- NUNCA deixe todas as respostas corretas na mesma posição (ex: todas na primeira alternativa). 
- Distribua as respostas corretas de forma equilibrada e imprevisível entre a 1ª, 2ª, 3ª, 4ª e 5ª opções.

### FORMATO DE SAÍDA:
Retorne SEMPRE e EXCLUSIVAMENTE em formato JSON estruturado seguindo o schema.`;

      const prompt = `
Tema/Texto-base: ${content}
Quantidade de versões: ${versions}
Instituição: ${institution}
Título: ${title}
Disciplina: ${subject}
Professor: ${professor}

Esqueleto das questões:
${JSON.stringify(skeleton, null, 2)}

Gere as provas seguindo rigorosamente as regras de complexidade e extensão.`;

      console.log("Calling Gemini API with model gemini-3.6-flash...");
      
      const ai = getAIClient();
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              provas: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    versao: { type: Type.STRING },
                    questoes: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          numero: { type: Type.NUMBER },
                          tipo: { type: Type.STRING },
                          nivel: { type: Type.STRING },
                          enunciado: { type: Type.STRING },
                          alternativas: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                          }
                        },
                        required: ["numero", "tipo", "nivel", "enunciado"]
                      }
                    },
                    gabarito: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          numero: { type: Type.NUMBER },
                          resposta_correta: { type: Type.STRING },
                          resposta_esperada: { type: Type.STRING }
                        },
                        required: ["numero"]
                      }
                    }
                  },
                  required: ["versao", "questoes", "gabarito"]
                }
              }
            },
            required: ["provas"]
          }
        }
      });

      console.log("Gemini API response received.");
      
      // Sanitize JSON response (remove markdown blocks if present)
      let cleanJson = response.text || "";
      cleanJson = cleanJson.trim();
      if (cleanJson.startsWith("```")) {
        cleanJson = cleanJson.replace(/^```json\n?/, "").replace(/\n?```$/, "");
      }

      try {
        const parsed = JSON.parse(cleanJson);
        res.json(parsed);
      } catch (parseError) {
        console.error("Error parsing Gemini JSON:", parseError, "Raw text:", response.text);
        res.status(500).json({ error: "Erro ao processar resposta da IA. O formato retornado é inválido.", raw: response.text });
      }
    } catch (error: any) {
      console.error("Error generating exam:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
