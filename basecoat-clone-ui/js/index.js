/**
 * =================================================================
 * CORE ENGINE (The "Basecoat Way")
 *
 * - Discovers and initializes all components on the page automatically.
 * - Looks for `[data-component]` attributes.
 * - Dynamically imports the corresponding JS module.
 * - Instantiates the component class, passing the element to it.
 * =================================================================
 */

const initComponent = async (element) => {
  const componentName = element.dataset.component;
  if (!componentName) return;

  try {
    // Dynamically import the component module
    const componentModule = await import(`./components/${componentName}.js`);
    const ComponentClass = componentModule.default;

    if (ComponentClass && typeof ComponentClass === 'function') {
      // Instantiate the component class
      new ComponentClass(element);
    } else {
      console.warn(`Component class for "${componentName}" not found or not a constructor.`);
    }
  } catch (error) {
    console.error(`Failed to load component: ${componentName}`, error);
  }
};

const discoverComponents = () => {
  const components = document.querySelectorAll('[data-component]');
  components.forEach(initComponent);
};

// Initialize everything on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', discoverComponents);
} else {
  discoverComponents();
}