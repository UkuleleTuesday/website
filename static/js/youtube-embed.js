/**
 * Click-to-load YouTube embeds ("facades"), rendered by the youtube_video
 * macro in templates/_macros/video.html.
 *
 * A facade shows only the video's thumbnail and a play button. The YouTube
 * player iframe is created here, when the visitor clicks, on the
 * privacy-enhanced youtube-nocookie.com domain and with autoplay so that the
 * same click starts playback. Loading the player up front cost about 1 MB of
 * third-party JavaScript per video and logged a stream of console warnings
 * and errors before anyone had pressed play (issue #125).
 */
(function () {
  'use strict';

  var PLAYER_ORIGIN = 'https://www.youtube-nocookie.com';
  // The same feature list as YouTube's own embed code.
  var PLAYER_ALLOW = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';

  function loadPlayer(facade) {
    var videoId = facade.getAttribute('data-video-id');
    if (!videoId || facade.classList.contains('youtube-facade--loaded')) {
      return;
    }

    var player = document.createElement('iframe');
    player.src = PLAYER_ORIGIN + '/embed/' + encodeURIComponent(videoId) + '?autoplay=1';
    player.title = facade.getAttribute('data-title') || 'YouTube video player';
    player.setAttribute('allow', PLAYER_ALLOW);
    player.setAttribute('allowfullscreen', '');
    player.setAttribute('frameborder', '0');
    player.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    player.width = '560';
    player.height = '315';

    facade.classList.add('youtube-facade--loaded');
    while (facade.firstChild) {
      facade.removeChild(facade.firstChild);
    }
    facade.appendChild(player);
    player.focus();
  }

  document.addEventListener('click', function (event) {
    var target = event.target;
    if (!(target instanceof Element)) {
      return;
    }
    var link = target.closest('.youtube-facade__link');
    var facade = link && link.closest('.youtube-facade');
    if (!facade) {
      return;
    }
    event.preventDefault();
    loadPlayer(facade);
  });
})();
