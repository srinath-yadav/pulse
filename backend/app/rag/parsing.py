"""Turn files of different formats into one common structure: a Document made of Sections.

Every parser returns the same shape, so chunking, embedding and search never need
to know whether the text came from Markdown, a PDF, Word, CSV or Excel.
Adding a format means adding one parser function to PARSERS.
"""
import csv
import io
import re
from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable


@dataclass
class Section:
    heading: str
    text: str


@dataclass
class Document:
    source: str                     # e.g. HLX/security-review.pdf, used in citations
    title: str
    sections: list[Section] = field(default_factory=list)


class UnsupportedFileError(Exception):
    pass


def _title_from(path: Path) -> str:
    """'carrier-sla.xlsx' -> 'carrier sla', for files with no title of their own."""
    return path.stem.replace("-", " ").replace("_", " ")


def _clean(text: str) -> str:
    """Collapse runs of spaces and blank lines left over from extraction."""
    text = re.sub(r"[ \t]+", " ", text)
    return re.sub(r"\n\s*\n+", "\n", text).strip()


# ---------- Markdown and plain text ----------

def parse_markdown(path: Path, source: str) -> Document:
    doc = Document(source=source, title=_title_from(path))
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.startswith("# "):
            doc.title = line[2:].strip()
        elif line.startswith("## "):
            doc.sections.append(Section(line[3:].strip(), ""))
        elif line.strip():
            if not doc.sections:
                doc.sections.append(Section("Overview", ""))
            doc.sections[-1].text += line.strip() + " "
    return doc


def parse_text(path: Path, source: str) -> Document:
    text = _clean(path.read_text(encoding="utf-8", errors="replace"))
    return Document(source=source, title=_title_from(path), sections=[Section("Text", text)])


# ---------- PDF ----------

def parse_pdf(path: Path, source: str) -> Document:
    from pypdf import PdfReader  # imported here so other formats work without it

    reader = PdfReader(str(path))
    pages = [(p.extract_text() or "") for p in reader.pages]

    # Lines that repeat on most pages are headers or footers: noise for search.
    # Digits are masked first, so "Page 1 of 2" and "Page 2 of 2" count as the same line.
    def pattern(line: str) -> str:
        return re.sub(r"\d+", "#", line.strip())

    page_lines = [{pattern(l) for l in p.splitlines() if l.strip()} for p in pages]
    counts = Counter(line for lines in page_lines for line in lines)
    repeated = {l for l, n in counts.items() if len(pages) > 1 and n > len(pages) / 2}

    title = reader.metadata.title if reader.metadata and reader.metadata.title else _title_from(path)
    doc = Document(source=source, title=title)
    for number, page in enumerate(pages, start=1):
        kept = [l for l in page.splitlines() if l.strip() and pattern(l) not in repeated]
        text = _clean("\n".join(kept))
        if text:
            doc.sections.append(Section(f"Page {number}", text))
    if not doc.sections:
        # No text layer: probably a scanned PDF, which would need OCR first
        raise UnsupportedFileError(f"{source} has no extractable text (scanned PDF? needs OCR)")
    return doc


# ---------- Word ----------

def parse_docx(path: Path, source: str) -> Document:
    from docx import Document as DocxFile

    file = DocxFile(str(path))
    doc = Document(source=source, title=_title_from(path))
    for para in file.paragraphs:
        text, style = para.text.strip(), (para.style.name if para.style else "")
        if not text:
            continue
        if style == "Title":
            doc.title = text
        elif style.startswith("Heading"):
            doc.sections.append(Section(text, ""))
        else:
            if not doc.sections:
                doc.sections.append(Section("Overview", ""))
            doc.sections[-1].text += text + " "
    for t, table in enumerate(file.tables, start=1):
        rows = [[c.text.strip() for c in row.cells] for row in table.rows]
        doc.sections.extend(_table_sections(rows, f"Table {t}"))
    return doc


# ---------- Tables: CSV and Excel ----------

KEY_COLUMNS = ("issue key", "key", "id")  # Jira exports name the key column "Issue key"


def _table_sections(rows: list[list[str]], label: str | None = None) -> list[Section]:
    """One section per row, written as 'Column: value' pairs.

    A bare row like 'NWL-201, Blocked, Kiran' means little once it is separated from
    its header, so every row carries its column names into the chunk.
    """
    rows = [r for r in rows if any(c.strip() for c in r)]
    if len(rows) < 2:
        return []
    header = [h.strip() or f"Column {i + 1}" for i, h in enumerate(rows[0])]
    key_index = next((i for i, h in enumerate(header) if h.lower() in KEY_COLUMNS), None)

    sections = []
    for n, row in enumerate(rows[1:], start=2):
        pairs = [f"{h}: {v.strip()}" for h, v in zip(header, row) if v and v.strip()]
        if not pairs:
            continue
        name = row[key_index].strip() if key_index is not None and row[key_index].strip() else f"Row {n}"
        sections.append(Section(f"{label} > {name}" if label else name, " | ".join(pairs)))
    return sections


def parse_csv(path: Path, source: str) -> Document:
    raw = path.read_bytes()
    try:
        text = raw.decode("utf-8-sig")       # handles Excel's BOM too
    except UnicodeDecodeError:
        text = raw.decode("cp1252")          # older Windows exports
    dialect = csv.Sniffer().sniff(text[:2048], delimiters=",;\t") if text.strip() else csv.excel
    rows = list(csv.reader(io.StringIO(text), dialect))
    return Document(source=source, title=_title_from(path), sections=_table_sections(rows))


def parse_xlsx(path: Path, source: str) -> Document:
    from openpyxl import load_workbook

    workbook = load_workbook(str(path), read_only=True, data_only=True)  # data_only: values, not formulas
    doc = Document(source=source, title=_title_from(path))
    for sheet in workbook.worksheets:
        rows = [["" if v is None else str(v) for v in row] for row in sheet.iter_rows(values_only=True)]
        doc.sections.extend(_table_sections(rows, sheet.title))
    workbook.close()
    return doc


# ---------- Registry ----------

PARSERS: dict[str, Callable[[Path, str], Document]] = {
    ".md": parse_markdown,
    ".txt": parse_text,
    ".pdf": parse_pdf,
    ".docx": parse_docx,
    ".csv": parse_csv,
    ".xlsx": parse_xlsx,
}

SUPPORTED_EXTENSIONS = tuple(PARSERS)


def parse_file(path: Path, source: str) -> Document:
    parser = PARSERS.get(path.suffix.lower())
    if parser is None:
        raise UnsupportedFileError(f"{source}: {path.suffix or 'no extension'} files are not supported")
    return parser(path, source)
