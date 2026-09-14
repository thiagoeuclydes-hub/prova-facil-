import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Plus, 
  Trash2, 
  FileText, 
  Cpu, 
  Layers, 
  User, 
  School, 
  BookOpen, 
  ChevronRight, 
  Printer, 
  RefreshCcw,
  Loader2,
  CheckCircle2,
  Copy,
  Check,
  Wrench,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QuestionSkeleton, QuestionLevel, QuestionType, ExamData, Prova } from './types';
import { exportToDocx } from './lib/exportDocx';
import Login from './components/Login';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [examData, setExamData] = useState<ExamData | null>(null);
  
  // Form State
  const [institution, setInstitution] = useState('Colégio Modelo');
  const [title, setTitle] = useState('Avaliação Trimestral');
  const [subject, setSubject] = useState('História');
  const [professor, setProfessor] = useState('Prof. Carlos Alberto');
  const [content, setContent] = useState('');
  const [skeleton, setSkeleton] = useState<QuestionSkeleton[]>([]);
  const [versions, setVersions] = useState(1);

  // New Question Builder State
  const [newType, setNewType] = useState<QuestionType>('fechada');
  const [newLevel, setNewLevel] = useState<QuestionLevel>('Médio');
  const [newOptionsCount, setNewOptionsCount] = useState(4);

  const addQuestion = () => {
    const id = crypto.randomUUID();
    setSkeleton([...skeleton, { id, tipo: newType, nivel: newLevel, opcoesCount: newType === 'fechada' ? newOptionsCount : undefined }]);
  };

  const removeQuestion = (id: string) => {
    setSkeleton(skeleton.filter(q => q.id !== id));
  };

  const clearSkeleton = () => setSkeleton([]);

  const generateExam = async () => {
    if (!content || skeleton.length === 0) {
      alert('Por favor, insira um tema/conteúdo e adicione pelo menos uma questão ao esqueleto.');
      return;
    }

    console.log("Starting exam generation with:", { institution, title, subject, skeletonLength: skeleton.length });
    setLoading(true);
    setExamData(null);

    try {
      // Quick health check to see if server is alive
      console.log("Testing API connection...");
      const healthCheck = await fetch('/api/health').catch(() => null);
      if (!healthCheck || !healthCheck.ok) {
        throw new Error('O servidor de API não está respondendo. Verifique se o servidor foi iniciado corretamente.');
      }
      const healthData = await healthCheck.json();
      if (!healthData.hasKey) {
        throw new Error('Chave API (GEMINI_API_KEY) não encontrada. Vá em Settings > Secrets e adicione sua chave.');
      }
      console.log("API connection OK");

      console.log("Sending request to /api/generate-exam...");
      const response = await fetch('/api/generate-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institution,
          title,
          subject,
          professor,
          content,
          skeleton,
          versions
        }),
      });

      console.log("Response received from API:", response.status);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API error data:", errorData);
        throw new Error(errorData.error || 'Falha ao gerar prova na IA');
      }
      const data = await response.json();
      console.log("Exam data parsed:", data);
      setExamData(data);
    } catch (error: any) {
      console.error("Catch error in generateExam:", error);
      alert(`Erro ao gerar prova: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FC] text-[#2D3748] font-sans selection:bg-indigo-100">
      {/* Header Bar */}
      <header className="bg-indigo-600 text-white p-4 shadow-lg sticky top-0 z-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">ELABORAÇÃO INTELIGENTE</h1>
            <p className="text-[10px] uppercase tracking-widest opacity-80 font-semibold">Motor IA Integrado • Versão Acadêmica</p>
          </div>
        </div>
        <div className="hidden md:block">
          <span className="text-sm font-medium opacity-90">SISTEMA DE ELABORAÇÃO ACADÊMICA</span>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Config */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Section 1: Identification */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center gap-2">
              <School className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">1. Identificação / Cabeçalho</h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">Instituição / Escola</label>
                <input 
                  type="text" 
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                  placeholder="Ex: Colégio Modelo"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">Título da Avaliação</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                  placeholder="Ex: Avaliação Trimestral"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">Disciplina</label>
                  <input 
                    type="text" 
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                    placeholder="Ex: História"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">Professor(a)</label>
                  <input 
                    type="text" 
                    value={professor}
                    onChange={(e) => setProfessor(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                    placeholder="Ex: Prof. Carlos Alberto"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Content */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">2. Conteúdo / Tema</h2>
            </div>
            <div className="p-5">
              <p className="text-[10px] text-slate-400 italic mb-2">Cole o texto-base ou digite o assunto principal para a IA.</p>
              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-40 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none"
                placeholder="Ex: O Império Romano começou com a ascensão de Augusto..."
              />
            </div>
          </section>

          {/* Section 3: Question Builder */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">3. Esqueleto das Questões</h2>
              </div>
              <button onClick={clearSkeleton} className="text-[10px] font-bold text-rose-500 hover:text-rose-600 uppercase tracking-wider transition-colors">Limpar</button>
            </div>
            <div className="p-5 space-y-6">
              <div className="flex flex-col gap-3">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Modelos Rápidos</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => {
                      const newQuestions: QuestionSkeleton[] = Array(5).fill(null).map(() => ({
                        id: crypto.randomUUID(),
                        tipo: 'fechada',
                        nivel: 'Médio',
                        opcoesCount: 4
                      }));
                      setSkeleton(newQuestions);
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 py-2 rounded-lg text-[10px] font-bold uppercase transition-all"
                  >
                    5 Médias
                  </button>
                  <button 
                    onClick={() => {
                      const newQuestions: QuestionSkeleton[] = [
                        { id: crypto.randomUUID(), tipo: 'fechada', nivel: 'Fácil', opcoesCount: 4 },
                        { id: crypto.randomUUID(), tipo: 'fechada', nivel: 'Fácil', opcoesCount: 4 },
                        { id: crypto.randomUUID(), tipo: 'fechada', nivel: 'Médio', opcoesCount: 4 },
                        { id: crypto.randomUUID(), tipo: 'fechada', nivel: 'Médio', opcoesCount: 4 },
                        { id: crypto.randomUUID(), tipo: 'aberta', nivel: 'Médio' },
                        { id: crypto.randomUUID(), tipo: 'aberta', nivel: 'Difícil' },
                      ];
                      setSkeleton(newQuestions);
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 py-2 rounded-lg text-[10px] font-bold uppercase transition-all"
                  >
                    Mista (6Q)
                  </button>
                </div>
              </div>

              <div className="h-px bg-slate-100 mx-[-20px]"></div>

              <div className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-4">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 text-center">Tipo</label>
                  <select 
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as QuestionType)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  >
                    <option value="fechada">Fechada</option>
                    <option value="aberta">Aberta</option>
                  </select>
                </div>
                <div className={newType === 'fechada' ? 'col-span-5' : 'col-span-8'}>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 text-center">Dificuldade</label>
                  <select 
                    value={newLevel}
                    onChange={(e) => setNewLevel(e.target.value as QuestionLevel)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  >
                    <option value="Fácil">Fácil</option>
                    <option value="Intermediário">Intermediário</option>
                    <option value="Médio">Médio</option>
                    <option value="Difícil">Difícil</option>
                    <option value="Universitário">Superior</option>
                    <option value="Concurso">Concurso</option>
                    <option value="Mestrado/Doutorado">Pós/Mestr.</option>
                  </select>
                </div>
                {newType === 'fechada' && (
                  <div className="col-span-3">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 text-center">Opções</label>
                    <select 
                      value={newOptionsCount}
                      onChange={(e) => setNewOptionsCount(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    >
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                      <option value={4}>4</option>
                      <option value={5}>5</option>
                    </select>
                  </div>
                )}
              </div>

              <button 
                onClick={addQuestion}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-md active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                Adicionar Questão
              </button>
            </div>
          </section>

          {/* Section 4: Versions */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-5">
             <div className="flex items-center gap-2 mb-4">
              <RefreshCcw className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">4. Versões da Prova</h2>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[1, 2, 3].map(v => (
                <button
                  key={v}
                  onClick={() => setVersions(v)}
                  className={`py-2 rounded-lg text-xs font-bold transition-all border ${
                    versions === v 
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                    : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  {v} Versão{v > 1 ? 'ões' : ''}
                </button>
              ))}
            </div>
            
            <button 
              onClick={generateExam}
              disabled={loading || skeleton.length === 0}
              className={`w-full py-4 rounded-xl font-bold text-sm uppercase tracking-[0.1em] flex items-center justify-center gap-3 transition-all shadow-lg active:scale-[0.98] ${
                loading || skeleton.length === 0 
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:from-indigo-700 hover:to-blue-700 shadow-indigo-200 hover:shadow-indigo-300'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Calibrando Questões...
                </>
              ) : (
                <>
                  <Cpu className="w-5 h-5" />
                  Gerar Prova com IA
                </>
              )}
            </button>
          </section>

        </div>

        {/* Right Column: List & Result */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Skeleton List View */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[300px] flex flex-col">
            <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">Esqueleto Selecionado</h2>
              <span className="bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full text-[10px] font-black">{skeleton.length} Questões</span>
            </div>
            <div className="p-4 flex-1 overflow-y-auto max-h-[400px] space-y-2 custom-scrollbar">
              <AnimatePresence initial={false}>
                {skeleton.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                    <FileText className="w-12 h-12 opacity-10 mb-3" />
                    <p className="text-xs font-medium opacity-60">Nenhuma questão adicionada ao esqueleto.</p>
                  </div>
                ) : (
                  skeleton.map((q, idx) => (
                    <motion.div
                      key={q.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="group flex items-center gap-4 bg-slate-50 hover:bg-slate-100/80 p-3 rounded-lg border border-slate-200 transition-all"
                    >
                      <span className="text-[10px] font-black text-slate-300 w-6">#{idx + 1}</span>
                      <div className="flex-1 grid grid-cols-3 gap-2">
                        <div className="bg-white border border-slate-200 rounded px-2 py-1 text-[10px] font-bold text-slate-600 truncate">{q.tipo.toUpperCase()}</div>
                        <div className="bg-white border border-slate-200 rounded px-2 py-1 text-[10px] font-bold text-slate-600 truncate">{q.nivel}</div>
                        <div className="bg-white border border-slate-200 rounded px-2 py-1 text-[10px] font-bold text-slate-400 italic">
                          {q.tipo === 'fechada' ? `${q.opcoesCount} Opções` : 'Discursiva'}
                        </div>
                      </div>
                      <button 
                        onClick={() => removeQuestion(q.id)}
                        className="text-slate-400 hover:text-rose-500 p-1.5 rounded-md hover:bg-rose-50 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Generated Result View */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col relative print:shadow-none print:border-0">
            <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">Visualização da Prova</h2>
                {examData && (
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(examData, null, 2));
                      alert('JSON copiado para a área de transferência!');
                    }}
                    className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                    title="Copiar JSON"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {examData && (
                  <>
                    <button 
                      onClick={() => exportToDocx(examData, institution, title, subject, professor)}
                      className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                      Exportar Word
                    </button>
                    <button 
                      onClick={handlePrint}
                      className="bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
                    >
                      <Printer className="w-4 h-4" />
                      Imprimir / PDF
                    </button>
                  </>
                )}
              </div>
            </div>
            
            <div className="p-8 flex-1 bg-slate-50/30 overflow-y-auto custom-scrollbar print:p-0 print:bg-white print:overflow-visible exam-preview-container">
              <AnimatePresence mode="wait">
                {!examData ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full flex flex-col items-center justify-center text-center p-12"
                  >
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
                      <FileText className="w-12 h-12 text-slate-200" />
                    </div>
                    <h3 className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-2">Nenhuma Prova Gerada</h3>
                    <p className="text-slate-400 text-xs max-w-xs mx-auto leading-relaxed">
                      Monte o esqueleto à esquerda e clique em gerar para visualizar o resultado aqui.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {examData.provas.map((prova, pIdx) => (
                      <div key={pIdx} className="exam-page shadow-2xl print:shadow-none">
                        {/* Exam Header */}
                        <div className="exam-header-box">
                          <div className="flex justify-between items-start mb-4">
                             <div className="flex-1 text-center">
                                <h3 className="text-sm font-bold uppercase mb-1">{institution}</h3>
                                <h4 className="text-xs font-bold">{title}</h4>
                             </div>
                             <div className="bg-slate-800 text-white px-2 py-1 text-[10px] font-bold rounded uppercase ml-4">{prova.versao}</div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-y-2 text-[10pt] font-bold border-t border-slate-300 pt-4 uppercase">
                            <div className="flex gap-2">
                              <span>DISCIPLINA:</span>
                              <span className="font-normal">{subject}</span>
                            </div>
                            <div className="flex gap-2">
                              <span>PROFESSOR:</span>
                              <span className="font-normal">{professor}</span>
                            </div>
                            <div className="flex gap-2 col-span-2">
                              <span>ALUNO:</span>
                              <span className="flex-1 font-normal">________________________________________________</span>
                            </div>
                            <div className="flex gap-2">
                              <span>DATA:</span>
                              <span className="font-normal">___/___/_____</span>
                            </div>
                          </div>
                        </div>

                        {/* Questions */}
                        <div className="space-y-0">
                          {prova.questoes.map((q) => (
                            <div key={q.numero} className="exam-question">
                              <div className="exam-question-text">
                                {q.numero}. <ReactMarkdown components={{ p: ({ children }) => <span>{children}</span> }}>{q.enunciado}</ReactMarkdown>
                              </div>
                              
                              {q.tipo === 'fechada' && q.alternativas && (
                                <div className="exam-alternatives">
                                  {q.alternativas.map((alt, aIdx) => (
                                    <div key={aIdx} className="exam-alternative-item">
                                      <span>{alt.startsWith('⭕- ') ? alt : `⭕- ${alt}`}</span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {q.tipo === 'aberta' && (
                                <div className="space-y-0">
                                  <div className="exam-open-lines"></div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Answer Key */}
                        <div className="mt-10 pt-4 border-t border-slate-300 print:break-before-page">
                          <h4 className="text-[10pt] font-bold uppercase mb-4">GABARITO - {prova.versao}</h4>
                          <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                            {prova.gabarito.map((g) => (
                              <div key={g.numero} className="flex gap-2 text-[10pt]">
                                <span className="font-bold">Questão {g.numero}:</span>
                                <span className="font-normal">
                                  {g.resposta_correta?.replace('⭕- ', '') || g.resposta_esperada}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@400;700&display=swap');
        
        .exam-preview-container {
          font-family: 'Arial Narrow', 'Roboto Condensed', sans-serif !important;
          font-size: 10pt !important;
          line-height: 1.0 !important;
          color: black !important;
        }

        .exam-page {
          background: white !important;
          padding: 1cm !important;
          margin: 0 auto !important;
          width: 210mm;
          min-height: 297mm;
          box-sizing: border-box;
          color: black !important;
        }

        .exam-header-box {
          border: 1pt solid black !important;
          padding: 10pt !important;
          margin-bottom: 20pt !important;
          width: 100%;
        }

        .exam-question {
          margin-top: 0 !important;
          margin-bottom: 10pt !important;
          padding: 0 !important;
        }

        .exam-question-text {
          font-weight: bold !important;
          margin-bottom: 5pt !important;
          display: block;
        }

        .exam-alternatives {
          margin-left: 20pt !important;
          margin-bottom: 10pt !important;
        }

        .exam-alternative-item {
          margin-bottom: 2pt !important;
          display: flex;
          align-items: flex-start;
          gap: 5pt;
        }

        .exam-open-lines {
          margin-left: 20pt !important;
          border-bottom: 1px solid #000;
          height: 20pt;
          margin-bottom: 10pt;
          width: 90%;
        }

        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body { 
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .print\\:hidden { display: none !important; }
          header { display: none !important; }
          main { display: block !important; padding: 0 !important; max-width: none !important; margin: 0 !important; }
          .lg\\:grid-cols-12 { display: block !important; }
          .lg\\:col-span-5 { display: none !important; }
          .lg\\:col-span-7 { width: 100% !important; margin: 0 !important; padding: 0 !important; }
          .bg-slate-50\\/30 { background: white !important; }
          .p-8 { padding: 0 !important; }
          .exam-page {
            box-shadow: none !important;
            border: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 1.5cm !important;
            page-break-after: always !important;
          }
          .custom-scrollbar::-webkit-scrollbar { display: none; }
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E2E8F0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #CBD5E0;
        }
      `}} />
    </div>
  );
}
