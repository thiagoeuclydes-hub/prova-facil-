import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  AlignmentType, 
  HeadingLevel, 
  BorderStyle, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType,
  PageBreak
} from 'docx';
import { saveAs } from 'file-saver';
import { ExamData } from '../types';

export const exportToDocx = async (examData: ExamData, institution: string, title: string, subject: string, professor: string) => {
  const sections = examData.provas.map((prova, pIdx) => {
    const children: any[] = [];

    // Header Table (Bordered box)
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1 },
                  bottom: { style: BorderStyle.SINGLE, size: 1 },
                  left: { style: BorderStyle.SINGLE, size: 1 },
                  right: { style: BorderStyle.SINGLE, size: 1 },
                },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({ text: institution, bold: true, size: 24, font: "Arial Narrow" }),
                    ],
                    spacing: { before: 0, after: 0, line: 240 },
                  }),
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({ text: title, bold: true, size: 20, font: "Arial Narrow" }),
                    ],
                    spacing: { before: 0, after: 0, line: 240 },
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: `DISCIPLINA: ${subject}`, bold: true, size: 20, font: "Arial Narrow" }),
                      new TextRun({ text: "\t" }),
                      new TextRun({ text: `PROFESSOR: ${professor}`, bold: true, size: 20, font: "Arial Narrow" }),
                    ],
                    tabStops: [{ type: "left", position: 5000 }],
                    spacing: { before: 100, after: 0, line: 240 },
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: `ALUNO: ________________________________________________`, bold: true, size: 20, font: "Arial Narrow" }),
                      new TextRun({ text: "\t" }),
                      new TextRun({ text: `DATA: ___/___/_____`, bold: true, size: 20, font: "Arial Narrow" }),
                    ],
                    tabStops: [{ type: "left", position: 6000 }],
                    spacing: { before: 0, after: 0, line: 240 },
                  }),
                ],
                margins: { top: 100, bottom: 100, left: 100, right: 100 },
              }),
            ],
          }),
        ],
      })
    );

    // Version indicator
    children.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({ text: `VERSÃO: ${prova.versao}`, bold: true, size: 16, font: "Arial Narrow" }),
        ],
        spacing: { before: 100, after: 200 },
      })
    );

    // Questions
    prova.questoes.forEach((q) => {
      // Question Statement in Bold
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${q.numero}. `, bold: true, size: 20, font: "Arial Narrow" }),
            new TextRun({ text: q.enunciado.replace(/[*_#]/g, ''), bold: true, size: 20, font: "Arial Narrow" }),
          ],
          spacing: { before: 200, after: 100, line: 240 },
        })
      );

      if (q.tipo === 'fechada' && q.alternativas) {
        q.alternativas.forEach((alt) => {
          const cleanAlt = alt.replace(/^⭕-\s*/, '').trim();
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: `⭕- ${cleanAlt}`, size: 20, font: "Arial Narrow" }),
              ],
              spacing: { before: 0, after: 0, line: 240 },
              indent: { left: 360 },
            })
          );
        });
      } else if (q.tipo === 'aberta') {
        // Answer lines (Only 1 line as requested)
        children.push(
          new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" } },
            spacing: { before: 200, after: 0, line: 240 },
            indent: { left: 360 },
          })
        );
      }
      
      // Blank line after question (10pt space)
      children.push(new Paragraph({ text: "", spacing: { after: 200 } }));
    });

    // Answer Key at the end
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `GABARITO - ${prova.versao}`, bold: true, size: 20, font: "Arial Narrow" }),
        ],
        spacing: { before: 400, after: 200, line: 240 },
      })
    );

    prova.gabarito.forEach((g) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `Questão ${g.numero}: `, bold: true, size: 20, font: "Arial Narrow" }),
            new TextRun({ text: g.resposta_correta || g.resposta_esperada || "", size: 20, font: "Arial Narrow" }),
          ],
          spacing: { before: 0, after: 0, line: 240 },
          indent: { left: 360 },
        })
      );
    });

    // Add page break after each version except the last one
    if (pIdx < examData.provas.length - 1) {
      children.push(new Paragraph({ children: [new PageBreak()] }));
    }

    return { children };
  });

  const doc = new Document({
    sections,
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${title.replace(/\s+/g, '_')}_${subject}.docx`);
};
