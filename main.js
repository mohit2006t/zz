import './components/ui/accordion/accordion.js';
import './components/ui/dropdown/dropdown.js';
import './components/ui/toggle/toggle.js';
import './components/ui/command/command.js';
import './components/ui/popover/popover.js';
import './components/ui/combobox/combobox.js';
import './components/ui/menubar/menubar.js';
import './components/ui/navigation-menu/navigation-menu.js';
import './components/ui/toggle-group/toggle-group.js';
import './components/ui/tooltip/tooltip.js';
import './components/ui/pagination/pagination.js';
import './components/ui/input/input.js';
import './components/ui/dialog/dialog.js';
import './components/ui/input-otp/input-otp.js';
import './components/ui/progress/progress.js';
import './components/ui/carousel/carousel.js';
import './components/ui/slider/slider.js';
import './components/ui/sonner/sonner.js';
import './components/ui/sheet/sheet.js';
import './components/ui/tabs/tabs.js';
import './components/ui/select/select.js';
import './components/ui/context-menu/context-menu.js';
import './components/ui/resizable/resizable.js';
import './components/ui/tree/tree.js';
import './components/ui/sortable/sortable.js';
import './components/ui/sidebar/sidebar.js';

// ai-elements
import './components/ai-elements/code-block/code-block.js';
import './components/ai-elements/prompt-input/prompt-input.js';
import './components/ai-elements/conversation/conversation.js';

// utils
import './utils/index.js';

function themeToggle() {
  const toggleButton = document.querySelector('.theme-toggle');
  if (!toggleButton) return;

  const lightIcon = toggleButton.querySelector('.light-icon');
  const darkIcon = toggleButton.querySelector('.dark-icon');

  const applyTheme = (theme) => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    if (lightIcon && darkIcon) {
      lightIcon.style.display = theme === 'dark' ? 'none' : 'inline-block';
      darkIcon.style.display = theme === 'dark' ? 'inline-block' : 'none';
    }
    localStorage.setItem('theme', theme);
  };

  const currentTheme =
    localStorage.getItem('theme') ||
    (window.matchMedia?.('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light');
  applyTheme(currentTheme);

  toggleButton.addEventListener('click', () => {
    const newTheme = document.documentElement.classList.contains('dark')
      ? 'light'
      : 'dark';
    applyTheme(newTheme);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  themeToggle();
});