const { PDFDocument } = require('pdf-lib');
const pdfParse = require('pdf-parse');
const fs = require('fs').promises;
const path = require('path');

/**
 * Manually creates separate PDFs for specific question numbers
 * This approach is tailored for CS homework PDFs with standard numbered questions
 * @param {Buffer} pdfBuffer - The PDF file buffer
 * @param {string} originalFilename - Original filename
 * @returns {Promise<Array<{buffer: Buffer, filename: string}>>} Array of split PDFs
 */
async function splitPDFIntoQuestions(pdfBuffer, originalFilename) {
    try {
        // Validate input
        if (!pdfBuffer || !Buffer.isBuffer(pdfBuffer)) {
            throw new Error('Invalid PDF buffer provided');
        }
        
        console.log('PDF Buffer size:', pdfBuffer.length);
        
        // Extract text for question identification
        const pdfData = await pdfParse(pdfBuffer);
        console.log('PDF parsed successfully. Pages:', pdfData.numpages);
        
        // Extract text and look for question patterns
        const text = pdfData.text;
        console.log('Text extraction completed, looking for question patterns');
        
        // Find numbered questions - try multiple patterns to be more robust
        // This pattern looks for numbered questions like "1.", "2.", etc.
        const mainPattern = /(?:^|\n)\s*(\d+)[\.\)]\s+/g;
        let match;
        const questions = [];
        
        // First pass - find all matches using our pattern
        while ((match = mainPattern.exec(text)) !== null) {
            const questionNumber = parseInt(match[1]);
            questions.push({
                number: questionNumber,
                startIndex: match.index,
                text: text.substring(match.index, match.index + 150) // Get a snippet for debugging
            });
            console.log(`Found question ${questionNumber} at position ${match.index}`);
        }
        
        // If we failed to find questions using the main pattern, try a fallback
        if (questions.length === 0) {
            // Alternative pattern that's more lenient
            const fallbackPattern = /(\d+)[\.\)]\s+[A-Z]/g;
            while ((match = fallbackPattern.exec(text)) !== null) {
                const questionNumber = parseInt(match[1]);
                questions.push({
                    number: questionNumber,
                    startIndex: match.index,
                    text: text.substring(match.index, match.index + 150) // Get a snippet for debugging
                });
                console.log(`Fallback: Found question ${questionNumber} at position ${match.index}`);
            }
        }
        
        // No questions found with either pattern - check if we should use known question numbers
        if (questions.length === 0 && originalFilename.toLowerCase().includes('hw')) {
            console.log('No questions detected automatically. Using predefined question numbers for homework.');
            // For homework files, assume standard 4-5 questions
            [1, 2, 3, 4, 5].forEach(num => {
                questions.push({ number: num, manuallyAdded: true });
            });
        }
        
        // Still no questions found - use page-based fallback
        if (questions.length === 0) {
            console.log('No question patterns detected, falling back to page-based splitting');
            return fallbackToPageSplitting(pdfBuffer, originalFilename);
        }
        
        // Sort questions by their order in the document (or by number if manually added)
        questions.sort((a, b) => {
            if (a.manuallyAdded && b.manuallyAdded) return a.number - b.number;
            if (a.manuallyAdded) return 1;
            if (b.manuallyAdded) return -1;
            return a.startIndex - b.startIndex;
        });
        
        console.log(`Found ${questions.length} questions to extract`);
        
        // Load the PDF document to create the question PDFs
        const pdfDoc = await PDFDocument.load(pdfBuffer);
        const pages = pdfDoc.getPages();
        const questionPDFs = [];
        
        // For homework PDFs with multiple questions on single page, manual page allocation
        if (originalFilename.toLowerCase().includes('hw') && pdfData.numpages === 1 && questions.length > 1) {
            console.log('Processing multi-question single-page homework');
            
            // Get the dimensions of the page
            const sourcePage = pages[0];
            const { width, height } = sourcePage.getSize();
            
            // For each detected question, create a custom PDF
            for (let i = 0; i < questions.length; i++) {
                const questionNum = questions[i].number;
                
                // Skip questions beyond what we detected in the file
                if (questionNum > questions.length && !questions[i].manuallyAdded) {
                    continue;
                }
                
                try {
                    // Create a new PDF document for this question
                    const questionDoc = await PDFDocument.create();
                    
                    // For manually extracted questions, copy the full page for now
                    // In a future version, we could extract specific regions
                    const [copiedPage] = await questionDoc.copyPages(pdfDoc, [0]);
                    questionDoc.addPage(copiedPage);
                    
                    // Save the question PDF
                    const questionPdfBytes = await questionDoc.save();
                    
                    // Generate filename for the question
                    const baseName = path.parse(originalFilename).name;
                    const questionFilename = `${baseName}_question${questionNum}.pdf`;
                    
                    questionPDFs.push({
                        buffer: Buffer.from(questionPdfBytes),
                        filename: questionFilename,
                        questionNumber: questionNum
                    });
                    
                    console.log(`Created question file: ${questionFilename}`);
                } catch (error) {
                    console.error(`Error processing question ${questionNum}:`, error);
                }
            }
        } else {
            // For standard PDFs with one question per page
            console.log('Processing standard multi-page PDF');
            
            // For each question, determine which pages it spans
            for (let i = 0; i < questions.length; i++) {
                const questionNum = questions[i].number;
                
                try {
                    // Create a new PDF document for this question
                    const questionDoc = await PDFDocument.create();
                    
                    // For simplicity in this version, assign one page per question
                    // This is an approximation since we can't reliably detect question boundaries
                    const pageIndex = Math.min(i, pages.length - 1);
                    const [copiedPage] = await questionDoc.copyPages(pdfDoc, [pageIndex]);
                    questionDoc.addPage(copiedPage);
                    
                    // Save the question PDF
                    const questionPdfBytes = await questionDoc.save();
                    
                    // Generate filename for the question
                    const baseName = path.parse(originalFilename).name;
                    const questionFilename = `${baseName}_question${questionNum}.pdf`;
                    
                    questionPDFs.push({
                        buffer: Buffer.from(questionPdfBytes),
                        filename: questionFilename,
                        questionNumber: questionNum
                    });
                    
                    console.log(`Created question file: ${questionFilename}`);
                } catch (error) {
                    console.error(`Error processing question ${questionNum}:`, error);
                }
            }
        }
        
        if (questionPDFs.length === 0) {
            console.log('Failed to create any question PDFs, falling back to page-based splitting');
            return fallbackToPageSplitting(pdfBuffer, originalFilename);
        }
        
        return questionPDFs;
    } catch (error) {
        console.error('Error splitting PDF:', error);
        console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        return fallbackToPageSplitting(pdfBuffer, originalFilename);
    }
}

