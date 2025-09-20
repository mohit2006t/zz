function accordion() {
    document.querySelectorAll(".accordion").forEach((accordionElement, accordionIndex) => {
      const isSingleToggle = accordionElement.classList.contains("accordion-single-toggle");
      const items = Array.from(accordionElement.querySelectorAll(".accordion-item"));
      const setItemState = (item, isActive) => {
        const trigger = item.querySelector(".accordion-trigger");
        const content = item.querySelector(".accordion-content");
        if (!trigger || !content)
          return;
        trigger.setAttribute("aria-expanded", isActive);
        content.style.height = isActive ? `${content.scrollHeight}px` : "0";
      };
      items.forEach((item, itemIndex) => {
        const trigger = item.querySelector(".accordion-trigger");
        const content = item.querySelector(".accordion-content");
        const uniqueId = `accordion-${accordionIndex}-item-${itemIndex}`;
        if (!trigger || !content)
          return;
        trigger.id = `${uniqueId}-trigger`;
        content.id = `${uniqueId}-content`;
        trigger.setAttribute("aria-controls", content.id);
        content.setAttribute("aria-labelledby", trigger.id);
        setItemState(item, trigger.getAttribute("aria-expanded") === "true");
      });
      accordionElement.addEventListener("click", (event) => {
        const trigger = event.target.closest(".accordion-trigger");
        if (!trigger || trigger.closest(".is-disabled"))
          return;
        const item = trigger.closest(".accordion-item");
        if (isSingleToggle) {
          items.forEach((otherItem) => {
            if (otherItem !== item)
              setItemState(otherItem, false);
          });
        }
        setItemState(item, trigger.getAttribute("aria-expanded") !== "true");
      });
    });
  }
  document.addEventListener("DOMContentLoaded", accordion);
  
  function dropdown() {
    const updateScrollLock = (lock) => {
      const overflow = lock ? "hidden" : "";
      document.documentElement.style.overflow = overflow;
      document.body.style.overflow = overflow;
    };
    const manageIconSpacing = (menuContent) => {
      const hasAnyIcon = [...menuContent.querySelectorAll(".dropdown-menu-item")].some((item) => item.parentElement === menuContent && item.querySelector("i, svg"));
      menuContent.classList.toggle("has-icons", hasAnyIcon);
    };
    const positionContent = (trigger, content) => {
      const rect = trigger.getBoundingClientRect();
      const { innerHeight: vh, innerWidth: vw } = window;
      const margin = 8;
      const isSubMenu = content.classList.contains("dropdown-menu-sub-content");
      const offset = isSubMenu ? -6 : 6;
      let top, left;
      if (isSubMenu) {
        const parentMenuRect = trigger.closest(".dropdown-menu-content, .dropdown-menu-sub-content").getBoundingClientRect();
        left = parentMenuRect.right + offset;
        if (left + content.offsetWidth > vw) {
          left = parentMenuRect.left - content.offsetWidth - offset;
        }
        top = rect.top;
      } else {
        top = rect.bottom + offset;
        if (top + content.offsetHeight > vh) {
          top = rect.top - content.offsetHeight - offset;
        }
        left = rect.left;
        if (left + content.offsetWidth > vw) {
          left = vw - content.offsetWidth - margin;
        }
      }
      Object.assign(content.style, { top: `${top}px`, left: `${left}px` });
    };
    const openMenu = (trigger, content) => {
      document.querySelectorAll(".dropdown-menu-content.is-active").forEach((activeContent) => {
        if (activeContent !== content) {
          activeContent.classList.remove("is-active");
        }
      });
      content.classList.add("is-active");
      manageIconSpacing(content);
      positionContent(trigger, content);
      updateScrollLock(true);
    };
    const closeAllMenus = () => {
      document.querySelectorAll(".is-active").forEach((el) => el.classList.remove("is-active"));
      updateScrollLock(false);
    };
    document.querySelectorAll(".dropdown-menu").forEach((menuContainer) => {
      const trigger = menuContainer.querySelector(".dropdown-menu-trigger");
      const content = menuContainer.querySelector(".dropdown-menu-content");
      const isHoverTrigger = menuContainer.classList.contains("trigger-hover");
      let leaveTimeout;
      if (trigger && content) {
        if (isHoverTrigger) {
          menuContainer.addEventListener("mouseenter", () => {
            clearTimeout(leaveTimeout);
            openMenu(trigger, content);
          });
          menuContainer.addEventListener("mouseleave", () => {
            leaveTimeout = setTimeout(() => {
              content.classList.remove("is-active");
              if (!document.querySelector(".dropdown-menu-content.is-active")) {
                updateScrollLock(false);
              }
            }, 200);
          });
        } else {
          trigger.addEventListener("click", (e) => {
            e.stopPropagation();
            const isActive = content.classList.contains("is-active");
            if (isActive) {
              closeAllMenus();
            } else {
              openMenu(trigger, content);
            }
          });
        }
      }
    });
    document.body.addEventListener("click", (e) => {
      if (!e.target.closest(".dropdown-menu")) {
        closeAllMenus();
      } else if (e.target.closest(".dropdown-menu-item:not(.dropdown-menu-sub-trigger)")) {
        closeAllMenus();
      }
    });
    document.querySelectorAll(".dropdown-menu-sub").forEach((sub) => {
      const trigger = sub.querySelector(".dropdown-menu-sub-trigger");
      const content = sub.querySelector(".dropdown-menu-sub-content");
      sub.addEventListener("mouseenter", () => {
        const parentMenu = sub.parentElement;
        parentMenu.querySelectorAll(".dropdown-menu-sub-content.is-active").forEach((c) => {
          if (c !== content) {
            c.classList.remove("is-active");
            c.previousElementSibling.classList.remove("is-active");
          }
        });
        content.classList.add("is-active");
        trigger.classList.add("is-active");
        manageIconSpacing(content);
        positionContent(trigger, content);
      });
      sub.addEventListener("mouseleave", () => {
        content.classList.remove("is-active");
        trigger.classList.remove("is-active");
      });
    });
    const reposition = () => document.querySelectorAll(".dropdown-menu-content.is-active").forEach((menu) => positionContent(menu.previousElementSibling, menu));
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
  }
  document.addEventListener("DOMContentLoaded", dropdown);
  
  function toggle() {
    document.querySelectorAll(".toggle:not([aria-pressed])").forEach((button) => {
      button.setAttribute("aria-pressed", "false");
    });
    document.body.addEventListener("click", (event) => {
      const button = event.target.closest(".toggle");
      if (button && !button.disabled) {
        const isPressed = button.getAttribute("aria-pressed") === "true";
        button.setAttribute("aria-pressed", String(!isPressed));
      }
    });
  }
  document.addEventListener("DOMContentLoaded", toggle);
  
  function command() {
    document.querySelectorAll(".command:not(.command-initialized)").forEach((commandElement) => {
      const input = commandElement.querySelector(".command-input");
      const list = commandElement.querySelector(".command-list");
      const emptyState = commandElement.querySelector(".command-empty");
      if (!input || !list)
        return;
      const allItems = Array.from(commandElement.querySelectorAll(".command-item"));
      const allGroups = Array.from(commandElement.querySelectorAll(".command-group"));
      const allSeparators = Array.from(commandElement.querySelectorAll(".command-separator"));
      let filteredItems = [];
      let selectedIndex = -1;
      const updateSelection = (newIndex) => {
        if (selectedIndex > -1 && filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].removeAttribute("aria-selected");
        }
        selectedIndex = newIndex;
        if (selectedIndex > -1 && filteredItems[selectedIndex]) {
          const selectedItem = filteredItems[selectedIndex];
          selectedItem.setAttribute("aria-selected", "true");
          selectedItem.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
      };
      const updateVisibility = () => {
        const query = input.value.toLowerCase().trim();
        filteredItems = [];
        allItems.forEach((item) => {
          const isMatch = !query || item.textContent.toLowerCase().includes(query);
          item.style.display = isMatch ? "flex" : "none";
          if (isMatch)
            filteredItems.push(item);
        });
        allGroups.forEach((group) => {
          const hasVisibleItems = Array.from(group.querySelectorAll(".command-item")).some((item) => item.style.display !== "none");
          group.style.display = hasVisibleItems ? "block" : "none";
        });
        allSeparators.forEach((sep, index) => {
          const nextGroup = sep.nextElementSibling;
          sep.style.display = nextGroup && nextGroup.style.display !== "none" ? "block" : "none";
        });
        if (emptyState) {
          emptyState.style.display = filteredItems.length === 0 ? "block" : "none";
        }
        updateSelection(-1);
      };
      const executeItem = (item) => {
        if (item && !item.dataset.disabled) {
          item.click();
        }
      };
      input.addEventListener("input", updateVisibility);
      input.addEventListener("keydown", (e) => {
        if (filteredItems.length === 0)
          return;
        switch (e.key) {
          case "ArrowDown":
            e.preventDefault();
            updateSelection((selectedIndex + 1) % filteredItems.length);
            break;
          case "ArrowUp":
            e.preventDefault();
            updateSelection((selectedIndex - 1 + filteredItems.length) % filteredItems.length);
            break;
          case "Enter":
            e.preventDefault();
            if (selectedIndex > -1)
              executeItem(filteredItems[selectedIndex]);
            break;
        }
      });
      list.addEventListener("mousemove", (e) => {
        const targetItem = e.target.closest(".command-item");
        if (targetItem && filteredItems.includes(targetItem)) {
          const index = filteredItems.indexOf(targetItem);
          if (index !== selectedIndex) {
            updateSelection(index);
          }
        }
      });
      list.addEventListener("click", (e) => {
        const targetItem = e.target.closest(".command-item");
        if (targetItem)
          executeItem(targetItem);
      });
      updateVisibility();
      commandElement.classList.add("command-initialized");
    });
  }
  document.addEventListener("DOMContentLoaded", command);
  
  function popover() {
    const updateScrollLock = () => {
      const isOpen = !!document.querySelector('.popover-content[data-state="open"]');
      document.body.style.overflow = isOpen ? "hidden" : "";
    };
    const getPositioning = (content) => {
      const classList = content.classList;
      const side = classList.contains("side-top") ? "top" : classList.contains("side-right") ? "right" : classList.contains("side-left") ? "left" : "bottom";
      const align = classList.contains("align-center") ? "center" : classList.contains("align-end") ? "end" : "start";
      return { side, align };
    };
    const positionContent = (trigger, content) => {
      const rect = trigger.getBoundingClientRect();
      const { innerHeight: vh, innerWidth: vw } = window;
      const margin = 8;
      const offset = parseInt(getComputedStyle(content).getPropertyValue("--offset"), 10) || 0;
      let { side, align } = getPositioning(content);
      let top, left;
      const tempContent = content.cloneNode(true);
      tempContent.style.opacity = "0";
      tempContent.style.pointerEvents = "none";
      document.body.appendChild(tempContent);
      const contentRect = tempContent.getBoundingClientRect();
      document.body.removeChild(tempContent);
      if (side === "bottom" && rect.bottom + contentRect.height + margin > vh)
        side = "top";
      else if (side === "top" && rect.top - contentRect.height - margin < 0)
        side = "bottom";
      else if (side === "right" && rect.right + contentRect.width + margin > vw)
        side = "left";
      else if (side === "left" && rect.left - contentRect.width - margin < 0)
        side = "right";
      if (side === "left" || side === "right") {
        top = align === "start" ? rect.top : align === "end" ? rect.bottom - contentRect.height : rect.top + rect.height / 2 - contentRect.height / 2;
        left = side === "right" ? rect.right + offset : rect.left - contentRect.width - offset;
      } else {
        left = align === "start" ? rect.left : align === "end" ? rect.right - contentRect.width : rect.left + rect.width / 2 - contentRect.width / 2;
        top = side === "bottom" ? rect.bottom + offset : rect.top - contentRect.height - offset;
      }
      Object.assign(content.style, {
        top: `${Math.max(margin, Math.min(top, vh - contentRect.height - margin))}px`,
        left: `${Math.max(margin, Math.min(left, vw - contentRect.width - margin))}px`
      });
    };
    document.body.addEventListener("click", (e) => {
      const target = e.target;
      const trigger = target.closest(".popover-trigger");
      const activePopoverContent = document.querySelector('.popover-content[data-state="open"]');
      if (trigger) {
        const content = trigger.nextElementSibling;
        const isExpanded = content.getAttribute("data-state") === "open";
        if (activePopoverContent && activePopoverContent !== content) {
          activePopoverContent.setAttribute("data-state", "closed");
        }
        content.setAttribute("data-state", isExpanded ? "closed" : "open");
        if (!isExpanded) {
          positionContent(trigger, content);
        }
        updateScrollLock();
      } else if (activePopoverContent && !activePopoverContent.contains(target)) {
        activePopoverContent.setAttribute("data-state", "closed");
        updateScrollLock();
      }
    });
    const repositionActivePopovers = () => {
      document.querySelectorAll('.popover-content[data-state="open"]').forEach((content) => {
        const trigger = content.previousElementSibling;
        if (trigger?.classList.contains("popover-trigger")) {
          positionContent(trigger, content);
        }
      });
    };
    window.addEventListener("resize", repositionActivePopovers);
    window.addEventListener("scroll", repositionActivePopovers, true);
  }
  document.addEventListener("DOMContentLoaded", popover);
  
  function combobox() {
    const closeAllComboboxes = (except) => {
      document.querySelectorAll(".combobox.combobox-initialized").forEach((el) => {
        if (el !== except && el.isOpen) {
          el.close();
        }
      });
    };
    document.querySelectorAll(".combobox:not(.combobox-initialized)").forEach((comboboxElement) => {
      const trigger = comboboxElement.querySelector(".combobox-trigger");
      const content = comboboxElement.querySelector(".combobox-content");
      const valueText = trigger.querySelector(".value-text");
      const commandInput = content.querySelector(".command-input");
      const commandItems = content.querySelectorAll(".command-item");
      if (!trigger || !content || !valueText)
        return;
      comboboxElement.isOpen = false;
      const checkForIcons = () => {
        const hasIcons = content.querySelector(".item-icon");
        content.classList.toggle("has-icons", !!hasIcons);
      };
      const positionContent = () => {
        const rect = trigger.getBoundingClientRect();
        content.style.setProperty("--trigger-width", `${rect.width}px`);
        const top = rect.bottom + 4;
        const left = rect.left;
        Object.assign(content.style, { top: `${top}px`, left: `${left}px` });
      };
      const openCombobox = () => {
        if (comboboxElement.isOpen)
          return;
        closeAllComboboxes(comboboxElement);
        comboboxElement.isOpen = true;
        content.setAttribute("data-state", "open");
        trigger.setAttribute("aria-expanded", "true");
        checkForIcons();
        positionContent();
        commandInput?.focus();
      };
      const closeCombobox = () => {
        if (!comboboxElement.isOpen)
          return;
        comboboxElement.isOpen = false;
        content.setAttribute("data-state", "closed");
        trigger.setAttribute("aria-expanded", "false");
        if (commandInput) {
          commandInput.value = "";
          commandInput.dispatchEvent(new Event("input"));
        }
      };
      comboboxElement.close = closeCombobox;
      const updateSelection = (item) => {
        if (!item || item.dataset.disabled === "true")
          return;
        const newText = item.querySelector("span").textContent.trim();
        valueText.textContent = newText;
        valueText.classList.remove("placeholder");
        commandItems.forEach((i) => i.removeAttribute("data-selected"));
        item.setAttribute("data-selected", "true");
        closeCombobox();
      };
      trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        comboboxElement.isOpen ? closeCombobox() : openCombobox();
      });
      content.addEventListener("click", (e) => {
        const targetItem = e.target.closest(".command-item");
        if (targetItem) {
          updateSelection(targetItem);
        }
      });
      window.addEventListener("resize", () => {
        if (comboboxElement.isOpen)
          positionContent();
      });
      comboboxElement.classList.add("combobox-initialized");
    });
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".combobox")) {
        closeAllComboboxes(null);
      }
    });
  }
  document.addEventListener("DOMContentLoaded", combobox);
  
  function menubar() {
    const updateScrollLock = () => {
      const isOpen = !!document.querySelector('.menubar-content[data-state="open"], .menubar-sub-content[data-state="open"]');
      document.body.style.overflow = isOpen ? "hidden" : "";
    };
    const getPositioning = (content) => {
      const c = content.classList;
      const side = c.contains("side-top") ? "top" : c.contains("side-right") ? "right" : c.contains("side-left") ? "left" : "bottom";
      const align = c.contains("align-center") ? "center" : c.contains("align-end") ? "end" : "start";
      return { side, align };
    };
    const positionContent = (trigger, content) => {
      const rect = trigger.getBoundingClientRect();
      const { innerHeight: vh, innerWidth: vw } = window;
      const margin = 8;
      const isSubMenu = content.classList.contains("menubar-sub-content");
      const offset = isSubMenu ? 0 : parseInt(getComputedStyle(content).getPropertyValue("--offset"), 10) || 0;
      const tempContent = content.cloneNode(true);
      tempContent.style.opacity = "0";
      tempContent.style.pointerEvents = "none";
      document.body.appendChild(tempContent);
      const contentRect = tempContent.getBoundingClientRect();
      document.body.removeChild(tempContent);
      let top, left;
      if (isSubMenu) {
        left = rect.right + offset;
        if (left + contentRect.width > vw - margin && rect.left - contentRect.width > margin) {
          left = rect.left - contentRect.width - offset;
        }
        top = Math.max(margin, Math.min(rect.top, vh - contentRect.height - margin));
      } else {
        left = rect.left;
        if (left + contentRect.width > vw - margin)
          left = vw - contentRect.width - margin;
        if (left < margin)
          left = margin;
        top = rect.bottom + offset;
        if (top + contentRect.height > vh - margin && rect.top - contentRect.height > margin) {
          top = rect.top - contentRect.height - offset;
        }
      }
      Object.assign(content.style, { top: `${top}px`, left: `${left}px` });
    };
    const closeAllMenus = (except = null) => {
      document.querySelectorAll(".menubar-menu").forEach((menu) => {
        if (except && menu.contains(except))
          return;
        const trigger = menu.querySelector(".menubar-trigger");
        const content = menu.querySelector(".menubar-content");
        if (trigger && content) {
          trigger.setAttribute("data-state", "closed");
          content.setAttribute("data-state", "closed");
        }
      });
      updateScrollLock();
    };
    const openMenu = (menu) => {
      closeAllMenus(menu);
      const trigger = menu.querySelector(".menubar-trigger");
      const content = menu.querySelector(".menubar-content");
      if (trigger && content) {
        trigger.setAttribute("data-state", "open");
        content.setAttribute("data-state", "open");
        positionContent(trigger, content);
        updateScrollLock();
      }
    };
    document.body.addEventListener("click", (e) => {
      const trigger = e.target.closest(".menubar-trigger");
      if (trigger) {
        e.stopPropagation();
        const menu = trigger.closest(".menubar-menu");
        const isOpen = trigger.getAttribute("data-state") === "open";
        isOpen ? closeAllMenus() : openMenu(menu);
        return;
      }
      if (e.target.closest(".menubar-item") && !e.target.closest(".menubar-sub-trigger")) {
        closeAllMenus();
        return;
      }
      if (!e.target.closest(".menubar-menu")) {
        closeAllMenus();
      }
    });
    let activeMenubar = null;
    document.querySelectorAll(".menubar").forEach((menubar2) => {
      menubar2.addEventListener("mouseover", () => activeMenubar = menubar2);
      menubar2.querySelectorAll(".menubar-menu .menubar-trigger").forEach((trigger) => {
        trigger.addEventListener("mouseenter", () => {
          if (activeMenubar && activeMenubar.querySelector('.menubar-content[data-state="open"]')) {
            openMenu(trigger.closest(".menubar-menu"));
          }
        });
      });
    });
    document.querySelectorAll(".menubar-sub").forEach((sub) => {
      const trigger = sub.querySelector(".menubar-sub-trigger");
      const content = sub.querySelector(".menubar-sub-content");
      let timer;
      const openSub = (e) => {
        e.stopPropagation();
        clearTimeout(timer);
        const parentContent = sub.closest(".menubar-content, .menubar-sub-content");
        if (!parentContent)
          return;
        parentContent.querySelectorAll('.menubar-sub-content[data-state="open"]').forEach((c) => {
          if (c !== content) {
            c.setAttribute("data-state", "closed");
            c.previousElementSibling.setAttribute("data-state", "closed");
          }
        });
        content.setAttribute("data-state", "open");
        trigger.setAttribute("data-state", "open");
        positionContent(trigger, content);
      };
      const closeSub = () => {
        timer = setTimeout(() => {
          content.setAttribute("data-state", "closed");
          trigger.setAttribute("data-state", "closed");
        }, 100);
      };
      sub.addEventListener("mouseenter", openSub);
      sub.addEventListener("mouseleave", closeSub);
    });
    const reposition = () => {
      document.querySelectorAll('.menubar-content[data-state="open"], .menubar-sub-content[data-state="open"]').forEach((content) => {
        const trigger = content.previousElementSibling;
        if (trigger)
          positionContent(trigger, content);
      });
    };
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
  }
  document.addEventListener("DOMContentLoaded", menubar);
  
  function navigationMenu() {
    document.querySelectorAll(".navigation-menu-list").forEach((list) => {
      const items = Array.from(list.querySelectorAll(".navigation-menu-item"));
      let openTrigger = null;
      let timer;
      const closeAllMenus = () => {
        items.forEach((item) => {
          const trigger = item.querySelector(".navigation-menu-trigger");
          if (trigger)
            trigger.setAttribute("aria-expanded", "false");
        });
        openTrigger = null;
      };
      const open = (trigger) => {
        if (openTrigger === trigger)
          return;
        closeAllMenus();
        trigger.setAttribute("aria-expanded", "true");
        openTrigger = trigger;
      };
      items.forEach((item) => {
        const trigger = item.querySelector(".navigation-menu-trigger");
        if (trigger) {
          item.addEventListener("mouseenter", () => {
            clearTimeout(timer);
            open(trigger);
          });
          item.addEventListener("mouseleave", () => {
            timer = setTimeout(closeAllMenus, 150);
          });
          trigger.addEventListener("focus", () => open(trigger));
        }
      });
      document.addEventListener("click", (e) => {
        if (!list.contains(e.target)) {
          closeAllMenus();
        }
      }, true);
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          closeAllMenus();
        }
      });
    });
  }
  document.addEventListener("DOMContentLoaded", navigationMenu);
  
  function toggleGroup() {
    document.querySelectorAll(".toggle-group-item:not([aria-pressed])").forEach((item) => {
      item.setAttribute("aria-pressed", "false");
    });
    document.body.addEventListener("click", (event) => {
      const item = event.target.closest(".toggle-group-item");
      if (!item)
        return;
      const group = item.closest(".toggle-group");
      if (!group || group.classList.contains("toggle-group-disabled") || item.disabled) {
        return;
      }
      const isPressed = item.getAttribute("aria-pressed") === "true";
      const isSingleSelection = group.getAttribute("role") === "radiogroup";
      if (isSingleSelection) {
        if (isPressed)
          return;
        group.querySelectorAll(".toggle-group-item").forEach((el) => {
          el.setAttribute("aria-pressed", "false");
        });
        item.setAttribute("aria-pressed", "true");
      } else {
        item.setAttribute("aria-pressed", String(!isPressed));
      }
    });
  }
  document.addEventListener("DOMContentLoaded", toggleGroup);
  
  function tooltip() {
    const showDelay = 100;
    const hideDelay = 100;
    const autoPositionTooltip = (trigger, content) => {
      const preferredPosition = trigger.parentElement.querySelector(".tooltip-content").dataset.position || "top";
      const triggerRect = trigger.getBoundingClientRect();
      const contentRect = content.getBoundingClientRect();
      const viewport = { width: window.innerWidth, height: window.innerHeight };
      const margin = 8;
      let bestPosition = preferredPosition;
      const positions = {
        top: () => triggerRect.top - contentRect.height - margin > 0,
        bottom: () => triggerRect.bottom + contentRect.height + margin < viewport.height,
        left: () => triggerRect.left - contentRect.width - margin > 0,
        right: () => triggerRect.right + contentRect.width + margin < viewport.width
      };
      if (!positions[preferredPosition]()) {
        const opposites = { top: "bottom", bottom: "top", left: "right", right: "left" };
        if (positions[opposites[preferredPosition]]()) {
          bestPosition = opposites[preferredPosition];
        } else {
          const fallbackOrder = ["bottom", "top", "right", "left"];
          bestPosition = fallbackOrder.find((pos) => positions[pos]()) || "bottom";
        }
      }
      content.dataset.position = bestPosition;
    };
    document.querySelectorAll(".tooltip").forEach((tooltipWrapper, index) => {
      const trigger = tooltipWrapper.querySelector(".tooltip-trigger");
      const content = tooltipWrapper.querySelector(".tooltip-content");
      const uniqueId = `tooltip-${index}`;
      if (!trigger || !content)
        return;
      content.setAttribute("id", uniqueId);
      content.setAttribute("role", "tooltip");
      trigger.setAttribute("aria-describedby", uniqueId);
      let showTimeoutId;
      let hideTimeoutId;
      const show = () => {
        clearTimeout(hideTimeoutId);
        showTimeoutId = setTimeout(() => {
          autoPositionTooltip(trigger, content);
          content.classList.add("is-active");
        }, showDelay);
      };
      const hide = () => {
        clearTimeout(showTimeoutId);
        hideTimeoutId = setTimeout(() => {
          content.classList.remove("is-active");
        }, hideDelay);
      };
      trigger.addEventListener("mouseenter", show);
      trigger.addEventListener("focus", show);
      trigger.addEventListener("mouseleave", hide);
      trigger.addEventListener("blur", hide);
      content.addEventListener("mouseenter", () => clearTimeout(hideTimeoutId));
      content.addEventListener("mouseleave", hide);
    });
  }
  document.addEventListener("DOMContentLoaded", tooltip);
  
  function pagination() {
    document.querySelectorAll(".pagination").forEach(renderPagination);
    document.body.addEventListener("click", (event) => {
      const item = event.target.closest(".pagination-item");
      const paginationContainer = event.target.closest(".pagination");
      if (!item || !paginationContainer || item.disabled || item.getAttribute("aria-current") === "page") {
        return;
      }
      const currentPage = parseInt(paginationContainer.dataset.currentPage, 10);
      let newPage;
      if (item.classList.contains("pagination-prev")) {
        newPage = currentPage - 1;
      } else if (item.classList.contains("pagination-next")) {
        newPage = currentPage + 1;
      } else {
        newPage = parseInt(item.textContent, 10);
      }
      paginationContainer.dataset.currentPage = newPage;
      renderPagination(paginationContainer);
    });
  }
  function renderPagination(container) {
    const currentPage = parseInt(container.dataset.currentPage, 10);
    const totalPages = parseInt(container.dataset.totalPages, 10);
    const prevButton = container.querySelector(".pagination-prev");
    const nextButton = container.querySelector(".pagination-next");
    container.querySelectorAll(".pagination-item:not(.pagination-prev):not(.pagination-next), .pagination-ellipsis").forEach((el) => el.remove());
    const pageNumbers = getPageNumbers(currentPage, totalPages);
    pageNumbers.forEach((page) => {
      if (page === "...") {
        const ellipsis = document.createElement("span");
        ellipsis.className = "pagination-ellipsis";
        ellipsis.textContent = "...";
        container.insertBefore(ellipsis, nextButton);
      } else {
        const button = document.createElement("button");
        button.className = "pagination-item";
        button.textContent = page;
        if (page === currentPage) {
          button.setAttribute("aria-current", "page");
        }
        container.insertBefore(button, nextButton);
      }
    });
    if (prevButton)
      prevButton.disabled = currentPage <= 1;
    if (nextButton)
      nextButton.disabled = currentPage >= totalPages;
  }
  function getPageNumbers(currentPage, totalPages) {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }
    if (currentPage >= totalPages - 3) {
      return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
  }
  document.addEventListener("DOMContentLoaded", pagination);
  
  function input() {
    document.body.addEventListener("click", (e) => {
      const copyBtn = e.target.closest(".copy-btn, .input-copy-btn");
      const clearBtn = e.target.closest(".clear-btn, .input-clear-btn");
      const toggleBtn = e.target.closest(".password-toggle, .password-toggle-btn");
      if (copyBtn) {
        const input2 = copyBtn.closest(".input-wrapper")?.querySelector(".input");
        if (input2) {
          navigator.clipboard.writeText(input2.value).then(() => {
            copyBtn.classList.add("is-copied");
            setTimeout(() => copyBtn.classList.remove("is-copied"), 1500);
          }).catch(console.error);
        }
      }
      if (clearBtn) {
        const wrapper = clearBtn.closest(".input-wrapper");
        const input2 = wrapper?.querySelector(".input");
        if (input2) {
          input2.value = "";
          input2.focus();
          wrapper.classList.remove("has-value");
        }
      }
      if (toggleBtn) {
        const input2 = toggleBtn.closest(".input-wrapper")?.querySelector(".input");
        if (input2) {
          const isPassword = input2.type === "password";
          input2.type = isPassword ? "text" : "password";
          toggleBtn.classList.toggle("toggled", isPassword);
          toggleBtn.setAttribute("aria-pressed", isPassword ? "true" : "false");
        }
      }
    });
    document.body.addEventListener("input", (e) => {
      if (e.target.matches(".input-wrapper .input")) {
        const wrapper = e.target.closest(".input-wrapper");
        if (wrapper.querySelector(".input-clear-btn")) {
          wrapper.classList.toggle("has-value", e.target.value.length > 0);
        }
      }
    });
    document.querySelectorAll(".input-wrapper .input").forEach((input2) => {
      if (input2.value.length > 0 && input2.closest(".input-wrapper").querySelector(".input-clear-btn")) {
        input2.closest(".input-wrapper").classList.add("has-value");
      }
    });
    document.querySelectorAll(".input-file input[type=file]").forEach((fileInput) => {
      const textEl = fileInput.parentElement.querySelector(".input-file-text");
      const defaultText = textEl?.textContent || "Select file(s)";
      fileInput.addEventListener("change", () => {
        textEl.textContent = fileInput.files.length ? [...fileInput.files].map((f) => f.name).join(", ") : defaultText;
      });
    });
  }
  document.addEventListener("DOMContentLoaded", input);
  
  function dialog() {
    const dialogTriggers = document.querySelectorAll(".dialog-trigger");
    dialogTriggers.forEach((trigger) => {
      const dialogId = trigger.getAttribute("data-target");
      const dialogElement = document.querySelector(dialogId);
      if (!dialogElement)
        return;
      const closeButtons = dialogElement.querySelectorAll(".dialog-close-btn");
      const overlay = dialogElement.querySelector(".dialog-overlay");
      const focusableSelector = 'a[href], button:not([disabled]), input, textarea, select, details, [tabindex]:not([tabindex="-1"])';
      let focusableElements, firstFocusableElement, lastFocusableElement;
      const openDialog = () => {
        dialogElement.style.display = "block";
        document.body.style.overflow = "hidden";
        focusableElements = Array.from(dialogElement.querySelectorAll(focusableSelector));
        firstFocusableElement = focusableElements[0];
        lastFocusableElement = focusableElements[focusableElements.length - 1];
        setTimeout(() => firstFocusableElement?.focus(), 50);
      };
      const closeDialog = () => {
        const mediaElements = dialogElement.querySelectorAll("video, audio");
        mediaElements.forEach((media) => {
          if (!media.paused) {
            media.pause();
          }
          media.currentTime = 0;
        });
        dialogElement.style.display = "none";
        document.body.style.overflow = "";
        trigger.focus();
      };
      const handleKeydown = (e) => {
        if (e.key === "Escape") {
          closeDialog();
          return;
        }
        if (e.key === "Tab" && focusableElements.length) {
          const { activeElement } = document;
          if (e.shiftKey && activeElement === firstFocusableElement) {
            lastFocusableElement.focus();
            e.preventDefault();
          } else if (!e.shiftKey && activeElement === lastFocusableElement) {
            firstFocusableElement.focus();
            e.preventDefault();
          }
        }
      };
      trigger.addEventListener("click", openDialog);
      closeButtons.forEach((btn) => btn.addEventListener("click", closeDialog));
      if (overlay) {
        overlay.addEventListener("click", (e) => {
          if (e.target === overlay)
            closeDialog();
        });
      }
      dialogElement.addEventListener("keydown", handleKeydown);
    });
  }
  document.addEventListener("DOMContentLoaded", dialog);
  
  function inputOTP() {
    document.querySelectorAll(".input-otp:not(.input-otp-initialized)").forEach((otpElement) => {
      const slots = Array.from(otpElement.querySelectorAll(".input-otp-slot"));
      const valueInput = otpElement.querySelector('input[type="hidden"]');
      if (slots.length === 0)
        return;
      let isProgrammaticFocus = false;
      let deselectHandler = null;
      const clearSelection = () => {
        slots.forEach((s) => s.classList.remove("is-selected"));
        if (deselectHandler) {
          document.removeEventListener("click", deselectHandler);
          deselectHandler = null;
        }
      };
      const updateValue = () => {
        const value = slots.map((slot) => slot.value).join("");
        if (valueInput) {
          valueInput.value = value;
        }
      };
      const handleSelectAll = () => {
        clearSelection();
        const filledSlots = slots.filter((slot) => slot.value);
        if (filledSlots.length > 0) {
          filledSlots.forEach((slot) => slot.classList.add("is-selected"));
          isProgrammaticFocus = true;
          filledSlots[filledSlots.length - 1].focus();
          isProgrammaticFocus = false;
          deselectHandler = (e) => {
            if (!otpElement.contains(e.target)) {
              clearSelection();
            }
          };
          document.addEventListener("click", deselectHandler);
        }
      };
      const handleMultiDelete = (selectedSlots) => {
        selectedSlots.forEach((slot) => {
          slot.value = "";
        });
        clearSelection();
        updateValue();
        slots[0].focus();
      };
      const handleSingleDelete = (currentIndex) => {
        let effectiveIndex = currentIndex;
        if (!slots[effectiveIndex].value && effectiveIndex > 0) {
          effectiveIndex--;
        }
        slots[effectiveIndex].value = "";
        updateValue();
        slots[effectiveIndex].focus();
      };
      otpElement.addEventListener("keydown", (e) => {
        const target = e.target;
        if (!target.matches(".input-otp-slot"))
          return;
        const index = slots.indexOf(target);
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
          e.preventDefault();
          handleSelectAll();
          return;
        }
        if (e.key === "Backspace") {
          e.preventDefault();
          const selectedSlots = slots.filter((s) => s.classList.contains("is-selected"));
          if (selectedSlots.length > 0) {
            handleMultiDelete(selectedSlots);
          } else {
            handleSingleDelete(index);
          }
          return;
        }
        clearSelection();
        switch (e.key) {
          case "ArrowLeft":
            e.preventDefault();
            if (index > 0)
              slots[index - 1].focus();
            break;
          case "ArrowRight":
            e.preventDefault();
            if (index < slots.length - 1)
              slots[index + 1].focus();
            break;
        }
      });
      otpElement.addEventListener("input", (e) => {
        const target = e.target;
        if (!target.matches(".input-otp-slot"))
          return;
        clearSelection();
        const index = slots.indexOf(target);
        if (target.value && index < slots.length - 1) {
          slots[index + 1].focus();
        }
        updateValue();
      });
      otpElement.addEventListener("paste", (e) => {
        e.preventDefault();
        clearSelection();
        const pastedData = e.clipboardData.getData("text").trim().slice(0, slots.length);
        pastedData.split("").forEach((char, i) => {
          if (slots[i]) {
            slots[i].value = char;
          }
        });
        const nextFocusIndex = Math.min(pastedData.length, slots.length - 1);
        slots[nextFocusIndex].focus();
        updateValue();
      });
      otpElement.addEventListener("focusin", (e) => {
        if (isProgrammaticFocus)
          return;
        if (e.target.matches(".input-otp-slot")) {
          clearSelection();
          setTimeout(() => e.target.select(), 0);
        }
      });
      otpElement.addEventListener("mousedown", (e) => {
        if (e.target.matches(".input-otp-slot")) {
          e.preventDefault();
          const firstEmptySlot = slots.find((slot) => !slot.value);
          if (firstEmptySlot) {
            firstEmptySlot.focus();
          } else {
            slots[slots.length - 1].focus();
          }
        }
      });
      otpElement.classList.add("input-otp-initialized");
    });
  }
  document.addEventListener("DOMContentLoaded", inputOTP);
  
  function progress() {
    const updateProgress = (progressElement) => {
      const indicator = progressElement.querySelector(".progress-indicator");
      if (!indicator)
        return;
      const value = Number(progressElement.getAttribute("data-value")) || 0;
      const max = Number(progressElement.getAttribute("data-max")) || 100;
      const percentage = Math.min(100, Math.max(0, value / max * 100));
      indicator.style.setProperty("--progress-value", `${percentage}%`);
      progressElement.setAttribute("aria-valuenow", percentage);
    };
    document.querySelectorAll(".progress:not(.progress-initialized)").forEach((progressElement) => {
      updateProgress(progressElement);
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === "attributes" && (mutation.attributeName === "data-value" || mutation.attributeName === "data-max")) {
            updateProgress(progressElement);
          }
        });
      });
      observer.observe(progressElement, { attributes: true });
      progressElement.classList.add("progress-initialized");
    });
  }
  document.addEventListener("DOMContentLoaded", progress);
  
  function carousel() {
    document.querySelectorAll(".carousel:not(.carousel-initialized)").forEach((carouselElement) => {
      const content = carouselElement.querySelector(".carousel-content");
      const items = Array.from(content.children);
      if (items.length <= 1) {
        return;
      }
      const options = {
        loop: carouselElement.classList.contains("carousel-loop"),
        autoplay: carouselElement.classList.contains("carousel-autoplay"),
        autoplayDelay: 3000,
        pauseOnHover: true
      };
      const prevButton = carouselElement.querySelector(".carousel-previous");
      const nextButton = carouselElement.querySelector(".carousel-next");
      const dotsContainer = carouselElement.querySelector(".carousel-dots");
      let dots = [];
      let currentIndex = 0;
      let autoplayTimer = null;
      let isUserInteracting = false;
      const goTo = (index, isUserAction = false) => {
        const newIndex = options.loop ? (index + items.length) % items.length : Math.max(0, Math.min(index, items.length - 1));
        if (newIndex === currentIndex)
          return;
        currentIndex = newIndex;
        update();
        if (isUserAction && options.autoplay) {
          stopAutoplay();
          startAutoplay();
        }
      };
      const update = () => {
        content.style.transform = `translateX(${-currentIndex * 100}%)`;
        items.forEach((item, i) => {
          item.setAttribute("aria-hidden", (i !== currentIndex).toString());
        });
        if (prevButton) {
          const isDisabled = !options.loop && currentIndex === 0;
          prevButton.disabled = isDisabled;
          prevButton.setAttribute("data-disabled", isDisabled.toString());
        }
        if (nextButton) {
          const isDisabled = !options.loop && currentIndex >= items.length - 1;
          nextButton.disabled = isDisabled;
          nextButton.setAttribute("data-disabled", isDisabled.toString());
        }
        dots.forEach((dot, i) => {
          const isActive = i === currentIndex;
          dot.setAttribute("data-active", isActive.toString());
          dot.setAttribute("aria-selected", isActive.toString());
        });
      };
      const startAutoplay = () => {
        if (!options.autoplay || autoplayTimer)
          return;
        autoplayTimer = setInterval(() => {
          if (!isUserInteracting) {
            goTo(currentIndex + 1);
          }
        }, options.autoplayDelay);
      };
      const stopAutoplay = () => {
        clearInterval(autoplayTimer);
        autoplayTimer = null;
      };
      const init = () => {
        if (prevButton)
          prevButton.addEventListener("click", () => goTo(currentIndex - 1, true));
        if (nextButton)
          nextButton.addEventListener("click", () => goTo(currentIndex + 1, true));
        if (dotsContainer) {
          dotsContainer.innerHTML = "";
          dots = items.map((_, i) => {
            const dot = document.createElement("button");
            dot.className = "carousel-dot";
            dot.setAttribute("role", "tab");
            dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
            dot.addEventListener("click", () => goTo(i, true));
            dotsContainer.appendChild(dot);
            return dot;
          });
          dotsContainer.setAttribute("role", "tablist");
        }
        if (options.autoplay && options.pauseOnHover) {
          carouselElement.addEventListener("mouseenter", () => isUserInteracting = true);
          carouselElement.addEventListener("mouseleave", () => isUserInteracting = false);
        }
        update();
        startAutoplay();
        carouselElement.classList.add("carousel-initialized");
        carouselElement.carousel = {
          goTo,
          next: () => goTo(currentIndex + 1, true),
          previous: () => goTo(currentIndex - 1, true),
          destroy: stopAutoplay
        };
      };
      init();
    });
  }
  document.addEventListener("DOMContentLoaded", carousel);
  
  function slider() {
    const sliders = document.querySelectorAll(".slider:not(.slider-initialized)");
    sliders.forEach((slider2) => {
      const track = slider2.querySelector(".slider-track");
      const range = slider2.querySelector(".slider-range");
      const thumb = slider2.querySelector(".slider-thumb");
      const isVertical = slider2.classList.contains("slider-vertical");
      let isActive = false;
      const updateSlider = (clientX, clientY) => {
        if (slider2.hasAttribute("data-disabled"))
          return;
        const rect = track.getBoundingClientRect();
        const step = parseFloat(slider2.dataset.step) || 1;
        const max2 = parseFloat(slider2.dataset.max) || 100;
        let rawValue;
        if (isVertical) {
          rawValue = 1 - (clientY - rect.top) / rect.height;
        } else {
          rawValue = (clientX - rect.left) / rect.width;
        }
        rawValue = Math.max(0, Math.min(1, rawValue));
        const value = rawValue * max2;
        const numSteps = Math.round(value / step);
        const steppedValue = numSteps * step;
        const percent = steppedValue / max2 * 100;
        if (isVertical) {
          range.style.height = `${percent}%`;
          thumb.style.bottom = `${percent}%`;
        } else {
          range.style.width = `${percent}%`;
          thumb.style.left = `${percent}%`;
        }
        slider2.setAttribute("data-value", steppedValue);
      };
      const onDragStart = (e) => {
        isActive = true;
        slider2.classList.add("is-dragging");
        const clientX = e.clientX ?? e.touches[0].clientX;
        const clientY = e.clientY ?? e.touches[0].clientY;
        updateSlider(clientX, clientY);
      };
      const onDragMove = (e) => {
        if (!isActive)
          return;
        e.preventDefault();
        const clientX = e.clientX ?? e.touches[0].clientX;
        const clientY = e.clientY ?? e.touches[0].clientY;
        updateSlider(clientX, clientY);
      };
      const onDragEnd = () => {
        isActive = false;
        slider2.classList.remove("is-dragging");
      };
      slider2.addEventListener("mousedown", onDragStart);
      document.addEventListener("mousemove", onDragMove);
      document.addEventListener("mouseup", onDragEnd);
      slider2.addEventListener("touchstart", onDragStart, { passive: false });
      document.addEventListener("touchmove", onDragMove, { passive: false });
      document.addEventListener("touchend", onDragEnd);
      const initialValue = parseFloat(slider2.dataset.value) || 0;
      const max = parseFloat(slider2.dataset.max) || 100;
      const initialPercent = initialValue / max * 100;
      if (isVertical) {
        range.style.height = `${initialPercent}%`;
        thumb.style.bottom = `${initialPercent}%`;
      } else {
        range.style.width = `${initialPercent}%`;
        thumb.style.left = `${initialPercent}%`;
      }
      slider2.classList.add("slider-initialized");
    });
  }
  document.addEventListener("DOMContentLoaded", slider);
  
  function sonner() {
    let container = null;
    let currentPosition = "bottom-right";
    const toasts = new Map;
    const defaults = {
      position: "bottom-right",
      duration: 4000,
      maxToasts: 5,
      pauseOnHover: true
    };
    const getOrCreateContainer = (position = "bottom-right") => {
      if (container && currentPosition === position) {
        return container;
      }
      const className = `sonner-container sonner-container-${position}`;
      if (container) {
        container.className = className;
      } else {
        container = document.createElement("div");
        container.className = className;
        document.body.appendChild(container);
      }
      currentPosition = position;
      return container;
    };
    const createToast = (options) => {
      const {
        title,
        description,
        duration = defaults.duration,
        icon,
        type = "default",
        action,
        position
      } = options;
      if (position && position !== currentPosition) {
        container = getOrCreateContainer(position);
      }
      const toastId = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const sonnerElement = document.createElement("div");
      sonnerElement.className = `sonner sonner-${type}`;
      sonnerElement.setAttribute("data-toast-id", toastId);
      const defaultIcons = {
        success: "check-circle",
        error: "x-circle",
        warning: "alert-triangle",
        info: "info"
      };
      const iconName = icon || defaultIcons[type];
      if (iconName && type !== "default") {
        const iconEl = document.createElement("i");
        iconEl.className = "sonner-icon";
        iconEl.setAttribute("data-lucide", iconName);
        sonnerElement.appendChild(iconEl);
      }
      const content = document.createElement("div");
      content.className = "sonner-content";
      content.innerHTML = `
              <div class="sonner-title">${title}</div>
              ${description ? `<div class="sonner-description">${description}</div>` : ""}
          `;
      sonnerElement.appendChild(content);
      if (action && action.label && typeof action.onClick === "function") {
        const actionWrapper = document.createElement("div");
        actionWrapper.className = "sonner-action-wrapper";
        const actionButton = document.createElement("button");
        actionButton.className = action.class || "btn btn-sm";
        actionButton.textContent = action.label;
        actionButton.addEventListener("click", (e) => {
          e.stopPropagation();
          action.onClick();
          if (action.dismiss !== false) {
            removeToast();
          }
        });
        actionWrapper.appendChild(actionButton);
        sonnerElement.appendChild(actionWrapper);
      }
      const closeButton = document.createElement("button");
      closeButton.className = "sonner-close-button btn-dim";
      closeButton.setAttribute("aria-label", "Close");
      closeButton.innerHTML = '<i data-lucide="x" style="width: 1rem; height: 1rem;"></i>';
      sonnerElement.appendChild(closeButton);
      const removeToast = () => {
        if (sonnerElement.isRemoving)
          return;
        sonnerElement.isRemoving = true;
        clearTimeout(sonnerElement.timeoutId);
        sonnerElement.setAttribute("data-state", "closed");
        setTimeout(() => {
          if (sonnerElement.parentNode) {
            sonnerElement.remove();
          }
          toasts.delete(toastId);
        }, 250);
      };
      if (defaults.pauseOnHover) {
        sonnerElement.addEventListener("mouseenter", () => clearTimeout(sonnerElement.timeoutId));
        sonnerElement.addEventListener("mouseleave", () => {
          if (duration > 0)
            sonnerElement.timeoutId = setTimeout(removeToast, duration);
        });
      }
      closeButton.addEventListener("click", removeToast);
      if (duration > 0)
        sonnerElement.timeoutId = setTimeout(removeToast, duration);
      if (toasts.size >= defaults.maxToasts) {
        const oldestToast = toasts.values().next().value;
        if (oldestToast && oldestToast.element) {
          oldestToast.removeToast();
        }
      }
      container.appendChild(sonnerElement);
      toasts.set(toastId, {
        id: toastId,
        element: sonnerElement,
        removeToast,
        options
      });
      requestAnimationFrame(() => {
        sonnerElement.setAttribute("data-state", "open");
        if (window.lucide) {
          window.lucide.createIcons({ nodes: [sonnerElement] });
        }
      });
      return toastId;
    };
    const show = (titleOrOptions, options = {}) => {
      const toastOptions = typeof titleOrOptions === "object" ? titleOrOptions : { ...options, title: titleOrOptions };
      if (!toastOptions.title) {
        console.error("Toast must have a title.");
        return null;
      }
      return createToast(toastOptions);
    };
    const success = (title, options = {}) => show({ title, ...options, type: "success" });
    const error = (title, options = {}) => show({ title, ...options, type: "error" });
    const info = (title, options = {}) => show({ title, ...options, type: "info" });
    const warning = (title, options = {}) => show({ title, ...options, type: "warning" });
    const dismiss = (toastId) => {
      if (toastId) {
        const toast = toasts.get(toastId);
        if (toast)
          toast.removeToast();
      } else {
        toasts.forEach((toast) => toast.removeToast());
      }
    };
    const setPosition = (position) => {
      defaults.position = position;
      container = getOrCreateContainer(position);
    };
    getOrCreateContainer(defaults.position);
    window.toast = show;
    window.toast.success = success;
    window.toast.error = error;
    window.toast.info = info;
    window.toast.warning = warning;
    window.toast.dismiss = dismiss;
    window.toast.setPosition = setPosition;
  }
  document.addEventListener("DOMContentLoaded", sonner);
  
  function sheet() {
    const triggers = document.querySelectorAll("[data-sheet-trigger]");
    const openSheet = (sheetId) => {
      const sheet2 = document.getElementById(sheetId);
      if (!sheet2)
        return;
      const overlay = sheet2.querySelector(".sheet-overlay");
      const content = sheet2.querySelector(".sheet-content");
      sheet2.setAttribute("data-state", "open");
      if (overlay)
        overlay.setAttribute("data-state", "open");
      if (content)
        content.setAttribute("data-state", "open");
      document.body.style.overflow = "hidden";
    };
    const closeSheet = (sheet2) => {
      const overlay = sheet2.querySelector(".sheet-overlay");
      const content = sheet2.querySelector(".sheet-content");
      sheet2.setAttribute("data-state", "closed");
      if (overlay)
        overlay.setAttribute("data-state", "closed");
      if (content)
        content.setAttribute("data-state", "closed");
      if (document.querySelectorAll('.sheet[data-state="open"]').length === 0) {
        document.body.style.overflow = "";
      }
    };
    triggers.forEach((trigger) => {
      trigger.addEventListener("click", () => {
        const sheetId = trigger.getAttribute("data-sheet-trigger");
        openSheet(sheetId);
      });
    });
    document.querySelectorAll(".sheet").forEach((sheet2) => {
      const closeButton = sheet2.querySelector(".sheet-close");
      const overlay = sheet2.querySelector(".sheet-overlay");
      if (closeButton) {
        closeButton.addEventListener("click", () => closeSheet(sheet2));
      }
      if (overlay) {
        overlay.addEventListener("click", () => closeSheet(sheet2));
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        document.querySelectorAll('.sheet[data-state="open"]').forEach(closeSheet);
      }
    });
  }
  document.addEventListener("DOMContentLoaded", sheet);
  
  function tabs() {
    document.querySelectorAll(".tabs:not(.tabs-initialized)").forEach((tabsContainer) => {
      const tabList = tabsContainer.querySelector(".tabs-list");
      if (!tabList)
        return;
      const triggers = Array.from(tabList.querySelectorAll(".tabs-trigger"));
      const contentPanels = Array.from(tabsContainer.querySelectorAll(".tabs-content"));
      const update = (activeTrigger) => {
        const value = activeTrigger.dataset.value;
        triggers.forEach((trigger) => {
          const isActive = trigger === activeTrigger;
          trigger.setAttribute("data-state", isActive ? "active" : "inactive");
          trigger.setAttribute("aria-selected", isActive.toString());
        });
        contentPanels.forEach((panel) => {
          const isActive = panel.dataset.value === value;
          panel.setAttribute("data-state", isActive ? "active" : "inactive");
        });
      };
      tabList.addEventListener("click", (e) => {
        const clickedTrigger = e.target.closest(".tabs-trigger");
        if (clickedTrigger) {
          update(clickedTrigger);
        }
      });
      const defaultValue = tabsContainer.dataset.defaultValue;
      const initialTrigger = triggers.find((t) => t.dataset.value === defaultValue) || triggers[0];
      if (initialTrigger) {
        update(initialTrigger);
      }
      tabsContainer.classList.add("tabs-initialized");
    });
  }
  document.addEventListener("DOMContentLoaded", tabs);
  
  function select() {
    const closeAllSelects = (except) => {
      document.querySelectorAll(".select.select-initialized").forEach((sel) => {
        if (sel !== except && sel.classList.contains("is-open")) {
          sel.close();
        }
      });
    };
    const positionContent = (trigger, content) => {
      const rect = trigger.getBoundingClientRect();
      const offset = parseInt(getComputedStyle(content).getPropertyValue("--offset"), 10) || 0;
      content.style.setProperty("--trigger-width", `${rect.width}px`);
      const tempContent = content.cloneNode(true);
      tempContent.style.opacity = "0";
      tempContent.style.pointerEvents = "none";
      document.body.appendChild(tempContent);
      const contentRect = tempContent.getBoundingClientRect();
      document.body.removeChild(tempContent);
      const { innerHeight: vh } = window;
      let top = rect.bottom + offset;
      if (top + contentRect.height > vh) {
        top = rect.top - contentRect.height - offset;
      }
      content.style.left = `${rect.left}px`;
      content.style.top = `${top}px`;
    };
    document.querySelectorAll(".select:not(.select-initialized)").forEach((selectElement) => {
      const trigger = selectElement.querySelector(".select-trigger");
      const content = selectElement.querySelector(".select-content");
      const valueEl = selectElement.querySelector(".select-value");
      if (!trigger || !content || trigger.disabled) {
        return;
      }
      let isOpen = false;
      const openMenu = () => {
        if (isOpen)
          return;
        closeAllSelects(selectElement);
        isOpen = true;
        selectElement.classList.add("is-open");
        selectElement.classList.remove("has-hovered");
        trigger.setAttribute("aria-expanded", "true");
        content.classList.add("select-content-open");
        positionContent(trigger, content);
      };
      const closeMenu = () => {
        if (!isOpen)
          return;
        isOpen = false;
        selectElement.classList.remove("is-open", "has-hovered");
        trigger.setAttribute("aria-expanded", "false");
        content.classList.remove("select-content-open");
      };
      const selectItem = (item) => {
        const textEl = item.querySelector(".select-item-text");
        if (!textEl)
          return;
        valueEl.textContent = textEl.textContent;
        valueEl.classList.remove("select-value-placeholder");
        const currentSelected = content.querySelector(".select-item-selected");
        if (currentSelected) {
          currentSelected.classList.remove("select-item-selected");
          currentSelected.setAttribute("aria-selected", "false");
        }
        item.classList.add("select-item-selected");
        item.setAttribute("aria-selected", "true");
      };
      selectElement.close = closeMenu;
      trigger.setAttribute("aria-haspopup", "listbox");
      content.setAttribute("role", "listbox");
      content.querySelectorAll(".select-item").forEach((item, index) => {
        item.setAttribute("role", "option");
        if (!item.id)
          item.id = `select-item-${index}-${Math.random()}`;
      });
      content.addEventListener("mouseover", (e) => {
        if (e.target.closest(".select-item") && isOpen) {
          selectElement.classList.add("has-hovered");
        }
      });
      const initialSelected = content.querySelector(".select-item-selected");
      if (initialSelected) {
        selectItem(initialSelected);
      } else if (valueEl) {
        valueEl.textContent = trigger.getAttribute("data-placeholder") || "Select an option...";
        valueEl.classList.add("select-value-placeholder");
      }
      trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        isOpen ? closeMenu() : openMenu();
      });
      content.addEventListener("click", (e) => {
        const item = e.target.closest(".select-item");
        if (item) {
          selectItem(item);
          closeMenu();
        }
      });
      selectElement.classList.add("select-initialized");
    });
    const repositionActiveMenus = () => {
      document.querySelectorAll(".select.is-open").forEach((selectElement) => {
        const trigger = selectElement.querySelector(".select-trigger");
        const content = selectElement.querySelector(".select-content");
        if (trigger && content) {
          positionContent(trigger, content);
        }
      });
    };
    window.addEventListener("resize", repositionActiveMenus);
    window.addEventListener("scroll", repositionActiveMenus, true);
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".select")) {
        closeAllSelects(null);
      }
    });
  }
  document.addEventListener("DOMContentLoaded", select);
  
  function contextMenu() {
    const updateScrollLock = () => {
      const isOpen = !!document.querySelector('.context-menu-content[data-state="open"]');
      document.body.style.overflow = isOpen ? "hidden" : "";
    };
    const checkForIcons = (menuContent) => {
      if (!menuContent)
        return;
      const hasIcons = menuContent.querySelector(".context-menu-item > i, .context-menu-item > svg, .context-menu-sub-trigger > i, .context-menu-sub-trigger > svg");
      menuContent.classList.toggle("has-icons", !!hasIcons);
    };
    const positionContent = (content, x, y) => {
      const { innerWidth: vw, innerHeight: vh } = window;
      const margin = 8;
      const tempContent = content.cloneNode(true);
      tempContent.style.visibility = "hidden";
      document.body.appendChild(tempContent);
      const menuRect = tempContent.getBoundingClientRect();
      document.body.removeChild(tempContent);
      let left = x + 2;
      if (x + menuRect.width > vw - margin) {
        left = vw - menuRect.width - margin;
      }
      let top = y + 2;
      if (y + menuRect.height > vh - margin) {
        top = vh - menuRect.height - margin;
      }
      Object.assign(content.style, { top: `${top}px`, left: `${left}px` });
    };
    const positionSubContent = (trigger, content) => {
      const rect = trigger.getBoundingClientRect();
      const { innerHeight: vh, innerWidth: vw } = window;
      const margin = 8;
      const tempContent = content.cloneNode(true);
      tempContent.style.visibility = "hidden";
      document.body.appendChild(tempContent);
      const contentRect = tempContent.getBoundingClientRect();
      document.body.removeChild(tempContent);
      let left = rect.right;
      if (left + contentRect.width > vw - margin) {
        left = rect.left - contentRect.width;
      }
      let top = Math.max(margin, Math.min(rect.top, vh - contentRect.height - margin));
      Object.assign(content.style, { top: `${top}px`, left: `${left}px` });
    };
    document.body.addEventListener("contextmenu", (e) => {
      const trigger = e.target.closest(".context-menu-trigger");
      if (trigger) {
        e.preventDefault();
        document.querySelectorAll('.context-menu-content[data-state="open"]').forEach((m) => m.setAttribute("data-state", "closed"));
        const menuContentId = trigger.dataset.target;
        const content = document.getElementById(menuContentId);
        if (content) {
          content.setAttribute("data-state", "open");
          checkForIcons(content);
          positionContent(content, e.clientX, e.clientY);
          updateScrollLock();
        }
      }
    });
    document.body.addEventListener("click", (e) => {
      if (!e.target.closest(".context-menu-content")) {
        document.querySelectorAll('.context-menu-content[data-state="open"]').forEach((el) => el.setAttribute("data-state", "closed"));
        updateScrollLock();
      } else if (e.target.closest(".context-menu-item:not(.context-menu-sub-trigger)")) {
        document.querySelectorAll('.context-menu-content[data-state="open"]').forEach((el) => el.setAttribute("data-state", "closed"));
        updateScrollLock();
      }
    });
    document.querySelectorAll(".context-menu-sub").forEach((sub) => {
      const trigger = sub.querySelector(".context-menu-sub-trigger");
      const content = sub.querySelector(".context-menu-sub-content");
      let timer;
      const open = (e) => {
        e.stopPropagation();
        clearTimeout(timer);
        const parentMenu = sub.closest('[data-state="open"]');
        if (!parentMenu)
          return;
        parentMenu.querySelectorAll('.context-menu-sub-content[data-state="open"]').forEach((c) => {
          if (c !== content) {
            c.setAttribute("data-state", "closed");
            c.previousElementSibling.setAttribute("data-state", "closed");
          }
        });
        content.setAttribute("data-state", "open");
        trigger.setAttribute("data-state", "open");
        checkForIcons(content);
        positionSubContent(trigger, content);
      };
      const close = () => {
        timer = setTimeout(() => {
          content.setAttribute("data-state", "closed");
          trigger.setAttribute("data-state", "closed");
        }, 100);
      };
      sub.addEventListener("mouseenter", open);
      sub.addEventListener("mouseleave", close);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        document.querySelectorAll('.context-menu-content[data-state="open"]').forEach((el) => el.setAttribute("data-state", "closed"));
        updateScrollLock();
      }
    });
  }
  document.addEventListener("DOMContentLoaded", contextMenu);
  
  function resizable() {
    const getMinSize = (panel) => parseInt(panel.getAttribute("aria-valuemin"), 10) || 0;
    const setGlobalCursor = (cursor) => {
      document.documentElement.style.cursor = cursor;
      document.body.style.cursor = cursor;
    };
    const applyResize = (current, start, prevSize, nextSize, prevPanel, nextPanel, prevMin, nextMin) => {
      const delta = current - start;
      const newPrevSize = prevSize + delta;
      const newNextSize = nextSize - delta;
      if (newPrevSize >= prevMin && newNextSize >= nextMin) {
        prevPanel.style.flexBasis = `${newPrevSize}px`;
        nextPanel.style.flexBasis = `${newNextSize}px`;
      }
    };
    document.querySelectorAll(".resizable-root:not(.resizable-initialized)").forEach((resizableElement) => {
      if (resizableElement.closest(".resizable-panel-content"))
        return;
      const handles = Array.from(resizableElement.querySelectorAll(":scope > .resizable-handle"));
      handles.forEach((handle) => {
        let dragState = null;
        const findNestedVerticalHandle = (e) => {
          const prevPanel = handle.previousElementSibling;
          const nextPanel = handle.nextElementSibling;
          if (!prevPanel || !nextPanel)
            return null;
          const verticalHandles = [
            ...prevPanel.querySelectorAll(".resizable-vertical > .resizable-handle"),
            ...nextPanel.querySelectorAll(".resizable-vertical > .resizable-handle")
          ];
          for (const vHandle of verticalHandles) {
            const vRect = vHandle.getBoundingClientRect();
            if (e.clientY >= vRect.top - 5 && e.clientY <= vRect.bottom + 5) {
              return vHandle;
            }
          }
          return null;
        };
        const onMouseMove = (e) => {
          if (!dragState)
            return;
          if (dragState.type === "corner") {
            applyResize(e.clientX, dragState.startX, dragState.leftStartWidth, dragState.rightStartWidth, dragState.leftPanel, dragState.rightPanel, dragState.leftMinSize, dragState.rightMinSize);
            applyResize(e.clientY, dragState.startY, dragState.topStartHeight, dragState.bottomStartHeight, dragState.topPanel, dragState.bottomPanel, dragState.topMinSize, dragState.bottomMinSize);
          } else {
            const currentPos = dragState.isHorizontal ? e.clientX : e.clientY;
            applyResize(currentPos, dragState.startPos, dragState.prevSize, dragState.nextSize, dragState.prevPanel, dragState.nextPanel, dragState.prevMinSize, dragState.nextMinSize);
          }
        };
        const onMouseUp = () => {
          if (!dragState)
            return;
          setGlobalCursor("");
          document.body.style.userSelect = "";
          document.body.style.pointerEvents = "";
          window.removeEventListener("mousemove", onMouseMove);
          window.removeEventListener("mouseup", onMouseUp);
          dragState = null;
        };
        const onMouseDown = (e) => {
          e.preventDefault();
          const isHorizontal = handle.parentElement.classList.contains("resizable-horizontal");
          if (isHorizontal) {
            const nestedVerticalHandle = findNestedVerticalHandle(e);
            if (nestedVerticalHandle) {
              const leftPanel = handle.previousElementSibling;
              const rightPanel = handle.nextElementSibling;
              const topPanel = nestedVerticalHandle.previousElementSibling;
              const bottomPanel = nestedVerticalHandle.nextElementSibling;
              dragState = {
                type: "corner",
                leftPanel,
                rightPanel,
                topPanel,
                bottomPanel,
                startX: e.clientX,
                startY: e.clientY,
                leftStartWidth: leftPanel.offsetWidth,
                rightStartWidth: rightPanel.offsetWidth,
                topStartHeight: topPanel.offsetHeight,
                bottomStartHeight: bottomPanel.offsetHeight,
                leftMinSize: getMinSize(leftPanel),
                rightMinSize: getMinSize(rightPanel),
                topMinSize: getMinSize(topPanel),
                bottomMinSize: getMinSize(bottomPanel)
              };
              setGlobalCursor("all-scroll");
            }
          }
          if (!dragState) {
            const prevPanel = handle.previousElementSibling;
            const nextPanel = handle.nextElementSibling;
            dragState = {
              type: "standard",
              isHorizontal,
              prevPanel,
              nextPanel,
              startPos: isHorizontal ? e.clientX : e.clientY,
              prevSize: isHorizontal ? prevPanel.offsetWidth : prevPanel.offsetHeight,
              nextSize: isHorizontal ? nextPanel.offsetWidth : nextPanel.offsetHeight,
              prevMinSize: getMinSize(prevPanel),
              nextMinSize: getMinSize(nextPanel)
            };
            setGlobalCursor(isHorizontal ? "ew-resize" : "ns-resize");
          }
          document.body.style.userSelect = "none";
          document.body.style.pointerEvents = "none";
          window.addEventListener("mousemove", onMouseMove);
          window.addEventListener("mouseup", onMouseUp);
        };
        handle.addEventListener("mousedown", onMouseDown);
        handle.addEventListener("mousemove", (e) => {
          if (dragState)
            return;
          const isHorizontal = handle.parentElement.classList.contains("resizable-horizontal");
          handle.style.cursor = isHorizontal ? findNestedVerticalHandle(e) ? "all-scroll" : "ew-resize" : "ns-resize";
        });
        handle.addEventListener("mouseleave", () => {
          if (dragState)
            return;
          handle.style.cursor = "";
        });
      });
      resizableElement.classList.add("resizable-initialized");
    });
  }
  document.addEventListener("DOMContentLoaded", resizable);
  
  function tree() {
    const initTreeItem = (item) => {
      const header = item.querySelector(":scope > .tree-item-header");
      const submenu = item.querySelector(":scope > .tree-submenu");
      if (submenu) {
        if (item.getAttribute("aria-expanded") === null) {
          item.setAttribute("aria-expanded", "false");
        }
        header.addEventListener("click", (e) => {
          if (item.hasAttribute("aria-expanded")) {
            e.preventDefault();
          }
          const isExpanded = item.getAttribute("aria-expanded") === "true";
          item.setAttribute("aria-expanded", !isExpanded);
        });
      }
    };
    document.querySelectorAll(".tree:not(.tree-initialized)").forEach((treeRoot) => {
      treeRoot.setAttribute("role", "tree");
      treeRoot.querySelectorAll(":scope .tree-item").forEach((item) => {
        item.setAttribute("role", "treeitem");
        initTreeItem(item);
      });
      treeRoot.classList.add("tree-initialized");
    });
  }
  document.addEventListener("DOMContentLoaded", tree);
  
  function sortable() {
    if (typeof Sortable === "undefined") {
      return;
    }
    document.querySelectorAll(".sortable-list").forEach((list) => {
      if (list.hasAttribute("data-sortable-initialized")) {
        return;
      }
      new Sortable(list, {
        animation: 150,
        handle: ".sortable-handle",
        ghostClass: "sortable-ghost",
        chosenClass: "sortable-chosen",
        onStart: () => document.body.classList.add("sortable-sorting"),
        onEnd: () => document.body.classList.remove("sortable-sorting")
      });
      list.setAttribute("data-sortable-initialized", "true");
    });
  }
  document.addEventListener("DOMContentLoaded", sortable);
  
  function sidebar() {
    const updateAria = (sidebarId) => {
      const sidebar2 = document.getElementById(sidebarId);
      if (!sidebar2)
        return;
      const isExpanded = !sidebar2.classList.contains("collapsed") && !sidebar2.classList.contains("collapsed-completely");
      document.querySelectorAll(`[aria-controls="${sidebarId}"]`).forEach((btn) => btn.setAttribute("aria-expanded", String(isExpanded)));
    };
    document.body.addEventListener("click", (e) => {
      const trigger = e.target.closest(".sidebar-trigger-partial, .sidebar-trigger-complete");
      if (!trigger)
        return;
      const sidebarId = trigger.getAttribute("aria-controls");
      const sidebar2 = document.getElementById(sidebarId);
      if (!sidebar2)
        return;
      const storageKey = `sidebar-collapsed-${sidebarId}`;
      const storageKeyComplete = `sidebar-collapsed-completely-${sidebarId}`;
      if (trigger.classList.contains("sidebar-trigger-complete")) {
        const isHidden = sidebar2.classList.toggle("collapsed-completely");
        localStorage.setItem(storageKeyComplete, isHidden);
        if (isHidden) {
          sidebar2.classList.remove("collapsed");
          localStorage.removeItem(storageKey);
        }
      } else {
        if (sidebar2.classList.contains("collapsed-completely")) {
          sidebar2.classList.remove("collapsed-completely");
          localStorage.removeItem(storageKeyComplete);
        } else {
          const isPartiallyCollapsed = sidebar2.classList.toggle("collapsed");
          localStorage.setItem(storageKey, isPartiallyCollapsed);
        }
      }
      updateAria(sidebarId);
    });
    document.querySelectorAll(".sidebar[id]").forEach((sidebar2) => {
      const sidebarId = sidebar2.id;
      const widthStorageKey = `sidebar-width-${sidebarId}`;
      if (localStorage.getItem(`sidebar-collapsed-completely-${sidebarId}`) === "true") {
        sidebar2.classList.add("collapsed-completely");
      } else if (localStorage.getItem(`sidebar-collapsed-${sidebarId}`) === "true") {
        sidebar2.classList.add("collapsed");
      }
      updateAria(sidebarId);
      if (sidebar2.classList.contains("resizable")) {
        const savedWidth = localStorage.getItem(widthStorageKey);
        if (savedWidth && !sidebar2.classList.contains("collapsed")) {
          sidebar2.style.setProperty("--sidebar-current-width", savedWidth);
        }
        const resizer = document.createElement("div");
        resizer.className = "sidebar-resizer";
        sidebar2.appendChild(resizer);
        resizer.addEventListener("mousedown", (e) => {
          e.preventDefault();
          sidebar2.classList.add("is-resizing");
          const originalTransition = sidebar2.style.transition;
          sidebar2.style.transition = "none";
          const startX = e.clientX;
          const startWidth = sidebar2.offsetWidth;
          const isRight = sidebar2.classList.contains("sidebar-right");
          const minWidth = parseInt(sidebar2.dataset.minWidth) || 54;
          const maxWidth = parseInt(sidebar2.dataset.maxWidth) || window.innerWidth * 0.8;
          const doDrag = (e2) => {
            const newWidth = isRight ? startWidth - (e2.clientX - startX) : startWidth + (e2.clientX - startX);
            const clampedWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
            sidebar2.style.setProperty("--sidebar-current-width", `${clampedWidth}px`);
          };
          const stopDrag = () => {
            sidebar2.classList.remove("is-resizing");
            sidebar2.style.transition = originalTransition;
            const finalWidth = sidebar2.offsetWidth;
            if (finalWidth <= minWidth) {
              sidebar2.classList.add("collapsed-completely");
              sidebar2.classList.remove("collapsed");
              localStorage.setItem(`sidebar-collapsed-completely-${sidebarId}`, "true");
              localStorage.removeItem(`sidebar-collapsed-${sidebarId}`);
              localStorage.removeItem(widthStorageKey);
              sidebar2.style.removeProperty("--sidebar-current-width");
              updateAria(sidebarId);
            } else {
              localStorage.setItem(widthStorageKey, sidebar2.style.getPropertyValue("--sidebar-current-width"));
            }
            document.removeEventListener("mousemove", doDrag);
            document.removeEventListener("mouseup", stopDrag);
          };
          document.addEventListener("mousemove", doDrag);
          document.addEventListener("mouseup", stopDrag);
        });
      }
    });
  }
  document.addEventListener("DOMContentLoaded", sidebar);
  
  function themeToggle() {
    const toggleButton = document.querySelector(".theme-toggle");
    if (!toggleButton)
      return;
    const lightIcon = toggleButton.querySelector(".light-icon");
    const darkIcon = toggleButton.querySelector(".dark-icon");
    const applyTheme = (theme) => {
      document.documentElement.classList.toggle("dark", theme === "dark");
      if (lightIcon && darkIcon) {
        lightIcon.style.display = theme === "dark" ? "none" : "inline-block";
        darkIcon.style.display = theme === "dark" ? "inline-block" : "none";
      }
      localStorage.setItem("theme", theme);
    };
    applyTheme(localStorage.getItem("theme") || (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
    toggleButton.addEventListener("click", () => {
      applyTheme(document.documentElement.classList.contains("dark") ? "light" : "dark");
    });
  }
  document.addEventListener("DOMContentLoaded", () => {
    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }
    themeToggle();
  });
