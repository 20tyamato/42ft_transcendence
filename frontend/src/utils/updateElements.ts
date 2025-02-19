export const updateText = (selector: string, text: string): void => {
  const el = document.querySelector(selector);
  if (el) el.textContent = text;
};

export const updatePlaceholder = (selector: string, placeholder: string): void => {
  const el = document.querySelector(selector) as HTMLInputElement | null;
  if (el) el.placeholder = placeholder;
};

export const updateAttribute = (selector: string, attribute: string, value: string): void => {
  const el = document.querySelector(selector);
  if (el) el.setAttribute(attribute, value);
};

export const updateInnerHTML = (selector: string, html: string): void => {
  const el = document.querySelector(selector);
  if (el) el.innerHTML = html;
};
