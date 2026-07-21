const burger = document.getElementById("burger");
const nav = document.getElementById("nav");

burger.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("open");
  // Сообщаем скринридерам, открыто меню или закрыто
  burger.setAttribute("aria-expanded", isOpen);
});

nav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
  });
});

const cards = document.querySelectorAll(".case-example");
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
    }
  });
}, { threshold: 0.15 });

cards.forEach((card) => observer.observe(card));

// Превью видео VK/YouTube: по клику подгружаем живой плеер вместо статичной заглушки

function initVideoFacades() {
  document.querySelectorAll("[data-video-play]").forEach((link) => {
    link.addEventListener("click", (event) => {
      const facade = link.closest("[data-video-facade]");

      // Прямая ссылка на mp4-файл (например, с сайта телеканала) — плеер тут
      // не iframe стороннего сервиса, а обычный html-тег <video>
      if (facade.dataset.videoProvider === "file") {
        const fileSrc = facade.dataset.videoSrc;
        if (!fileSrc) return;

        event.preventDefault();

        const video = document.createElement("video");
        video.className = "video-facade__player";
        video.src = fileSrc;
        video.controls = true;
        video.autoplay = true;

        facade.innerHTML = "";
        facade.appendChild(video);
        return;
      }

      const src = getVideoEmbedSrc(facade);
      if (!src) return;

      event.preventDefault();

      const iframe = document.createElement("iframe");
      iframe.className = "video-facade__player";
      iframe.src = src;
      iframe.allow = "autoplay; encrypted-media; fullscreen; picture-in-picture";
      iframe.allowFullscreen = true;
      iframe.frameBorder = "0";

      facade.innerHTML = "";
      facade.appendChild(iframe);
    });
  });
}

function getVideoEmbedSrc(facade) {
  const provider = facade.dataset.videoProvider;

  if (provider === "vk") {
    const oid = facade.dataset.vkOid;
    const id = facade.dataset.vkId;
    if (!oid || !id) return null;
    return `https://vk.com/video_ext.php?oid=${oid}&id=${id}&hd=2&autoplay=1`;
  }

  if (provider === "youtube") {
    const id = facade.dataset.ytId;
    if (!id) return null;
    return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
  }

  if (provider === "rutube") {
    const id = facade.dataset.rutubeId;
    if (!id) return null;
    // У приватных видео Rutube есть токен доступа (p) в ссылке — без него плеер не откроется
    const p = facade.dataset.rutubeP;
    const token = p ? `?p=${p}` : "";
    return `https://rutube.ru/play/embed/${id}${token}`;
  }

  return null;
}

initVideoFacades();

// Цвет рамки вокруг превью подбираем по самой картинке, а не берём
// фиксированный из .ph--N — так VK- и YouTube-превью с разными оттенками
// каждое получает свою гармоничную рамку.

function initVideoPosterColors() {
  document.querySelectorAll(".video-facade__poster").forEach((img) => {
    if (img.complete) {
      applyPosterAccent(img);
    } else {
      img.addEventListener("load", () => applyPosterAccent(img));
    }
  });
}

function applyPosterAccent(img) {
  const facade = img.closest(".video-facade");
  if (!facade) return;

  const accent = getTopStripAccentColor(img);
  if (!accent) return;

  facade.style.background = `linear-gradient(135deg, ${accent}, #2b2b3d)`;
}

// Усредняем цвет только в верхней полосе картинки — именно она граничит
// с цветной рамкой сверху, поэтому переход получается более плавным,
// чем если бы мы усредняли всю картинку целиком.
function getTopStripAccentColor(img) {
  const width = 32;
  const height = Math.max(1, Math.round(width * (img.naturalHeight / img.naturalWidth) * 0.2));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);

  let r = 0, g = 0, b = 0;
  const { data } = ctx.getImageData(0, 0, width, height);
  const pixelCount = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
  }

  r = Math.round(r / pixelCount);
  g = Math.round(g / pixelCount);
  b = Math.round(b / pixelCount);

  return toVividAccent(r, g, b);
}

// Усреднённый цвет фото обычно получается тусклым — поднимаем насыщенность
// и приводим яркость к одному диапазону, чтобы рамка выглядела как акцент,
// а не как грязно-серое пятно.
function toVividAccent(r, g, b) {
  const hue = rgbToHue(r, g, b);
  const saturation = 55;
  const lightness = 50;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function rgbToHue(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let hue = 0;

  if (max !== min) {
    const d = max - min;
    switch (max) {
      case r: hue = (g - b) / d + (g < b ? 6 : 0); break;
      case g: hue = (b - r) / d + 2; break;
      case b: hue = (r - g) / d + 4; break;
    }
    hue /= 6;
  }

  return Math.round(hue * 360);
}

initVideoPosterColors();
