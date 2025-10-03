function conversation() {
  const dependencies = {
    css: {
      katex: 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css',
      hljs: 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-light.min.css'
    },
    js: {
      marked: 'https://cdn.jsdelivr.net/npm/marked/marked.min.js',
      katex: 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js',
      katexAutoRender: 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js',
      hljs: 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js'
    }
  };

  const loadScript = (src) => new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });

  const loadStylesheet = (href, id = '') => new Promise((resolve, reject) => {
    if (document.querySelector(`link[href="${href}"]`)) return resolve();
    const link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = href; if (id) link.id = id;
    link.onload = resolve;
    link.onerror = () => reject(new Error(`Failed to load stylesheet: ${href}`));
    document.head.appendChild(link);
  });

  const initializeComponent = (conv) => {
    if (conv.initialized) return;

    const content = conv.querySelector('.conversation-content');
    if (!content) return;

    let autoScroll = true;
    let isUserScrolling = false;
    let scrollDebounce = null;
    let isScrolling = false;
    let lastScrollTime = 0;
    let lastUserScrollTime = 0;
    let lastScrollTop = 0;
    let lastScrollHeight = 0;
    let isProgrammaticScroll = false;
    const MIN_SCROLL_DISTANCE = 300; // Minimum pixels from bottom to show scroll button
    const SCROLL_DEBOUNCE_TIME = 100; // ms
    const USER_SCROLL_COOLDOWN = 500; // ms to wait before considering scroll as not user-initiated
    
    const scrollToBottom = (force = false, instant = false) => {
      if (force) autoScroll = true;
      if (!autoScroll) return;
      
      const now = Date.now();
      if (now - lastScrollTime < 16) return; // ~60fps throttle
      lastScrollTime = now;
      
      // Don't auto-scroll if user recently scrolled
      if (now - lastUserScrollTime < USER_SCROLL_COOLDOWN && !force) {
        return;
      }
      
      // Mark this as a programmatic scroll
      isProgrammaticScroll = true;
      
      // Batch scroll operations
      requestAnimationFrame(() => {
        // Cancel any ongoing smooth scroll
        if (isScrolling) {
          content.style.scrollBehavior = 'auto';
          const x = content.scrollLeft;
          const y = content.scrollTop;
          content.scrollLeft = x;
          content.scrollTop = y;
        }
        
        // Use instant scroll for programmatic scrolling during streaming
        content.style.scrollBehavior = instant ? 'auto' : 'smooth';
        content.scrollTop = content.scrollHeight;
        
        // Reset scroll behavior after a short delay
        if (!instant) {
          isScrolling = true;
          setTimeout(() => {
            isScrolling = false;
            content.style.scrollBehavior = '';
            isProgrammaticScroll = false;
          }, 300);
        } else {
          // For instant scrolls, reset the flag in the next tick
          setTimeout(() => { isProgrammaticScroll = false; }, 0);
        }
      });
    };
    
    // Handle tab visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // When coming back to tab, check if we should resume auto-scrolling
        const isNearBottom = content.scrollHeight - content.scrollTop - content.clientHeight < 100;
        if (isNearBottom) {
          autoScroll = true;
          // Use a small timeout to ensure DOM is ready
          setTimeout(() => scrollToBottom(true, true), 50);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Track if we're currently streaming
    let isStreaming = false;
    let streamEndTimeout = null;
    let lastStreamUpdate = 0;
    let pendingStreamUpdate = null;
    const STREAM_UPDATE_THROTTLE = 32; // ~30fps for updates

    const renderMath = (container) => {
      container.querySelectorAll('pre code.language-math').forEach(el => {
        try {
          const mathHTML = katex.renderToString(el.textContent, { displayMode: true, throwOnError: false });
          const mathWrapper = document.createElement('div');
          mathWrapper.innerHTML = mathHTML;
          el.parentElement.replaceWith(mathWrapper);
        } catch (e) { console.error("KaTeX display math rendering failed:", e); }
      });
      renderMathInElement(container, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false },
          { left: "\\(", right: "\\)", display: false },
          { left: "\\[", right: "\\]", display: true }
        ],
        // This is a more robust rule to prevent false positives. It checks for spaces
        // around the delimiters and avoids rendering math in contexts like currency.
        ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code"],
        throwOnError: false,
        macros: {
          "\\RR": "\\mathbb{R}"
        }
      });
    };

    const processCodeBlocks = (container) => {
      container.querySelectorAll('pre:not(:has(code.language-math))').forEach((preEl) => {
        if (preEl.closest('.code-block')) return;
        const codeBlockWrapper = document.createElement('div');
        codeBlockWrapper.className = 'code-block';
        codeBlockWrapper.innerHTML = `
          <button class="code-block-copy-button btn btn-icon btn-ghost btn-sm" aria-label="Copy code">
            <i data-lucide="copy"></i>
          </button>`;
        preEl.parentNode.replaceChild(codeBlockWrapper, preEl);
        codeBlockWrapper.appendChild(preEl);
      });
      container.querySelectorAll('pre code:not(.language-math)').forEach(hljs.highlightElement);
      if (typeof codeBlock === 'function') codeBlock();
    };
    
    const createMessageElement = ({ type, text, files = [], showAvatar = false }) => {
      const messageEl = document.createElement('div');
      messageEl.classList.add('message', `message-${type}`);
      if (showAvatar) messageEl.classList.add('message-with-avatar');
      
      const avatarHTML = `<div class="message-avatar"><img src="https://avatar.vercel.sh/${type === 'outgoing' ? 'human' : 'ai'}.png" alt="${type} avatar" /></div>`;
      
      let attachmentsHTML = '';
      if (files && files.length > 0) {
        attachmentsHTML = `<div class="message-attachments">${files.map(file => {
          const isImage = file.type && file.type.startsWith('image/');
          const src = (file instanceof File) ? URL.createObjectURL(file) : (file.url || '');
          const previewContent = isImage 
            ? `<img src="${src}" alt="${file.name || 'attachment'}">`
            : `<div class="attachment-file-info-inline"><i data-lucide="file-text"></i><span>${file.name || 'file'}</span></div>`;
          return `<div class="message-attachment-preview">${previewContent}</div>`;
        }).join('')}</div>`;
      }
      
      let textHTML = '';
      if (text) {
        if (type === 'outgoing') {
          textHTML = `<div class="text-wrapper">${text}</div>`;
        } else {
          const processedText = text.replace(/\$\$\s*([\s\S]*?)\s*\$\$/g, '\n```math\n$1\n```\n');
          textHTML = `<div class="text-wrapper">${marked.parse(processedText, { breaks: true, gfm: true })}</div>`;
        }
      }

      messageEl.innerHTML = `${avatarHTML}<div class="message-content">${attachmentsHTML}${textHTML}</div>`;
      return messageEl;
    };

    const setupAutoScroll = () => {
      const scrollButton = conv.querySelector('.conversation-scroll-button');
      let userScrolledUp = false;
      let lastScrollTime = 0;
      let lastUserScrollTime = 0;
      let lastKnownScrollHeight = content.scrollHeight;
      let lastKnownScrollTop = 0;
      
      // Track content height changes to detect auto-scroll scenarios
      const contentObserver = new ResizeObserver(() => {
        if (isProgrammaticScroll || isStreaming) return;
        
        const scrollBottom = content.scrollHeight - content.scrollTop - content.clientHeight;
        const isNearBottom = scrollBottom < 50;
        
        // If content grew and we were near bottom, auto-scroll
        if (content.scrollHeight > lastKnownScrollHeight && isNearBottom) {
          scrollToBottom(true, true);
        }
        
        lastKnownScrollHeight = content.scrollHeight;
      });
      
      contentObserver.observe(content);

      content.addEventListener('scroll', () => {
        const now = Date.now();
        const scrollTop = content.scrollTop;
        const scrollHeight = content.scrollHeight;
        const clientHeight = content.clientHeight;
        const scrollBottom = scrollHeight - scrollTop - clientHeight;
        
        // Ignore scroll events caused by programmatic scrolling
        if (isProgrammaticScroll) {
          isProgrammaticScroll = false;
          lastKnownScrollTop = scrollTop;
          return;
        }
        
        // Calculate scroll direction and velocity
        const scrollDelta = scrollTop - lastKnownScrollTop;
        const isScrollingDown = scrollDelta > 0;
        const scrollSpeed = Math.abs(scrollDelta) / (now - lastScrollTime || 1);
        
        // Update scroll tracking
        lastKnownScrollTop = scrollTop;
        lastScrollTime = now;
        
        // Check if we're near the bottom (with some threshold)
        const isNearBottom = scrollBottom < 50;
        const isFarFromBottom = scrollBottom > MIN_SCROLL_DISTANCE;
        
        // Detect user-initiated scrolling
        if (!isProgrammaticScroll && !isStreaming) {
          // If scrolling up or fast scrolling (flicking)
          if (scrollDelta < -5 || scrollSpeed > 5) {
            lastUserScrollTime = now;
            userScrolledUp = true;
          } 
          // If scrolling down near the bottom, consider it as user trying to reach bottom
          else if (isScrollingDown && scrollBottom < 100) {
            userScrolledUp = false;
          }
        }
        
        // Update auto-scroll state
        if (isNearBottom) {
          userScrolledUp = false;
          autoScroll = true;
          if (scrollButton) scrollButton.classList.remove('visible');
        } else if (isFarFromBottom && userScrolledUp) {
          autoScroll = false;
        }
        
        // Update scroll button visibility
        if (scrollButton) {
          if (isFarFromBottom) {
            scrollButton.classList.add('visible');
          } else {
            scrollButton.classList.remove('visible');
          }
        }
      });

      if (scrollButton) {
        scrollButton.addEventListener('click', () => {
          content.scrollTo({ top: content.scrollHeight, behavior: 'smooth' });
          autoScroll = true;
          userScrolledUp = false;
          scrollButton.classList.remove('visible');
          // Reset scroll state
          lastScrollTop = content.scrollTop;
        });
      }
      
      // Handle mouse wheel events for better scroll detection
      content.addEventListener('wheel', (e) => {
        if (e.deltaY < 0) {
          // Scrolling up
          userScrolledUp = true;
          autoScroll = false;
        }
      });
      
      // Handle touch events for mobile
      let touchStartY = 0;
      content.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
      }, { passive: true });
      
      content.addEventListener('touchmove', (e) => {
        const touchY = e.touches[0].clientY;
        if (touchY > touchStartY + 5) {
          // Scrolling up
          userScrolledUp = true;
          autoScroll = false;
        } else if (touchY < touchStartY - 5) {
          // Scrolling down - only re-enable auto-scroll if near bottom
          const isNearBottom = content.scrollHeight - content.scrollTop - content.clientHeight < 50;
          if (isNearBottom) {
            userScrolledUp = false;
            autoScroll = true;
          }
        }
      }, { passive: true });

      const observer = new MutationObserver(() => scrollToBottom());
      observer.observe(content, { childList: true, subtree: true });
    };

    conv.addMessage = (msg) => {
      const messageEl = createMessageElement(msg);
      content.appendChild(messageEl);
      if (msg.type === 'incoming') {
        const messageContent = messageEl.querySelector('.message-content');
        renderMath(messageContent);
        processCodeBlocks(messageContent);
      }
      if (typeof lucide !== 'undefined') lucide.createIcons();
      
      // Always scroll to bottom for outgoing messages or if we're already near bottom
      const isNearBottom = content.scrollHeight - content.scrollTop - content.clientHeight < 100;
      if (msg.type === 'outgoing' || isNearBottom) {
        scrollToBottom(true, true); // Force scroll with instant behavior
      }
      
      return messageEl;
    };

    conv.createStreamedMessage = ({ type, showAvatar = false }) => {
      const messageEl = createMessageElement({ type, text: '', showAvatar });
      content.appendChild(messageEl);
      return messageEl;
    };

    conv.streamMessage = (messageEl, fullText) => {
      const contentDiv = messageEl.querySelector('.message-content');
      if (!contentDiv) return;
      
      let textWrapper = contentDiv.querySelector('.text-wrapper');
      if (!textWrapper) {
        textWrapper = document.createElement('div');
        textWrapper.className = 'text-wrapper';
        contentDiv.appendChild(textWrapper);
      }

      const now = Date.now();
      const processedText = fullText.replace(/\$\$\s*([\s\S]*?)\s*\$\$/g, '\n```math\n$1\n```\n');
      
      // Mark as streaming start
      isStreaming = true;
      clearTimeout(streamEndTimeout);
      
      // Only update if enough time has passed since last update
      if (now - lastStreamUpdate < STREAM_UPDATE_THROTTLE) {
        if (!pendingStreamUpdate) {
          pendingStreamUpdate = requestAnimationFrame(() => {
            updateMessageContent(textWrapper, processedText);
            pendingStreamUpdate = null;
          });
        }
      } else {
        updateMessageContent(textWrapper, processedText);
        lastStreamUpdate = now;
      }
      
      // Mark streaming as ended after a short delay of no updates
      streamEndTimeout = setTimeout(() => {
        isStreaming = false;
        // Process any pending updates
        if (pendingStreamUpdate) {
          cancelAnimationFrame(pendingStreamUpdate);
          updateMessageContent(textWrapper, processedText);
          pendingStreamUpdate = null;
        }
        // One final scroll to ensure we're at the bottom if near it
        const scrollBottom = content.scrollHeight - content.scrollTop - content.clientHeight;
        if (scrollBottom < MIN_SCROLL_DISTANCE * 2) {
          setTimeout(() => scrollToBottom(true, true), 16);
        }
      }, 200);
    };
    
    // Helper function to update message content with batching
    const updateMessageContent = (textWrapper, processedText) => {
      // Use DocumentFragment to batch DOM updates
      const fragment = document.createDocumentFragment();
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = marked.parse(processedText, { breaks: true, gfm: true });
      
      while (tempDiv.firstChild) {
        fragment.appendChild(tempDiv.firstChild);
      }
      
      // Replace content in one operation
      textWrapper.innerHTML = '';
      textWrapper.appendChild(fragment);
      
      // Process math and code blocks
      renderMath(textWrapper);
      processCodeBlocks(textWrapper);
      
      // Only auto-scroll if near bottom
      const scrollBottom = content.scrollHeight - content.scrollTop - content.clientHeight;
      if (scrollBottom < MIN_SCROLL_DISTANCE * 2) {
        scrollToBottom(true, true);
      }
      
      lastStreamUpdate = Date.now();
    };

    conv.finalizeMessage = (messageEl) => {
      if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    conv.showTypingIndicator = () => {
      conv.removeTypingIndicator();
      const typingEl = document.createElement('div');
      typingEl.className = 'message message-incoming message-typing message-with-avatar';
      typingEl.innerHTML = `
        <div class="message-avatar"><img src="https://avatar.vercel.sh/ai.png" alt="ai avatar" /></div>
        <div class="message-content"><div class="typing-indicator"><span></span><span></span><span></span></div></div>`;
      content.appendChild(typingEl);
      scrollToBottom();
    };

    conv.removeTypingIndicator = () => {
      content.querySelector('.message-typing')?.remove();
    };

    setupAutoScroll();
    scrollToBottom();
    conv.initialized = true;
  };

  const setupHljsThemeSwitcher = () => {
    if (window.hljsThemeSwitcherInitialized) return;
    const lightThemeUrl = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-light.min.css';
    const darkThemeUrl = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css';
    
    const applyTheme = () => {
      const themeLink = document.getElementById('hljs-theme');
      if (themeLink) {
        themeLink.href = document.documentElement.classList.contains('dark') ? darkThemeUrl : lightThemeUrl;
      }
    };

    const observer = new MutationObserver(applyTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    applyTheme();
    window.hljsThemeSwitcherInitialized = true;
  };

  const init = () => {
    document.querySelectorAll('.conversation').forEach(initializeComponent);
  };

  if (window.conversationDependenciesLoaded) {
    init();
  } else if (!window.conversationDependenciesLoading) {
    window.conversationDependenciesLoading = true;
    Promise.all([
      loadStylesheet(dependencies.css.katex),
      loadStylesheet(dependencies.css.hljs, 'hljs-theme'),
      loadScript(dependencies.js.marked),
      loadScript(dependencies.js.katex),
      loadScript(dependencies.js.hljs)
    ]).then(() => loadScript(dependencies.js.katexAutoRender))
      .then(() => {
        window.conversationDependenciesLoaded = true;
        window.conversationDependenciesLoading = false;
        init();
        setupHljsThemeSwitcher();
      }).catch(error => {
        console.error("Failed to load conversation component dependencies:", error);
        window.conversationDependenciesLoading = false;
      });
  }
}

document.addEventListener('DOMContentLoaded', conversation);