export const onClick = (container, template) => {
  container.onclick = (event) => {
    const isImage = event.target && event.target instanceof HTMLImageElement;
    const target = (isImage) ? event.target : null;
    if (target) {
      const clone = template.content.cloneNode(true);
      const dialog = clone.querySelector('dialog');
      const img = clone.querySelector('img');

      if (img && 'src' in img) { img.src = target.src; }
      document.body.appendChild(dialog);

      dialog.showModal();
      dialog.addEventListener('click', (e) => {
        dialog.close();
        dialog.remove();
      });
    };
  };
};

export const loadImage = (path, prefix, template, callback) => {
  const host = window.location.protocol + "//" + window.location.host;
  const src = new URL(path, `${host}${prefix}`);
  const img = template.content.querySelector('img');
  if (img && 'src' in img) {
    img.src = src.toString();
    callback(template);
  }
}
