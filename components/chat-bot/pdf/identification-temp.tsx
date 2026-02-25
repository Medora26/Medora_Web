// lib/pdf/identification-pdf.ts
import jsPDF from 'jspdf';
import { PatientProfileData } from '@/lib/firebase/service/patients/service';
import { addMedoraHeader, addSectionHeader, addFooter, MEDORA_COLORS } from '@/utils/pdf-utils';

export const generateIdentificationPDF = (data: PatientProfileData) => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const margin = 20;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const contentWidth = pageWidth - (margin * 2);

  // Add Header
  let y = addMedoraHeader(
    pdf, 
    'Identification Documents', 
    'Government ID & Verification Records',
    `${data.personalInfo.firstName} ${data.personalInfo.lastName}`
  );

  // Primary ID Card
  pdf.setFillColor(MEDORA_COLORS.background[0], MEDORA_COLORS.background[1], MEDORA_COLORS.background[2]);
  pdf.roundedRect(margin, y, contentWidth, 35, 3, 3, 'F');
  
  pdf.setFontSize(12);
  pdf.setTextColor(MEDORA_COLORS.primary[0], MEDORA_COLORS.primary[1], MEDORA_COLORS.primary[2]);
  pdf.setFont('helvetica', 'bold');
  pdf.text('PRIMARY IDENTIFICATION', margin + 5, y + 7);

  pdf.setFontSize(10);
  pdf.setTextColor(MEDORA_COLORS.text.primary[0], MEDORA_COLORS.text.primary[1], MEDORA_COLORS.text.primary[2]);
  
  // ID details
  const leftCol = margin + 5;
  const rightCol = margin + (contentWidth / 2) + 5;
  const detailY = y + 16;

  // Left column
  pdf.setFont('helvetica', 'bold');
  pdf.text('ID Type:', leftCol, detailY);
  pdf.text('ID Number:', leftCol, detailY + 8);
  
  pdf.setFont('helvetica', 'normal');
  pdf.text(data.identification.type.replace('-', ' ').toUpperCase(), leftCol + 30, detailY);
  pdf.text(data.identification.number, leftCol + 30, detailY + 8);

  // Right column
  pdf.setFont('helvetica', 'bold');
  pdf.text('Issue Date:', rightCol, detailY);
  pdf.text('Expiry Date:', rightCol, detailY + 8);

  pdf.setFont('helvetica', 'normal');
  pdf.text(new Date(data.identification.issueDate).toLocaleDateString(), rightCol + 30, detailY);
  pdf.text(new Date(data.identification.expiryDate).toLocaleDateString(), rightCol + 30, detailY + 8);

  y += 45;

  // ID Documents
  if (data.identification.documents.length > 0) {
    y = addSectionHeader(pdf, y, 'Uploaded ID Documents', MEDORA_COLORS.success);

    const documentsBody = data.identification.documents.map(doc => [
      doc.type.replace(/-/g, ' ').toUpperCase(),
      doc.number || 'N/A',
      new Date(doc.uploadedAt).toLocaleDateString()
    ]);

    pdf.autoTable({
      startY: y,
      margin: { left: margin, right: margin },
      tableWidth: contentWidth,
      head: [['Document Type', 'Document Number', 'Uploaded Date']],
      body: documentsBody,
      headStyles: { fillColor: MEDORA_COLORS.success, textColor: 255, fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    y = pdf.lastAutoTable.finalY + 10;
  }

  // Verification Status
  if (y > 250) {
    pdf.addPage();
    y = margin;
    addMedoraHeader(pdf, 'Identification (Continued)', '', `${data.personalInfo.firstName} ${data.personalInfo.lastName}`);
    y += 20;
  }

  y = addSectionHeader(pdf, y, 'Verification Status', MEDORA_COLORS.warning);

  pdf.setFillColor(232, 245, 233);
  pdf.roundedRect(margin, y, contentWidth, 15, 2, 2, 'F');
  
  pdf.setFontSize(10);
  pdf.setTextColor(MEDORA_COLORS.success[0], MEDORA_COLORS.success[1], MEDORA_COLORS.success[2]);
  pdf.setFont('helvetica', 'bold');
  pdf.text('✓ VERIFIED', margin + 5, y + 10);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(MEDORA_COLORS.text.secondary[0], MEDORA_COLORS.text.secondary[1], MEDORA_COLORS.text.secondary[2]);
  pdf.text('Identity documents have been verified in our system.', margin + 35, y + 10);

  y += 25;

  // Security Notice
  pdf.setFillColor(255, 235, 238);
  pdf.roundedRect(margin, y, contentWidth, 20, 2, 2, 'F');
  
  pdf.setFontSize(9);
  pdf.setTextColor(MEDORA_COLORS.error[0], MEDORA_COLORS.error[1], MEDORA_COLORS.error[2]);
  pdf.setFont('helvetica', 'bold');
  pdf.text('SECURITY NOTICE:', margin + 5, y + 7);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(MEDORA_COLORS.text.secondary[0], MEDORA_COLORS.text.secondary[1], MEDORA_COLORS.text.secondary[2]);
  pdf.text('This document contains sensitive personal information.', margin + 35, y + 7);
  pdf.text('Handle with care and store securely.', margin + 5, y + 14);

  addFooter(pdf, pdf.internal.pages.length);

  const fileName = `Medora_Identification_${data.personalInfo.lastName}_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
  
  return fileName;
};