import { Injectable } from '@angular/core';

export interface PdfCommonField {
  label: string;
  value: any;
}

export interface PdfColumnConfig {
  key: string;                        // Data object ki key (e.g. 'groupItem' ya 'Group Item')
  label?: string;                     // Table header (agar na dein toh key hi dikhega)
  type?: 'text' | 'image';            // Default 'text'; image URLs ke liye 'image'
  align?: 'left' | 'center' | 'right';
  sum?: boolean;                      // true hone par sabse neeche Total row mein sum aayega
}

export interface DynamicPdfOptions {
  title: string;                      // Top center heading (e.g. 'Item Score Data')
  fileName?: string;                  // Optional PDF/Tab title (na dein toh title use hoga)
  rows: Record<string, any>[];         // Koi bhi data array
  commonFields?: PdfCommonField[];    // Optional upper table (agar na dein toh nahi banegi)
  columns?: PdfColumnConfig[];        // Optional lower table columns (na dein toh auto keys lega)
  hideKeys?: string[];                // Optional keys jo hide karni hon (e.g. ['id', 'pointId'])
  showSaveIcon?: boolean;             // Default true (icon-only save button)
  imageMaxWidth?: number;             // Default 480
  imageQuality?: number;              // Default 0.55 (0.1 to 1.0 JPEG compression)
  maxTotalBytes?: number;             // Default 20MB (20 * 1024 * 1024)
}

@Injectable({
  providedIn: 'root'
})
export class PdfReportService {

