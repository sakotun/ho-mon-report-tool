const imageInput = document.getElementById('imageInput');
const previewArea = document.getElementById('previewArea');
const printContainer = document.getElementById('printContainer');
const exportPdfBtn = document.getElementById('exportPdfBtn');
const exportImgBtn = document.getElementById('exportImgBtn');
const imageCounter = document.getElementById('imageCounter');

new Sortable(previewArea, {
    animation: 150,
    handle: '.drag-handle',
    ghostClass: 'sortable-ghost'
});

function updateImageCounter() {

    const imageCount =
        previewArea.querySelectorAll(
            '.image-card'
        ).length;

    const pageCount =
        Math.ceil(imageCount / 6);

    imageCounter.innerHTML = `
        登録画像数：${imageCount} / 36枚<br>
        出力ページ数：${pageCount} / 6ページ
    `;
}

imageInput.addEventListener('change', (event) => {

    const files = event.target.files;

    const currentCount =
        previewArea.querySelectorAll(
            '.image-card'
        ).length;

    if (
        currentCount + files.length > 36
    ) {

        alert(
            `登録可能枚数は最大36枚です。\n現在 ${currentCount} 枚登録されています。`
        );

        return;
    }

    for (let i = 0; i < files.length; i++) {

        const file = files[i];
        const reader = new FileReader();

        reader.onload = (e) => {

            const card = document.createElement('div');
            card.className = 'image-card';

            const dragHandle = document.createElement('div');
            dragHandle.className = 'drag-handle';
            dragHandle.textContent = '≡ ドラッグして移動';

            const controls = document.createElement('div');
            controls.className = 'controls';

            const rotateBtn = document.createElement('button');
            rotateBtn.textContent = '↻ 90度回転';

            const cropBtn = document.createElement('button');
            cropBtn.textContent = '✂ 確定';

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '✖ 削除';
            deleteBtn.onclick = () => {

                card.remove();

                updateImageCounter();
            };

            controls.appendChild(rotateBtn);
            controls.appendChild(cropBtn);
            controls.appendChild(deleteBtn);

            const imgContainer = document.createElement('div');
            imgContainer.className = 'img-container';

            const img = document.createElement('img');
            img.src = e.target.result;

            imgContainer.appendChild(img);

            const titleInput = document.createElement('input');
            titleInput.type = 'text';
            titleInput.placeholder = 'タイトル（40文字以内）';
            titleInput.className = 'card-title';
            titleInput.maxLength = 40;

            const commentInput = document.createElement('textarea');
            commentInput.placeholder = 'コメント（120文字以内）';
            commentInput.className = 'card-comment';
            commentInput.maxLength = 120;

            card.appendChild(dragHandle);
            card.appendChild(controls);
            card.appendChild(imgContainer);
            card.appendChild(titleInput);
            card.appendChild(commentInput);

            previewArea.appendChild(card);
            updateImageCounter();

            const cropper = new Cropper(img, {
                viewMode: 1,
                dragMode: 'move',
                autoCropArea: 1,
                background: false
            });

            rotateBtn.onclick = () => {
                cropper.rotate(90);
            };

            cropBtn.onclick = () => {

                const croppedCanvas = cropper.getCroppedCanvas();

                img.src = croppedCanvas.toDataURL('image/jpeg');

                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'contain';

                cropper.destroy();

                rotateBtn.style.display = 'none';
                cropBtn.style.display = 'none';
            };
        };

        reader.readAsDataURL(file);
    }

    event.target.value = '';
});


// ======================================
// 出力ページ作成
// ======================================

