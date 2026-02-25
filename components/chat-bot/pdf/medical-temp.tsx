
import jsPDF from 'jspdf';
import { PatientProfileData } from '@/lib/firebase/service/patients/service';
import { addMedoraHeader, addSectionHeader, addFooter, MEDORA_COLORS } from '@/utils/pdf-utils';

export const generateMedicalInfoPDF = (data: PatientProfileData) => {
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
    'Medical Information', 
    'Health Records & Clinical Data',
    `${data.personalInfo.firstName} ${data.personalInfo.lastName}`
  );

  // Vital Signs Card
  pdf.setFillColor(MEDORA_COLORS.background[0], MEDORA_COLORS.background[1], MEDORA_COLORS.background[2]);
  pdf.roundedRect(margin, y, contentWidth, 25, 3, 3, 'F');
  
  pdf.setFontSize(12);
  pdf.setTextColor(MEDORA_COLORS.primary[0], MEDORA_COLORS.primary[1], MEDORA_COLORS.primary[2]);
  pdf.setFont('helvetica', 'bold');
  pdf.text('VITAL SIGNS', margin + 5, y + 7);

  pdf.setFontSize(10);
  pdf.setTextColor(MEDORA_COLORS.text.primary[0], MEDORA_COLORS.text.primary[1], MEDORA_COLORS.text.primary[2]);
  
  // Vital signs in columns
  const colWidth = contentWidth / 3;
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('Blood Type:', margin + 5, y + 16);
  pdf.text('Height:', margin + colWidth + 5, y + 16);
  pdf.text('Weight:', margin + (colWidth * 2) + 5, y + 16);

  pdf.setFont('helvetica', 'normal');
  pdf.text(data.medicalInfo.bloodType, margin + 30, y + 16);
  pdf.text(`${data.medicalInfo.height} cm`, margin + colWidth + 30, y + 16);
  pdf.text(`${data.medicalInfo.weight} kg`, margin + (colWidth * 2) + 30, y + 16);

  y += 35;

  // Allergies Section
  if (data.medicalInfo.allergies.length > 0) {
    y = addSectionHeader(pdf, y, 'Allergies', MEDORA_COLORS.error);

    data.medicalInfo.allergies.forEach((allergy, index) => {
      pdf.setFillColor(MEDORA_COLORS.error[0], MEDORA_COLORS.error[1], MEDORA_COLORS.error[2]);
      pdf.circle(margin + 3, y + (index * 5) + 2, 1, 'F');
      pdf.setFontSize(10);
      pdf.setTextColor(MEDORA_COLORS.text.primary[0], MEDORA_COLORS.text.primary[1], MEDORA_COLORS.text.primary[2]);
      pdf.text(allergy, margin + 8, y + (index * 5) + 5);
    });

    y += (data.medicalInfo.allergies.length * 5) + 10;
  } else {
    y = addSectionHeader(pdf, y, 'Allergies', MEDORA_COLORS.success);
    pdf.setFontSize(10);
    pdf.setTextColor(MEDORA_COLORS.text.secondary[0], MEDORA_COLORS.text.secondary[1], MEDORA_COLORS.text.secondary[2]);
    pdf.text('No known allergies', margin + 5, y);
    y += 10;
  }

  // Current Medications
  if (data.medicalInfo.currentMedications.length > 0) {
    y = addSectionHeader(pdf, y, 'Current Medications', MEDORA_COLORS.primary);

    const medicationsBody = data.medicalInfo.currentMedications.map(med => [
      med.name,
      med.dosage,
      med.frequency
    ]);

    pdf.autoTable({
      startY: y,
      margin: { left: margin, right: margin },
      tableWidth: contentWidth,
      head: [['Medication', 'Dosage', 'Frequency']],
      body: medicationsBody,
      headStyles: { fillColor: MEDORA_COLORS.primary, textColor: 255, fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    y = pdf.lastAutoTable.finalY + 10;
  }

  // Check if we need a new page
  if (y > 250) {
    pdf.addPage();
    y = margin;
    addMedoraHeader(pdf, 'Medical Information (Continued)', '', `${data.personalInfo.firstName} ${data.personalInfo.lastName}`);
    y += 20;
  }

  // Chronic Conditions
  if (data.medicalInfo.chronicConditions.length > 0) {
    y = addSectionHeader(pdf, y, 'Chronic Conditions', MEDORA_COLORS.warning);

    data.medicalInfo.chronicConditions.forEach((condition, index) => {
      pdf.setFillColor(MEDORA_COLORS.warning[0], MEDORA_COLORS.warning[1], MEDORA_COLORS.warning[2]);
      pdf.circle(margin + 3, y + (index * 5) + 2, 1, 'F');
      pdf.text(condition, margin + 8, y + (index * 5) + 5);
    });

    y += (data.medicalInfo.chronicConditions.length * 5) + 10;
  }

  // Past Surgeries
  if (data.medicalInfo.pastSurgeries.length > 0) {
    y = addSectionHeader(pdf, y, 'Past Surgeries', MEDORA_COLORS.secondary);

    const surgeriesBody = data.medicalInfo.pastSurgeries.map(surgery => [
      surgery.name,
      surgery.year.toString()
    ]);

    pdf.autoTable({
      startY: y,
      margin: { left: margin, right: margin },
      tableWidth: contentWidth,
      head: [['Procedure', 'Year']],
      body: surgeriesBody,
      headStyles: { fillColor: MEDORA_COLORS.secondary, textColor: 255, fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    y = pdf.lastAutoTable.finalY + 10;
  }

  // Medical Documents
  if (data.medicalInfo.documents.length > 0) {
    if (y > 250) {
      pdf.addPage();
      y = margin;
      addMedoraHeader(pdf, 'Medical Documents', '', `${data.personalInfo.firstName} ${data.personalInfo.lastName}`);
      y += 20;
    }

    y = addSectionHeader(pdf, y, 'Medical Documents', MEDORA_COLORS.success);

    const documentsBody = data.medicalInfo.documents.map(doc => [
      doc.type.replace(/-/g, ' ').toUpperCase(),
      new Date(doc.uploadedAt).toLocaleDateString()
    ]);

    pdf.autoTable({
      startY: y,
      margin: { left: margin, right: margin },
      tableWidth: contentWidth,
      head: [['Document Type', 'Uploaded Date']],
      body: documentsBody,
      headStyles: { fillColor: MEDORA_COLORS.success, textColor: 255, fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });
  }

  addFooter(pdf, pdf.internal.pages.length);

  const fileName = `Medora_Medical_Info_${data.personalInfo.lastName}_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
  
  return fileName;
};