  async openInNewTab(options: DynamicPdfOptions): Promise<void> {
    const {
      title,
      fileName,
      rows = [],
      commonFields = [],
      columns,
      hideKeys = [],
      showSaveIcon = true,
      imageMaxWidth = 480,
      imageQuality = 0.55,
      maxTotalBytes = 20 * 1024 * 1024
    } = options;

    if (!rows.length) return;

    const newTab = window.open('', '_blank');
    if (!newTab) {
      alert('Please allow pop-ups in browser to open PDF in new tab.');
      return;
    }

    newTab.document.open();
    newTab.document.write('<p style="font-family:Arial,sans-serif;padding:16px;">Preparing PDF report...</p>');
    newTab.document.close();

    const docTitle = (fileName || title).trim();
    const hideSet = new Set(hideKeys);
    const commonKeySet = new Set(
      commonFields
        .map(f => (f as any).key)
        .filter((k): k is string => Boolean(k))
    );

    // 1. Upper Common Table (sirf tab banegi jab commonFields diye hon)
    let commonTableHtml = '';
    if (commonFields.length > 0) {
      const ths = commonFields
        .map(f => `<th>${this.escape(f.label)}</th>`)
        .join('');
      const tds = commonFields
        .map(f => `<td>${this.escape(f.value)}</td>`)
        .join('');

      commonTableHtml = `
        <table class="common-table">
          <thead><tr>${ths}</tr></thead>
          <tbody><tr>${tds}</tr></tbody>
        </table>
      `;
    }

    // 2. Lower Table Columns (dynamic: config se ya rows ki keys se)
    let resolvedColumns: PdfColumnConfig[];
    if (columns && columns.length > 0) {
      resolvedColumns = columns.filter(c => !hideSet.has(c.key));
    } else {
      const keys: string[] = [];
      rows.forEach(r => {
        Object.keys(r).forEach(k => {
          if (!hideSet.has(k) && !commonKeySet.has(k) && !keys.includes(k)) {
            keys.push(k);
          }
        });
      });
      resolvedColumns = keys.map(k => ({
        key: k,
        label: k,
        type: this.looksLikeImageColumn(rows, k) ? 'image' : 'text'
      }));
    }

    const detailHeadersHtml = resolvedColumns
      .map(col => `<th>${this.escape(col.label ?? col.key)}</th>`)
      .join('');

    // Unique image URLs collect karke compress karein + size budget ke andar rakhein
    const imageColumns = resolvedColumns.filter(c => c.type === 'image');
    const compressedUrlMap = new Map<string, string>();

    if (imageColumns.length > 0) {
      const urlOccurrences = new Map<string, number>();
      rows.forEach(row => {
        imageColumns.forEach(col => {
          this.extractImageUrls(row?.[col.key]).forEach(u => {
            urlOccurrences.set(u, (urlOccurrences.get(u) || 0) + 1);
          });
        });
      });

      const uniqueUrls = Array.from(urlOccurrences.keys());
      let activeMaxWidth = imageMaxWidth;
      let activeQuality = imageQuality;

      const tiers: Array<{ maxWidth: number; quality: number }> = [
        { maxWidth: activeMaxWidth, quality: activeQuality },
        { maxWidth: Math.min(activeMaxWidth, 280), quality: Math.min(activeQuality, 0.35) },
        { maxWidth: Math.min(activeMaxWidth, 220), quality: Math.min(activeQuality, 0.25) }
      ];

      for (let t = 0; t < tiers.length; t++) {
        activeMaxWidth = tiers[t].maxWidth;
        activeQuality = tiers[t].quality;
        compressedUrlMap.clear();

        await Promise.all(
          uniqueUrls.map(async (url) => {
            const compressed = await this.compressImageToDataUrl(url, activeMaxWidth, activeQuality);
            compressedUrlMap.set(url, compressed);
          })
        );

        const totalEstimatedBytes = Array.from(compressedUrlMap.entries()).reduce((sum, [url, dataUrl]) => {
          const count = urlOccurrences.get(url) || 1;
          return sum + this.estimateDataUrlBytes(dataUrl) * count;
        }, 0);

        // PDF wrapper overhead ke liye 80% budget check
        if (totalEstimatedBytes <= maxTotalBytes * 0.8 || t === tiers.length - 1) {
          break;
        }
      }
    }

    const detailBodyHtml = rows
      .map(row => {
        const tds = resolvedColumns.map(col => {
          const alignClass = col.align ? ` class="${col.align}"` : '';
          if (col.type === 'image') {
            return `<td${alignClass}><div class="img-cell">${this.renderImages(row[col.key], compressedUrlMap)}</div></td>`;
          }
          return `<td${alignClass}>${this.escape(row[col.key])}</td>`;
        }).join('');
        return `<tr>${tds}</tr>`;
      })
      .join('');

    // 3. Optional Total Row (first sum column se pehle ki cells merge + Total center)
    const firstSumIdx = resolvedColumns.findIndex(col => Boolean(col.sum) && col.type !== 'image');
    let totalRowHtml = '';

    if (firstSumIdx !== -1) {
      const mergedLabelCell = firstSumIdx > 0
        ? `<td colspan="${firstSumIdx}" class="center"><strong>Total</strong></td>`
        : `<td class="center"><strong>Total</strong></td>`;

      const remainingCells = resolvedColumns
        .slice(firstSumIdx)
        .map(col => {
          const alignClass = col.align ? ` class="${col.align}"` : '';
          if (col.sum && col.type !== 'image') {
            const sumVal = rows.reduce((acc, r) => {
              const raw = r?.[col.key];
              const num = raw === null || raw === undefined
                ? NaN
                : Number(String(raw).replace(/,/g, '').trim());
              return acc + (isNaN(num) ? 0 : num);
            }, 0);

            const formatted = Number.isInteger(sumVal)
              ? String(sumVal)
              : String(Math.round(sumVal * 100) / 100);

            return `<td${alignClass}><strong>${this.escape(formatted)}</strong></td>`;
          }
          return `<td${alignClass}></td>`;
        })
        .join('');

      totalRowHtml = `<tr class="total-row">${mergedLabelCell}${remainingCells}</tr>`;
    }

    // Icon-only Save button (no text)
    const saveButtonHtml = showSaveIcon
      ? `
        <div class="toolbar no-print">
          <button type="button" class="save-icon-btn" title="Save PDF" aria-label="Save PDF" onclick="window.print()">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </button>
        </div>
      `
      : '';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>${this.escape(docTitle)}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
          body {
            font-family: Arial, sans-serif;
            margin: 14px;
            color: #111827;
          }
          .toolbar {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 8px;
          }
          .save-icon-btn {
            width: 36px;
            height: 36px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: #2563eb;
            color: #ffffff;
            border: none;
            border-radius: 6px;
            cursor: pointer;
          }
          .save-icon-btn:hover {
            background: #1d4ed8;
          }
          h2 {
            text-align: center;
            margin: 0 0 14px 0;
            font-size: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
            font-size: 12px;
          }
          th, td {
            border: 1px solid #cbd5e1;
            padding: 6px 8px;
            text-align: left;
            vertical-align: top;
          }
          th {
            background: #1e293b;
            color: #ffffff;
            white-space: nowrap;
          }
          .common-table th {
            background: #e2e8f0;
            color: #0f172a;
          }
          .total-row td {
            background: #f1f5f9;
            font-weight: bold;
            border-top: 2px solid #94a3b8;
          }
          .center { text-align: center; }
          .right { text-align: right; }
          .img-cell {
            min-width: 170px;
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
          }
          .img-cell img {
            width: 78px;
            height: 60px;
            object-fit: cover;
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            display: block;
          }
          @media print {
            .no-print { display: none !important; }
            body { margin: 0; }
            tr { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        ${saveButtonHtml}

        <h2>${this.escape(title)}</h2>

        ${commonTableHtml}

        <table>
          <thead><tr>${detailHeadersHtml}</tr></thead>
          <tbody>${detailBodyHtml}${totalRowHtml}</tbody>
        </table>
      </body>
      </html>
    `;

    newTab.document.open();
    newTab.document.write(html);
    newTab.document.close();
  }

  private estimateDataUrlBytes(dataUrl: string): number {
    if (!dataUrl || !dataUrl.startsWith('data:')) return 0;
    const base64Part = dataUrl.split(',')[1] || '';
    return Math.round((base64Part.length * 3) / 4);
  }

  private extractImageUrls(val: any): string[] {
    if (!val) return [];

    return Array.isArray(val)
      ? val.map(u => String(u).trim()).filter(Boolean)
      : String(val)
          .split(',')
          .map(u => u.trim())
          .filter(u => u.startsWith('http://') || u.startsWith('https://') || u.startsWith('data:image/'));
  }

  private compressImageToDataUrl(url: string, maxWidth: number, quality: number): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          const width = img.naturalWidth || img.width;
          const height = img.naturalHeight || img.height;
          if (!width || !height) {
            resolve(url);
            return;
          }

          const scale = width > maxWidth ? maxWidth / width : 1;
          const targetW = Math.round(width * scale);
          const targetH = Math.round(height * scale);

          const canvas = document.createElement('canvas');
          canvas.width = targetW;
          canvas.height = targetH;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(url);
            return;
          }

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, targetW, targetH);
          ctx.drawImage(img, 0, 0, targetW, targetH);

          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed || url);
        } catch {
          resolve(url);
        }
      };

      img.onerror = () => resolve(url);
      img.src = url;
    });
  }

  private looksLikeImageColumn(rows: Record<string, any>[], key: string): boolean {
    const lower = key.toLowerCase();
    if (lower.includes('image') || lower.includes('photo') || lower.includes('img')) {
      return true;
    }
    return rows.some(r => {
      const val = r?.[key];
      if (!val) return false;
      const str = Array.isArray(val) ? val.join(',') : String(val);
      return /https?:\/\/|data:image\//i.test(str);
    });
  }

  private renderImages(val: any, compressedUrlMap: Map<string, string>): string {
    const urls = this.extractImageUrls(val);
    if (!urls.length) return '-';

    return urls
      .map(url => {
        const finalSrc = compressedUrlMap.get(url) || url;
        return `<img src="${this.escape(finalSrc)}" alt="Photo" onerror="this.style.display='none'" />`;
      })
      .join('');
  }

  private escape(val: any): string {
    if (val === null || val === undefined || val === '') return '-';
    return String(val)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}