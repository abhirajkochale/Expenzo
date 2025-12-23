import * as pdfjsLib from 'pdfjs-dist';

// Import worker locally using Vite's '?url' suffix
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Set the worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`,
    });

    const pdf = await loadingTask.promise;
    
    let fullText = '';
    // FIX: Removed the 5-page limit. Now reads ALL pages.
    const maxPages = pdf.numPages; 

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