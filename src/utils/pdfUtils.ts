import * as pdfjsLib from 'pdfjs-dist';

// Import worker locally using Vite's '?url' suffix
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Set the worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // FIX: Provide standardFontDataUrl to solve the font warning
    // We point to the unpkg CDN that matches the installed version
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`,
    });

    const pdf = await loadingTask.promise;
    
    let fullText = '';
    // Limit to 5 pages to prevent AI token overflow on large files
    const maxPages = Math.min(pdf.numPages, 5); 

    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        // @ts-ignore
        .map((item) => item.str)
        .join(' ');
        
      fullText += `\n--- PAGE ${i} ---\n${pageText}`;
    }

    if (!fullText.trim()) {
      throw new Error("PDF seems empty or is an image scan.");
    }

    return fullText;
  } catch (error: any) {
    console.error("PDF Extraction Failed:", error);
    throw new Error(`PDF Read Error: ${error.message}`);
  }
}