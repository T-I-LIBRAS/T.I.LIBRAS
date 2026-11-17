// Toca vídeos do YouTube no lugar do <video> quando o link do termo for do YouTube.
// Vídeos locais (ex.: /videos/monitor.mp4) continuam usando o <video> normalmente.
(function () {
  function idDoYoutube(url) {
    if (!url) return null;
    const texto = String(url).trim();
    const padroes = [
      /youtu\.be\/([\w-]{11})/,
      /youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)([\w-]{11})/
    ];
    for (const padrao of padroes) {
      const achado = texto.match(padrao);
      if (achado) return achado[1];
    }
    return null;
  }

  function eYoutube(url) {
    return idDoYoutube(url) !== null;
  }

  function iframeDe(video) {
    let quadro = video.parentNode.querySelector('iframe.video-youtube');
    if (quadro) return quadro;

    quadro = document.createElement('iframe');
    quadro.className = 'video-youtube';
    quadro.title = 'Vídeo do sinal';
    quadro.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture');
    quadro.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    quadro.setAttribute('allowfullscreen', '');
    quadro.setAttribute('loading', 'eager');
    video.insertAdjacentElement('afterend', quadro);
    return quadro;
  }

  function enderecoDeEmbed(id, controles) {
    const parametros = new URLSearchParams({
      autoplay: '1',
      mute: '1',
      loop: '1',
      playlist: id,
      playsinline: '1',
      rel: '0',
      modestbranding: '1',
      controls: controles ? '1' : '0'
    });
    if (!controles) {
      parametros.set('disablekb', '1');
      parametros.set('fs', '0');
    }
    return `https://www.youtube-nocookie.com/embed/${id}?${parametros.toString()}`;
  }

  // Devolve true se a fonte é do YouTube (e já foi carregada no iframe).
  // Devolve false se for um arquivo comum; nesse caso esconde o iframe e o <video> segue normal.
  function exibir(video, fonte, opcoes) {
    if (!video || !video.parentNode) return false;

    const controles = !opcoes || opcoes.controles !== false;
    const id = idDoYoutube(fonte);
    const quadro = iframeDe(video);

    if (!id) {
      quadro.removeAttribute('src');
      quadro.style.display = 'none';
      video.style.display = '';
      return false;
    }

    video.pause();
    video.removeAttribute('src');
    video.load();
    video.style.display = 'none';

    quadro.style.display = 'block';
    quadro.src = enderecoDeEmbed(id, controles);
    return true;
  }

  function esconder(video) {
    if (!video || !video.parentNode) return;
    const quadro = video.parentNode.querySelector('iframe.video-youtube');
    if (!quadro) return;
    quadro.removeAttribute('src');
    quadro.style.display = 'none';
  }

  window.VideoYoutube = { idDoYoutube, eYoutube, exibir, esconder };
})();