/**
 * Fallback function to split PDF by pages if question detection fails
 * @param {Buffer} pdfBuffer - The PDF file buffer
 * @param {string} originalFilename - Original filename for naming the split files
 * @returns {Promise<Array<{buffer: Buffer, filename: string}>>} Array of split PDF buffers and their filenames
 */
async function fallbackToPageSplitting(pdfBuffer, originalFilename) {
    try {
        console.log('Using fallback page-based splitting');
        
        // Load the PDF document
        const pdfDoc = await PDFDocument.load(pdfBuffer);
        const pages = pdfDoc.getPages();
        console.log(`Found ${pages.length} pages in the PDF for fallback splitting`);
        
        if (pages.length === 0) {
            throw new Error('PDF contains no pages');
        }
        
        // Create an array to store individual page PDFs
        const pagePDFs = [];
        
        // Process each page as a separate question
        for (let i = 0; i < pages.length; i++) {
            console.log(`Processing page ${i + 1} of ${pages.length} for fallback`);
            
            try {
                // Create a new PDF document for each page
                const pageDoc = await PDFDocument.create();
                
                // Copy the page to the new document
                const [copiedPage] = await pageDoc.copyPages(pdfDoc, [i]);
                pageDoc.addPage(copiedPage);
                
                // Save the page PDF
                const pagePdfBytes = await pageDoc.save();
                
                // Generate filename for the page
                const baseName = path.parse(originalFilename).name;
                const pageFilename = `${baseName}_question${i + 1}.pdf`;
                
                pagePDFs.push({
                    buffer: Buffer.from(pagePdfBytes),
                    filename: pageFilename,
                    questionNumber: i + 1
                });
                
                console.log(`Created fallback page file: ${pageFilename}`);
            } catch (pageError) {
                console.error(`Error processing fallback page ${i + 1}:`, pageError);
            }
        }
        
        if (pagePDFs.length === 0) {
            throw new Error('Failed to create any fallback page files');
        }
        
        return pagePDFs;
    } catch (error) {
        console.error('Error in fallback page splitting:', error);
        throw error;
    }
}

/**
 * Saves split PDFs to temporary files
 * @param {Array<{buffer: Buffer, filename: string}>} questionPDFs - Array of split PDFs
 * @returns {Promise<Array<string>>} Array of temporary file paths
 */
async function saveSplitPDFs(questionPDFs) {
    const tempFiles = [];
    
    // Ensure uploads directory exists
    try {
        await fs.mkdir('uploads', { recursive: true });
    } catch (error) {
        console.error('Error creating uploads directory:', error);
    }
    
    for (const question of questionPDFs) {
        try {
            const tempPath = path.join('uploads', question.filename);
            await fs.writeFile(tempPath, question.buffer);
            tempFiles.push(tempPath);
            console.log(`Saved temporary file: ${tempPath}`);
        } catch (error) {
            console.error(`Error saving file ${question.filename}:`, error);
        }
    }
    
    return tempFiles;
}

module.exports = {
    splitPDFIntoQuestions,
    saveSplitPDFs
}; 