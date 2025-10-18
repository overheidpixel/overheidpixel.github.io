document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('verlengingForm');

    function setupDropZone(dropZoneId, inputName, previewId) {
        const dropZone = document.getElementById(dropZoneId);
        const input = form[inputName];
        const preview = document.getElementById(previewId);

        ['dragenter', 'dragover'].forEach(evt => dropZone.addEventListener(evt, e => {
            e.preventDefault(); dropZone.classList.add('dragover');
        }));
        ['dragleave', 'drop'].forEach(evt => dropZone.addEventListener(evt, e => {
            e.preventDefault(); dropZone.classList.remove('dragover');
        }));

        dropZone.addEventListener('drop', e => {
            const files = e.dataTransfer.files;
            input.files = files;
            showPreviews(files, preview);
        });

        dropZone.addEventListener('click', () => input.click());
        input.addEventListener('change', e => showPreviews(e.target.files, preview));
    }

    function showPreviews(files, preview) {
        preview.innerHTML = '';
        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = e => {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.title = file.name;
                    preview.appendChild(img);
                };
                reader.readAsDataURL(file);
            } else if (file.type === 'application/pdf') {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(file);
                a.target = '_blank';
                a.textContent = file.name;
                a.style.display = 'block';
                preview.appendChild(a);
            }
        });
    }

    setupDropZone('dropZonePdf', 'oude_pdf', 'previewOudePdf');
    setupDropZone('dropZoneImages', 'bewijsstukken', 'previewBewijs');

    document.getElementById('downloadBtn').addEventListener('click', async () => {
        const formData = new FormData(form);
        const { jsPDF } = window.jspdf;
        const zip = new JSZip();
        const pageWidth = 595; // A4 pt
        const pageHeight = 842;
        const margin = 40;

        // --- 1. Maak nieuwe PDF ---
        const doc = new jsPDF({ unit: 'pt', format: 'a4' });
        let y = margin;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text("Verlenging Subsidie / Uitkering", pageWidth / 2, y, { align: 'center' });
        y += 25;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.text(`Datum: ${new Date().toLocaleString()}`, pageWidth - margin, y, { align: 'right' });
        y += 20;

        const addLine = (label, value) => {
            if (!value) return;
            const lines = doc.splitTextToSize(`${label}: ${value}`, pageWidth - margin * 2);
            doc.text(lines, margin, y);
            y += lines.length * 14 + 5;
            if (y > pageHeight - margin - 150) { doc.addPage(); y = margin; }
        };

        addLine('Bedrijfsnaam', formData.get('bedrijf'));
        addLine('Eigenaar', formData.get('eigenaar'));
        addLine('Datum oprichting', formData.get('oprichting'));
        addLine('Type', formData.get('bedrijf_type'));
        addLine('Huidige inkomsten', formData.get('inkomsten'));
        addLine('Leningen', formData.get('leningen'));
        addLine('Financiële opmerkingen', formData.get('fin_opmerkingen'));
        addLine('Doel verlenging', formData.get('doel'));
        addLine('Middelen', formData.getAll('middelen').join(', '));
        addLine('Verwachte resultaten', formData.get('resultaat'));

        // Voeg nieuwe bewijsstukken als afbeeldingen toe in PDF
        const bewijsstukken = [...formData.getAll('bewijsstukken')];
        for (const f of bewijsstukken) {
            if (f.type.startsWith('image/')) {
                const dataUrl = await new Promise(res => {
                    const reader = new FileReader();
                    reader.onload = e => res(e.target.result);
                    reader.readAsDataURL(f);
                });
                const maxWidth = pageWidth - margin * 2;
                const maxHeight = 160;
                if (y + maxHeight > pageHeight - margin) { doc.addPage(); y = margin; }
                doc.addImage(dataUrl, 'JPEG', margin, y, maxWidth, maxHeight);
                y += maxHeight + 10;
            }
        }

        // Voeg PDF toe aan ZIP
        const safeName = (formData.get('bedrijf') || 'verlenging').replace(/[^\w\-]/g, '_');
        const pdfBlob = doc.output('blob');
        zip.file(`${safeName}_verlenging.pdf`, pdfBlob);

        // --- 2. Voeg oude PDF toe ---
        const oudePdfFile = formData.get('oude_pdf');
        if (oudePdfFile) {
            zip.file(oudePdfFile.name, oudePdfFile);
        }

        // --- 3. Voeg bewijsstukken apart toe ---
        const bewijsMap = zip.folder('bewijsstukken');
        bewijsstukken.forEach(f => {
            bewijsMap.file(f.name, f);
        });

        // --- 4. Genereer en download ZIP ---
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        saveAs(zipBlob, `${safeName}_aanvraag_bundle.zip`);
    });
});
