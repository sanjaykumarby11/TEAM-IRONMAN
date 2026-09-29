export function renderModal(modalId, title, contentHtml) {
    return `
        <div id="${modalId}" class="modal-overlay">
            <div class="modal-card glassmorphic">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="btn-icon modal-close-btn" data-modal="${modalId}">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${contentHtml}
                </div>
            </div>
        </div>
    `;
}
