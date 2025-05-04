import re
import fitz  # PyMuPDF

# 1. Open the source PDF
doc = fitz.open("270HW1.pdf")

# 2. Collect (question_number, page_number, y0) tuples
anchors = []
pattern = re.compile(r"^\s*(\d+)\.")  # matches "1.", "2.", etc.

for pno in range(len(doc)):
    page = doc[pno]
    # extract text blocks
    blocks = page.get_text("blocks")
    for b in blocks:
        text = b[4]            # block text
        m = pattern.match(text)
        if m:
            num = int(m.group(1))
            y0 = b[1]          # upper‐left y
            anchors.append((num, pno, y0))

# 3. Sort anchors by page then by y0
anchors.sort(key=lambda x: (x[1], x[2]))

# 4. Build slices: each anchor → region from its y0 down to next anchor (same page) or bottom
slices = []
for i, (num, pno, y0) in enumerate(anchors):
    page = doc[pno]
    # find next anchor on same page
    next_y = page.rect.y1
    if i+1 < len(anchors) and anchors[i+1][1] == pno:
        next_y = anchors[i+1][2]
    clip = fitz.Rect(0, y0, page.rect.x1, next_y)
    slices.append((num, pno, clip))

# 5. Extract each slice into its own PDF
for num, pno, clip in slices:
    out = fitz.open()
    page = out.new_page(width=doc[pno].rect.width, height=doc[pno].rect.height)
    page.show_pdf_page(page.rect, doc, pno, clip=clip)
    out.save(f"{num}.pdf")
    print(f"→ Saved question {num} as {num}.pdf")