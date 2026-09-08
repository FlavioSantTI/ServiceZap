import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { WorkOrderDocument, WorkOrderItem, TenantDocument } from '@/types/appwrite';

export interface GeneratePdfOptions {
  workOrder: Partial<WorkOrderDocument>;
  tenant: Partial<TenantDocument>;
}

/**
 * Constrói e retorna uma instância formatada do documento jsPDF
 */
export function buildWorkOrderPdfDocument({
  workOrder,
  tenant,
}: GeneratePdfOptions): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const isQuote = workOrder.type === 'quote';
  const docTitle = isQuote ? 'PROPOSTA DE ORÇAMENTO' : 'ORDEM DE SERVIÇO (O.S.)';
  const docNumber = workOrder.number || (isQuote ? 'ORC-0001' : 'OS-0001');

  // Cores do Design System ServiceZap (Carvão Escuro, Laranja Quente, Coral, Creme Suave)
  const primaryColor = [43, 43, 43]; // Carvão Escuro #2B2B2B
  const accentColor = [232, 98, 44]; // Laranja Quente #E8622C
  const highlightColor = [240, 128, 107]; // Coral #F0806B
  const textMuted = [107, 101, 96]; // Carvão Mudo #6B6560
  const bgLight = [250, 246, 242]; // Creme / Linho Suave #FAF6F2

  // 1. Faixa Superior Decorativa
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.rect(0, 0, 210, 6, 'F');

  // 2. Cabeçalho da Empresa Prestadora (Esquerda)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(tenant.name || 'EMPRESA PRESTADORA', 14, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  
  let currentY = 25;
  if (tenant.profession) {
    doc.text(tenant.profession, 14, currentY);
    currentY += 4.5;
  } else if (tenant.companyName) {
    doc.text(tenant.companyName, 14, currentY);
    currentY += 4.5;
  }
  if (tenant.document) {
    const isCPF = tenant.document.replace(/\D/g, '').length <= 11;
    doc.text(`${isCPF ? 'CPF' : 'CNPJ'}: ${tenant.document}`, 14, currentY);
    currentY += 4.5;
  }
  if (tenant.phone || tenant.email) {
    const contactStr = [tenant.phone ? `Tel/WhatsApp: ${tenant.phone}` : '', tenant.email ? `E-mail: ${tenant.email}` : '']
      .filter(Boolean)
      .join(' | ');
    doc.text(contactStr, 14, currentY);
    currentY += 4.5;
  }

  // 3. Bloco do Documento (Direita)
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.roundedRect(130, 14, 66, 26, 3, 3, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(130, 14, 66, 26, 3, 3, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.text(docTitle, 163, 20, { align: 'center' });

  doc.setFontSize(13);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(docNumber, 163, 27, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  const emissionDate = new Date(workOrder.$createdAt || Date.now()).toLocaleDateString('pt-BR');
  doc.text(`Emissão: ${emissionDate}`, 163, 34, { align: 'center' });

  // Linha Divisória
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, 46, 196, 46);

  // 4. Box de Informações do Cliente & Prazos
  const infoStartY = 50;

  // Box Cliente
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.roundedRect(14, infoStartY, 90, 31, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, infoStartY, 90, 31, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.text('DADOS DO CLIENTE / TOMADOR', 18, infoStartY + 5.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(workOrder.clientName || 'Cliente Avulso', 18, infoStartY + 11.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  if (workOrder.clientPhone) {
    doc.text(`WhatsApp: ${workOrder.clientPhone}`, 18, infoStartY + 17);
  }
  if (workOrder.clientEmail) {
    doc.text(`E-mail: ${workOrder.clientEmail}`, 18, infoStartY + 22);
  }
  doc.text(`Doc ID: ${workOrder.clientId || 'Avulso'}`, 18, infoStartY + 27);

  // Box Prazos & Status
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.roundedRect(106, infoStartY, 90, 31, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(106, infoStartY, 90, 31, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.text(isQuote ? 'CONDIÇÕES & VALIDADE' : 'EXECUÇÃO & VALIDADE', 110, infoStartY + 5.5);

  // Formatação das datas
  const rawDueDate = workOrder.dueDate ? new Date(workOrder.dueDate) : null;
  const dueDateStr = rawDueDate && !isNaN(rawDueDate.getTime())
    ? rawDueDate.toLocaleDateString('pt-BR')
    : '7 dias após emissão';

  const rawExecDate = workOrder.executionDate ? new Date(workOrder.executionDate) : null;
  const executionDateStr = rawExecDate && !isNaN(rawExecDate.getTime())
    ? rawExecDate.toLocaleDateString('pt-BR')
    : 'A combinar';

  // Linha 1: Validade da Proposta
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Validade da Proposta:', 110, infoStartY + 11);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.text(dueDateStr, 147, infoStartY + 11);

  // Linha 2: Previsão de Execução
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Previsão Execução:', 110, infoStartY + 16.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(executionDateStr, 147, infoStartY + 16.5);

  // Linha 3: Status
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Status:', 110, infoStartY + 22);

  const statusLabel =
    workOrder.status === 'quote_sent'
      ? 'Proposta Enviada'
      : workOrder.status === 'approved'
      ? 'Aprovado'
      : workOrder.status === 'in_execution'
      ? 'Em Execução'
      : workOrder.status === 'completed'
      ? 'Concluído'
      : workOrder.status === 'billed'
      ? 'Faturado / Quitado'
      : 'Pendente';

  doc.setFont('helvetica', 'bold');
  doc.text(statusLabel, 147, infoStartY + 22);

  // Linha 4: Moeda
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Moeda: BRL (R$ - Real)', 110, infoStartY + 27);

  // 5. Tabela de Múltiplos Serviços / Procedimentos
  let parsedItems: WorkOrderItem[] = [];
  if (workOrder.itemsJson) {
    try {
      parsedItems = JSON.parse(workOrder.itemsJson);
    } catch {
      parsedItems = [];
    }
  }

  if (parsedItems.length === 0 && workOrder.serviceName) {
    parsedItems = [
      {
        serviceName: workOrder.serviceName,
        quantity: 1,
        unitPrice: workOrder.amount || 0,
        totalPrice: workOrder.amount || 0,
      },
    ];
  }

  const tableBody = parsedItems.map((it, idx) => {
    const qty = it.quantity || 1;
    const unit = it.unit || 'un';
    const unitPrice = it.unitPrice || 0;
    const subtotal = qty * unitPrice;
    return [
      (idx + 1).toString(),
      it.serviceName,
      unit,
      qty.toString(),
      `R$ ${unitPrice.toFixed(2)}`,
      `R$ ${subtotal.toFixed(2)}`,
    ];
  });

  autoTable(doc, {
    startY: 86,
    head: [['#', 'DESCRIÇÃO DO SERVIÇO / PROCEDIMENTO', 'UNID.', 'QTD.', 'VALOR UNIT.', 'SUBTOTAL']],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [43, 43, 43], // Carvão Escuro
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 86 },
      2: { cellWidth: 16, halign: 'center' },
      3: { cellWidth: 16, halign: 'center' },
      4: { cellWidth: 27, halign: 'right' },
      5: { cellWidth: 27, halign: 'right', fontStyle: 'bold' },
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 3.5,
      textColor: [43, 43, 43],
    },
    alternateRowStyles: {
      fillColor: [253, 248, 245], // Soft Cream/Peach
    },
  });

  // Posição final da tabela
  const finalTableY = (doc as any).lastAutoTable?.finalY || 130;

  // 6. Resumo Financeiro (Totais)
  const subtotalSum = parsedItems.reduce(
    (acc, it) => acc + (it.quantity || 1) * (it.unitPrice || 0),
    0
  );
  const discountVal = workOrder.discount || 0;
  const totalVal = workOrder.amount || Math.max(0, subtotalSum - discountVal);

  const totalBoxY = finalTableY + 4;
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.roundedRect(120, totalBoxY, 76, 26, 2, 2, 'F');
  doc.setDrawColor(240, 231, 223);
  doc.roundedRect(120, totalBoxY, 76, 26, 2, 2, 'D');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Subtotal dos Serviços:', 124, totalBoxY + 6);
  doc.text(`R$ ${subtotalSum.toFixed(2)}`, 192, totalBoxY + 6, { align: 'right' });

  if (discountVal > 0) {
    doc.text('Desconto Concedido:', 124, totalBoxY + 11);
    doc.setTextColor(220, 38, 38);
    doc.text(`- R$ ${discountVal.toFixed(2)}`, 192, totalBoxY + 11, { align: 'right' });
  }

  // Linha do Total Final
  doc.setDrawColor(230, 220, 210);
  doc.line(124, totalBoxY + 14, 192, totalBoxY + 14);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('VALOR TOTAL:', 124, totalBoxY + 21);

  doc.setFontSize(12);
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.text(`R$ ${totalVal.toFixed(2)}`, 192, totalBoxY + 21, { align: 'right' });

  // 7. Observações / Condições Técnicas (Lado Esquerdo)
  let nextSectionY = Math.max(finalTableY + 34, totalBoxY + 30);

  const termsList: string[] = [
    `• Proposta comercial com validade garantida até ${dueDateStr}.`,
  ];
  if (executionDateStr && executionDateStr !== 'A combinar') {
    termsList.push(`• Previsão para conclusão/entrega dos serviços: ${executionDateStr}.`);
  }
  if (workOrder.notes) {
    termsList.push(`• ${workOrder.notes}`);
  } else if (isQuote) {
    termsList.push('• Condições comerciais sujeitas a reajuste após o vencimento da validade.');
  } else {
    termsList.push('• Execução realizada segundo especificações técnicas e padrão de qualidade.');
  }
  const notesText = termsList.join('\n');

  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.roundedRect(14, totalBoxY, 102, 26, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, totalBoxY, 102, 26, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.text(
    isQuote ? 'OBSERVAÇÕES & VALIDADE DA PROPOSTA' : 'OBSERVAÇÕES, VALIDADE & EXECUÇÃO',
    18,
    totalBoxY + 5
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  
  const splitNotes = doc.splitTextToSize(notesText, 94);
  doc.text(splitNotes.slice(0, 5), 18, totalBoxY + 10);

  // 8. Campo de Assinatura e Aprovação
  const signatureY = Math.min(nextSectionY + 14, 255);

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.4);
  doc.line(20, signatureY, 85, signatureY);
  doc.line(125, signatureY, 190, signatureY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(tenant.name || 'Prestador de Serviço', 52.5, signatureY + 4, { align: 'center' });
  doc.text(workOrder.clientName || 'Cliente / Tomador', 157.5, signatureY + 4, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Assinatura do Prestador', 52.5, signatureY + 8, { align: 'center' });
  doc.text('De Acordo / Aceite da Proposta', 157.5, signatureY + 8, { align: 'center' });

  // 9. Rodapé Informativo
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Documento gerado eletronicamente via ServiceZap • ${tenant.name || 'ServiceZap'} • ${emissionDate}`,
    105,
    285,
    { align: 'center' }
  );

  return doc;
}

/**
 * Gera o arquivo Blob do PDF
 */
export function generateWorkOrderPdfBlob(options: GeneratePdfOptions): Blob {
  const doc = buildWorkOrderPdfDocument(options);
  return doc.output('blob');
}

/**
 * Converte o PDF para um objeto File pronto para ser enviado via FormData/Baileys
 */
export function generateWorkOrderPdfFile(options: GeneratePdfOptions): File {
  const blob = generateWorkOrderPdfBlob(options);
  const isQuote = options.workOrder.type === 'quote';
  const prefix = isQuote ? 'Orcamento' : 'Ordem_de_Servico';
  const rawNum = options.workOrder.number?.replace(/[^a-zA-Z0-9_-]/g, '') || '0001';
  const fileName = `${prefix}_${rawNum}.pdf`;

  return new File([blob], fileName, { type: 'application/pdf' });
}

/**
 * Baixa o PDF diretamente no computador do usuário
 */
export function downloadWorkOrderPdf(options: GeneratePdfOptions): void {
  const doc = buildWorkOrderPdfDocument(options);
  const isQuote = options.workOrder.type === 'quote';
  const prefix = isQuote ? 'Orcamento' : 'Ordem_de_Servico';
  const rawNum = options.workOrder.number?.replace(/[^a-zA-Z0-9_-]/g, '') || '0001';
  const fileName = `${prefix}_${rawNum}.pdf`;

  doc.save(fileName);
}
