import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Exports HTML content to PDF as a single continuous page
 * @param htmlContent - The HTML string to convert to PDF
 * @param filename - The name of the PDF file (without .pdf extension)
 * @param onProgress - Optional callback to report progress
 */
export async function exportHtmlToPdf(
  htmlContent: string, 
  filename: string = 'proposal',
  onProgress?: (message: string) => void
): Promise<void> {
  try {
    onProgress?.('Preparando contenido...');
    
    // Create a temporary container for the HTML
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '210mm'; // A4 width in mm
    container.style.backgroundColor = '#ffffff';
    container.innerHTML = htmlContent;
    document.body.appendChild(container);

    // Wait for images and fonts to load
    onProgress?.('Cargando imágenes y fuentes...');
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Convert HTML to canvas with all content (this can take a while)
    onProgress?.('Generando imagen...');
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      width: container.scrollWidth,
      height: container.scrollHeight,
      backgroundColor: '#ffffff',
      windowWidth: container.scrollWidth,
      windowHeight: container.scrollHeight,
    });

    // Remove the temporary container
    document.body.removeChild(container);

    onProgress?.('Creando PDF...');
    
    // Calculate dimensions in mm
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width; // Maintain aspect ratio

    // Create PDF with custom dimensions (single page, very tall)
    // Use a maximum reasonable height, if content is taller, we'll scale it down
    const maxHeight = 5000; // Maximum height in mm (very tall single page)
    let finalImgWidth = imgWidth;
    let finalImgHeight = imgHeight;

    // If content is taller than maxHeight, scale it down proportionally
    if (imgHeight > maxHeight) {
      const scale = maxHeight / imgHeight;
      finalImgHeight = maxHeight;
      finalImgWidth = imgWidth * scale;
    }

    // Create PDF with custom dimensions
    const pdf = new jsPDF({
      orientation: imgHeight > imgWidth ? 'portrait' : 'landscape',
      unit: 'mm',
      format: [finalImgWidth, finalImgHeight],
    });

    // Add the entire image to a single page
    pdf.addImage(
      canvas.toDataURL('image/png', 1.0),
      'PNG',
      0,
      0,
      finalImgWidth,
      finalImgHeight,
      undefined,
      'FAST'
    );

    // Save the PDF
    onProgress?.('Finalizando...');
    pdf.save(`${filename}.pdf`);
    
    onProgress?.('Completado');
  } catch (error) {
    console.error('Error exporting HTML to PDF:', error);
    throw new Error('Error al exportar el PDF. Por favor, intenta nuevamente.');
  }
}

