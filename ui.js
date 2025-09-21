function accordion() {
    document.querySelectorAll(".accordion").forEach((accordionElement, accordionIndex) => {
      const isSingleToggle = accordionElement.classList.contains("accordion-single-toggle");
      const items = Array.from(accordionElement.querySelectorAll(".accordion-item"));

      const setItemState = (trigger, content, isActive) => {
        if (!trigger || !content) return;
        trigger.setAttribute("aria-expanded", String(isActive));
        content.style.height = isActive ? `${content.scrollHeight}px` : "0";
      };

      const itemElements = items.map(item => ({
          item,
          trigger: item.querySelector(".accordion-trigger"),
          content: item.querySelector(".accordion-content")
      }));

      itemElements.forEach(({ item, trigger, content }, itemIndex) => {
        if (!trigger || !content) return;

        const uniqueId = `accordion-${accordionIndex}-item-${itemIndex}`;
        trigger.id = `${uniqueId}-trigger`;
        content.id = `${uniqueId}-content`;
        trigger.setAttribute("aria-controls", content.id);
        content.setAttribute("aria-labelledby", trigger.id);
        setItemState(trigger, content, trigger.getAttribute("aria-expanded") === "true");
      });

      accordionElement.addEventListener("click", (event) => {
        const clickedTrigger = event.target.closest(".accordion-trigger");
        if (!clickedTrigger || clickedTrigger.closest(".is-disabled")) return;

        const clickedItemElement = clickedTrigger.closest(".accordion-item");
        const targetElements = itemElements.find(e => e.item === clickedItemElement);
        if (!targetElements) return;

        const isOpening = clickedTrigger.getAttribute("aria-expanded") !== "true";

        if (isSingleToggle) {
          itemElements.forEach(({ item, trigger, content }) => {
            if (item !== clickedItemElement) {
              setItemState(trigger, content, false);
            }
          });
        }
        setItemState(targetElements.trigger, targetElements.content, isOpening);
      });
    });
  }
document.addEventListener("DOMContentLoaded", () => {
    accordion();
    dropdown();
    toggle();
    command();
    popover();
    combobox();
    menubar();
    navigationMenu();
    toggleGroup();
    tooltip();
    pagination();
    input();
    dialog();
    inputOTP();
    progress();
    carousel();
    slider();
    sonner();
    sheet();
    tabs();
    select();
    contextMenu();
    resizable();
    tree();
    sortable();
    sidebar();
    themeToggle();

    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }
  });
