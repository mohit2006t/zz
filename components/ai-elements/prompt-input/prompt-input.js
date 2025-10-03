(function() {
    'use strict';

    // Configuration
    const DEFAULTS = {
        attachmentLimit: null,
        acceptedFormats: ''
    };

    // Cache DOM elements
    const elements = {
        form: null,
        textarea: null,
        attachButton: null,
        fileInput: null,
        attachmentsContainer: null
    };

    // State
    const state = {
        attachedFiles: [],
        singleRowHeight: 0,
        isInitialized: false
    };

    // DOM Utilities
    const createElement = (tag, className, innerHTML = '') => {
        const el = document.createElement(tag);
        if (className) el.className = className;
        if (innerHTML) el.innerHTML = innerHTML;
        return el;
    };

    // File Handling
    const createAttachmentPreview = (file) => {
        const previewWrapper = createElement('div', 'attachment-preview');
        const removeButton = createElement('button', 'btn btn-icon btn-xs btn-pill attachment-remove-button', '<i data-lucide="x"></i>');
        
        removeButton.onclick = () => {
            state.attachedFiles = state.attachedFiles.filter(f => f !== file);
            previewWrapper.remove();
            updateAttachmentsUI();
        };

        if (file.type.startsWith('image/')) {
            const img = createElement('img');
            img.src = URL.createObjectURL(file);
            previewWrapper.appendChild(img);
        } else {
            const fileInfo = createElement('div', 'attachment-file-info', 
                `<i data-lucide="file"></i><span>${file.name}</span>`);
            previewWrapper.appendChild(fileInfo);
        }
        
        previewWrapper.appendChild(removeButton);
        return previewWrapper;
    };

    const handleFileSelection = (files) => {
        if (!files || !files.length) return;

        const newFiles = Array.from(files);
        const { attachmentLimit } = elements.form.dataset;
        const maxFiles = parseInt(attachmentLimit, 10) || Infinity;

        if (state.attachedFiles.length >= maxFiles) {
            console.warn(`Attachment limit of ${maxFiles} already reached.`);
            return;
        }

        const remainingSlots = maxFiles - state.attachedFiles.length;
        const filesToAdd = remainingSlots < newFiles.length 
            ? newFiles.slice(0, remainingSlots)
            : newFiles;

        if (filesToAdd.length < newFiles.length) {
            console.warn(`Only ${filesToAdd.length} of ${newFiles.length} files were added.`);
        }

        state.attachedFiles.push(...filesToAdd);
        updateAttachmentsUI();
    };

    // UI Updates
    const updateAttachmentsUI = () => {
        const { attachmentsContainer } = elements;
        
        if (state.attachedFiles.length === 0) {
            if (attachmentsContainer) {
                attachmentsContainer.remove();
                elements.attachmentsContainer = null;
            }
            return;
        }

        if (!attachmentsContainer) {
            elements.attachmentsContainer = createElement('div', 'prompt-input-attachments');
            elements.form.parentNode.insertBefore(elements.attachmentsContainer, elements.form);
        }

        elements.attachmentsContainer.innerHTML = '';
        state.attachedFiles.forEach(file => {
            elements.attachmentsContainer.appendChild(createAttachmentPreview(file));
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    };

    // Layout Management
    const updateLayout = () => {
        const { textarea } = elements;
        textarea.style.height = 'auto';
        const scrollHeight = textarea.scrollHeight;
        
        if (state.singleRowHeight === 0) {
            state.singleRowHeight = scrollHeight;
        }
        
        elements.form.classList.toggle('prompt-input-multiline', scrollHeight > state.singleRowHeight);
        textarea.style.height = `${scrollHeight}px`;
    };

    // Event Handlers
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            elements.form.dispatchEvent(new Event('submit', { 
                cancelable: true, 
                bubbles: true 
            }));
        }
    };

    const handleFileInputChange = (e) => {
        handleFileSelection(e.target.files);
        e.target.value = ''; // Reset file input
    };

    // Public Methods
    const clearAttachments = () => {
        state.attachedFiles = [];
        updateAttachmentsUI();
    };

    // Initialization
    const init = (form) => {
        if (form.initialized) return;

        elements.form = form;
        elements.textarea = form.querySelector('.prompt-input-textarea');
        elements.attachButton = form.querySelector('button[aria-label="Attach file"]');
        
        if (!elements.textarea) return;

        // Initialize file input
        elements.fileInput = createElement('input');
        elements.fileInput.type = 'file';
        elements.fileInput.multiple = true;
        elements.fileInput.style.display = 'none';
        elements.fileInput.accept = form.dataset.acceptedFormats || '';
        elements.form.appendChild(elements.fileInput);

        // Event Listeners
        if (elements.attachButton) {
            elements.attachButton.addEventListener('click', () => elements.fileInput.click());
        }
        
        elements.fileInput.addEventListener('change', handleFileInputChange);
        elements.textarea.addEventListener('input', updateLayout);
        elements.textarea.addEventListener('keydown', handleKeyDown);

        // Initial layout update
        updateLayout();

        // Expose public methods
        elements.form.clearAttachments = clearAttachments;
        elements.form.initialized = true;
        state.isInitialized = true;
    };

    // Initialize all prompt inputs on page load
    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.prompt-input').forEach(init);
    });

    // Expose init function for dynamic initialization
    window.initPromptInput = (element) => {
        const target = typeof element === 'string' 
            ? document.querySelector(element) 
            : element;
            
        if (target && target.matches('.prompt-input')) {
            init(target);
        } else if (target) {
            target.querySelectorAll('.prompt-input').forEach(init);
        }
    };

    // Auto-initialize if script is loaded after DOMContentLoaded
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        document.querySelectorAll('.prompt-input').forEach(init);
    }
})();