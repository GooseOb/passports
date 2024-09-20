export const span = (text: string) => {
  const el = document.createElement("span");
  el.textContent = text;
  return el;
};

export const div = (className: string) => {
  const el = document.createElement("div");
  el.className = className;
  return el;
};