function buildPrintPages() {

    printContainer.innerHTML = '';

    const cards = Array.from(
        previewArea.querySelectorAll('.image-card')
    );

    if (cards.length === 0) {
        alert('出力する画像がありません。');
        return false;
    }

    if (cards.length > 36) {
        alert('登録できる画像は最大36枚（6ページ）までです');
        return false;
    }

    const rTitle =
        document.getElementById('reportTitle').value ||
        '報告書';

    const rDate =
        document.getElementById('reportDate').value;

    const rVisitor =
        document.getElementById('visitorName').value;

    const rRemarks =
        document.getElementById('reportRemarks').value;

    const itemsPerPage = 6;

    const photoPages =
        Math.ceil(cards.length / itemsPerPage);

    const totalPages =
        photoPages + (rRemarks.trim() !== '' ? 1 : 0);

    const displayDate =
        rDate
            ? rDate.replaceAll('-', '')
            : '未設定';

    for (let i = 0; i < cards.length; i += itemsPerPage) {

        const chunk =
            cards.slice(i, i + itemsPerPage);

        const pageIndex =
            Math.floor(i / itemsPerPage);

        const isFirstPage =
            pageIndex === 0;

        const page =
            document.createElement('div');

        page.className = 'a4-page';


        const pageNumber =
            document.createElement('div');

        pageNumber.className = 'page-number';

        pageNumber.textContent =
            `${displayDate}-${pageIndex + 1}/${totalPages}`;

        page.appendChild(pageNumber);

        // ======================
        // ヘッダー
        // ======================

        if (isFirstPage) {

            const header =
                document.createElement('div');

            header.className = 'print-header';

            header.innerHTML = `
                <h1>${rTitle}</h1>

                <div class="print-meta">
                    <div>日付: ${
                        rDate || '  年  月  日'
                    }</div>

                    <div>訪問者: ${
                        rVisitor || ''
                    }</div>
                </div>
            `;

            page.appendChild(header);
        }

        // ======================
        // 写真グリッド
        // ======================

        const grid =
            document.createElement('div');

        grid.className = 'print-grid';

        chunk.forEach(card => {

            const imgSrc =
                card.querySelector(
                    '.img-container img'
                ).src;

            const title =
                card.querySelector(
                    '.card-title'
                ).value || '';

            const comment =
                card.querySelector(
                    '.card-comment'
                ).value || '';

            const item =
                document.createElement('div');

            item.className = 'print-item';

            item.innerHTML = `
                <div class="print-img-box">
                    <img src="${imgSrc}">
                </div>

                ${
                    title
                        ? `<h2 class="print-title">${title}</h2>`
                        : ''
                }

                <p class="print-comment">
                    ${comment}
                </p>
            `;

            grid.appendChild(item);
        });

        page.appendChild(grid);

        printContainer.appendChild(page);
    }

    // ======================
    // 備考ページ
    // ======================

    if (rRemarks.trim() !== '') {

        const remarksPage =
            document.createElement('div');

        remarksPage.className = 'a4-page';

        const remarksPageNumber =
            document.createElement('div');

        remarksPageNumber.className = 'page-number';

        remarksPageNumber.textContent =
            `${displayDate}-${totalPages}/${totalPages}`;

        remarksPage.appendChild(remarksPageNumber);

        remarksPage.innerHTML += `
            <div class="print-remarks-full">
                <h2>備考</h2>
                <p>${rRemarks}</p>
            </div>
        `;

        printContainer.appendChild(remarksPage);
    }

    return true;
}


// ======================================
// PDF出力
// ======================================

exportPdfBtn.addEventListener(
    'click',
    async () => {

        if (!buildPrintPages()) return;

        exportPdfBtn.textContent =
            '処理中...';

        exportPdfBtn.disabled = true;

        const pages =
            printContainer.querySelectorAll(
                '.a4-page'
            );

        const { jsPDF } = window.jspdf;

        const pdf =
            new jsPDF(
                'p',
                'mm',
                'a4'
            );

        for (
            let i = 0;
            i < pages.length;
            i++
        ) {

            const canvas =
                await html2canvas(
                    pages[i],
                    {
                        scale: 2
                    }
                );

            const imgData =
                canvas.toDataURL(
                    'image/jpeg',
                    0.7
                );

            if (i > 0) {
                pdf.addPage();
            }

            pdf.addImage(
                imgData,
                'JPEG',
                0,
                0,
                210,
                297
            );
        }

        pdf.save(
            '報告書.pdf'
        );

        exportPdfBtn.textContent =
            '📄 PDF形式で出力';

        exportPdfBtn.disabled =
            false;

        printContainer.innerHTML = '';
    }
);


// ======================================
// JPEG出力
// ======================================

exportImgBtn.addEventListener(
    'click',
    async () => {

        if (!buildPrintPages()) return;

        exportImgBtn.textContent =
            '処理中...';

        exportImgBtn.disabled = true;

        const pages =
            printContainer.querySelectorAll(
                '.a4-page'
            );

        for (
            let i = 0;
            i < pages.length;
            i++
        ) {

            const canvas =
                await html2canvas(
                    pages[i],
                    {
                        scale: 1.5
                    }
                );

            const imgData =
                canvas.toDataURL(
                    'image/jpeg',
                    0.9
                );

            const link =
                document.createElement('a');

            link.href = imgData;

            link.download =
                `報告書_ページ${i + 1}.jpg`;

            link.click();
        }

        exportImgBtn.textContent =
            '🖼 画像形式(JPEG)で出力';

        exportImgBtn.disabled =
            false;

        printContainer.innerHTML = '';
    }
);

updateImageCounter();