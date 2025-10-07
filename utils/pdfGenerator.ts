// Dynamic imports will be used to ensure client-side only execution

interface PDFGenerationOptions {
  filename?: string;
  quality?: number;
  scale?: number;
}

export const generatePDFFromElement = async (
  elementId: string,
  options: PDFGenerationOptions = {}
): Promise<void> => {
  const {
    filename = 'simulation-insights.pdf',
    quality = 0.98,
    scale = 2
  } = options;

  try {
    // Dynamic imports to ensure client-side only execution
    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
      import('jspdf'),
      import('html2canvas')
    ]);

    // Get the element to capture
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with id "${elementId}" not found`);
    }

    // Create canvas from the element
    const canvas = await html2canvas(element, {
      scale: scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: element.scrollWidth,
      height: element.scrollHeight,
    });

    // Calculate PDF dimensions
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const pdfWidth = 210; // A4 width in mm
    const pdfHeight = (imgHeight * pdfWidth) / imgWidth;

    // Create PDF
    const pdf = new jsPDF({
      orientation: pdfHeight > 297 ? 'portrait' : 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Add image to PDF
    const imgData = canvas.toDataURL('image/png', quality);
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    // Save the PDF
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  }
};

export const generatePDFFromPage = async (
  options: PDFGenerationOptions = {}
): Promise<void> => {
  const {
    filename = 'simulation-insights.pdf',
    quality = 0.98,
    scale = 1.5
  } = options;

  try {
    // Dynamic imports to ensure client-side only execution
    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
      import('jspdf'),
      import('html2canvas')
    ]);

    // Get the main content area
    const mainContent = document.querySelector('.container') as HTMLElement;
    if (!mainContent) {
      throw new Error('Main content area not found');
    }

    // Wait longer to ensure all content is loaded and rendered
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Force a reflow to ensure all content is rendered
    mainContent.offsetHeight;

    // Get the full height of the content including any overflow
    const fullHeight = Math.max(
      mainContent.scrollHeight,
      mainContent.offsetHeight,
      document.documentElement.scrollHeight,
      document.body.scrollHeight,
      document.body.offsetHeight
    );

    // Add extra padding to ensure we don't cut off content
    const paddedHeight = fullHeight + 200;
    
    console.log('PDF Generation Debug:', {
      scrollHeight: mainContent.scrollHeight,
      offsetHeight: mainContent.offsetHeight,
      documentScrollHeight: document.documentElement.scrollHeight,
      bodyScrollHeight: document.body.scrollHeight,
      bodyOffsetHeight: document.body.offsetHeight,
      fullHeight,
      paddedHeight
    });

    // Create canvas from the page content
    const canvas = await html2canvas(mainContent, {
      scale: scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: mainContent.scrollWidth,
      height: paddedHeight,
      scrollX: 0,
      scrollY: 0,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
    });

    // PDF dimensions
    const pdfWidth = 210; // A4 width in mm
    const pdfHeight = 297; // A4 height in mm
    const margin = 10; // margin in mm
    const contentWidth = pdfWidth - (2 * margin);
    const contentHeight = pdfHeight - (2 * margin);

    // Calculate image dimensions to fit content width
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const imgAspectRatio = imgWidth / imgHeight;
    
    // Scale image to fit content width
    const scaledWidth = contentWidth;
    const scaledHeight = contentWidth / imgAspectRatio;

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Calculate number of pages needed
    const pagesNeeded = Math.ceil(scaledHeight / contentHeight);

    // Add image to PDF across multiple pages
    for (let page = 0; page < pagesNeeded; page++) {
      if (page > 0) {
        pdf.addPage();
      }

      // Calculate the portion of the image to show on this page
      const yOffset = page * contentHeight;
      const remainingHeight = scaledHeight - yOffset;
      const pageHeight = Math.min(contentHeight, remainingHeight);

      // Calculate the source position in the original image
      const sourceY = (yOffset / scaledHeight) * imgHeight;
      const sourceHeight = (pageHeight / scaledHeight) * imgHeight;

      // Create a temporary canvas for this page's portion
      const pageCanvas = document.createElement('canvas');
      const pageCtx = pageCanvas.getContext('2d');
      pageCanvas.width = imgWidth;
      pageCanvas.height = sourceHeight;

      if (pageCtx) {
        // Draw the portion of the image for this page
        pageCtx.drawImage(
          canvas,
          0, sourceY, imgWidth, sourceHeight,
          0, 0, imgWidth, sourceHeight
        );

        // Add this page's portion to the PDF
        const pageImgData = pageCanvas.toDataURL('image/png', quality);
        pdf.addImage(
          pageImgData,
          'PNG',
          margin,
          margin,
          scaledWidth,
          pageHeight
        );
      }
    }

    // Save the PDF
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  }
};

export const generateStructuredPDF = async (
  options: PDFGenerationOptions = {}
): Promise<void> => {
  const {
    filename = 'simulation-insights.pdf',
    quality = 0.98,
    scale = 1.5
  } = options;

  try {
    // Dynamic imports to ensure client-side only execution
    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
      import('jspdf'),
      import('html2canvas')
    ]);

    // Get the main content area - try multiple selectors to ensure we capture everything
    let mainContent = document.querySelector('.container') as HTMLElement;
    if (!mainContent) {
      mainContent = document.querySelector('main') as HTMLElement;
    }
    if (!mainContent) {
      mainContent = document.querySelector('[data-testid="insights-content"]') as HTMLElement;
    }
    if (!mainContent) {
      // Fallback to the entire body if no specific container is found
      mainContent = document.body;
    }

    // PDF dimensions
    const pdfWidth = 210; // A4 width in mm
    const pdfHeight = 297; // A4 height in mm
    const margin = 15; // margin in mm
    const contentWidth = pdfWidth - (2 * margin);
    const contentHeight = pdfHeight - (2 * margin);

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Wait longer to ensure all content is loaded and rendered
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Force a reflow to ensure all content is rendered
    mainContent.offsetHeight;

    // Get the full height of the content including any overflow
    const fullHeight = Math.max(
      mainContent.scrollHeight,
      mainContent.offsetHeight,
      document.documentElement.scrollHeight,
      document.body.scrollHeight,
      document.body.offsetHeight
    );

    // Add extra padding to ensure we don't cut off content
    const paddedHeight = fullHeight + 200;

    // Capture the entire content as one image
    const canvas = await html2canvas(mainContent, {
      scale: scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: mainContent.scrollWidth,
      height: paddedHeight,
      scrollX: 0,
      scrollY: 0,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
    });

    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const imgAspectRatio = imgWidth / imgHeight;
    
    // Scale image to fit content width
    const scaledWidth = contentWidth;
    const scaledHeight = contentWidth / imgAspectRatio;

    // Calculate number of pages needed
    const pagesNeeded = Math.ceil(scaledHeight / contentHeight);

    // Add image to PDF across multiple pages
    for (let page = 0; page < pagesNeeded; page++) {
      if (page > 0) {
        pdf.addPage();
      }

      // Calculate the portion of the image to show on this page
      const yOffset = page * contentHeight;
      const remainingHeight = scaledHeight - yOffset;
      const pageHeight = Math.min(contentHeight, remainingHeight);

      // Calculate the source position in the original image
      const sourceY = (yOffset / scaledHeight) * imgHeight;
      const sourceHeight = (pageHeight / scaledHeight) * imgHeight;

      // Create a temporary canvas for this page's portion
      const pageCanvas = document.createElement('canvas');
      const pageCtx = pageCanvas.getContext('2d');
      pageCanvas.width = imgWidth;
      pageCanvas.height = sourceHeight;

      if (pageCtx) {
        // Draw the portion of the image for this page
        pageCtx.drawImage(
          canvas,
          0, sourceY, imgWidth, sourceHeight,
          0, 0, imgWidth, sourceHeight
        );

        // Add this page's portion to the PDF
        const pageImgData = pageCanvas.toDataURL('image/png', quality);
        pdf.addImage(
          pageImgData,
          'PNG',
          margin,
          margin,
          scaledWidth,
          pageHeight
        );
      }
    }

    // Save the PDF
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  }
};
