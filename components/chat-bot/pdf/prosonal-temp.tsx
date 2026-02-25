
import jsPDF from 'jspdf';
import { addMedoraHeader, addSectionHeader, addFooter, MEDORA_COLORS } from '@/utils/pdf-utils';
import { PatientProfileData } from '@/lib/firebase/service/patients/service';

export const generatePersonalInfoPDF = (data: PatientProfileData) => {
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
    'Personal Information', 
    'Demographics & Emergency Contacts',
    `${data.personalInfo.firstName} ${data.personalInfo.lastName}`
  );

  // Patient Details Card
  pdf.setFillColor(MEDORA_COLORS.background[0], MEDORA_COLORS.background[1], MEDORA_COLORS.background[2]);
  pdf.roundedRect(margin, y, contentWidth, 35, 3, 3, 'F');
  
  pdf.setFontSize(12);
  pdf.setTextColor(MEDORA_COLORS.primary[0], MEDORA_COLORS.primary[1], MEDORA_COLORS.primary[2]);
  pdf.setFont('helvetica', 'bold');
  pdf.text('PATIENT DETAILS', margin + 5, y + 7);

  pdf.setFontSize(10);
  pdf.setTextColor(MEDORA_COLORS.text.primary[0], MEDORA_COLORS.text.primary[1], MEDORA_COLORS.text.primary[2]);
  
  // Two column layout
  const leftCol = margin + 5;
  const rightCol = margin + (contentWidth / 2) + 5;
  const detailY = y + 14;

  // Left column
  pdf.setFont('helvetica', 'bold');
  pdf.text('First Name:', leftCol, detailY);
  pdf.text('Last Name:', leftCol, detailY + 7);
  pdf.text('Date of Birth:', leftCol, detailY + 14);
  pdf.text('Gender:', leftCol, detailY + 21);

  pdf.setFont('helvetica', 'normal');
  pdf.text(data.personalInfo.firstName, leftCol + 30, detailY);
  pdf.text(data.personalInfo.lastName, leftCol + 30, detailY + 7);
  pdf.text(new Date(data.personalInfo.dateOfBirth).toLocaleDateString(), leftCol + 30, detailY + 14);
  pdf.text(data.personalInfo.gender.replace('-', ' ').toUpperCase(), leftCol + 30, detailY + 21);

  // Right column
  pdf.setFont('helvetica', 'bold');
  pdf.text('Phone:', rightCol, detailY);
  pdf.text('Email:', rightCol, detailY + 7);

  pdf.setFont('helvetica', 'normal');
  pdf.text(data.personalInfo.phoneNumber, rightCol + 25, detailY);
  pdf.text(data.email, rightCol + 25, detailY + 7);

  y += 45;

  // Emergency Contact Section
  y = addSectionHeader(pdf, y, 'Emergency Contact', MEDORA_COLORS.warning);

  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(margin, y, contentWidth, 25, 2, 2, 'F');
  
  pdf.setFontSize(10);
  pdf.setTextColor(MEDORA_COLORS.text.primary[0], MEDORA_COLORS.text.primary[1], MEDORA_COLORS.text.primary[2]);
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('Name:', margin + 5, y + 7);
  pdf.text('Relationship:', margin + 5, y + 14);
  pdf.text('Phone:', margin + 5, y + 21);

  pdf.setFont('helvetica', 'normal');
  pdf.text(data.personalInfo.emergencyContact.name, margin + 30, y + 7);
  pdf.text(data.personalInfo.emergencyContact.relationship, margin + 30, y + 14);
  pdf.text(data.personalInfo.emergencyContact.phoneNumber, margin + 30, y + 21);

  y += 35;

  // Documents Section
  if (data.personalInfo.documents.length > 0) {
    y = addSectionHeader(pdf, y, 'Uploaded Documents', MEDORA_COLORS.success);

    const documentsBody = data.personalInfo.documents.map(doc => [
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

  addFooter(pdf, 1);

  // Save PDF
  const fileName = `Medora_Personal_Info_${data.personalInfo.lastName}_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
  
  return fileName;
};