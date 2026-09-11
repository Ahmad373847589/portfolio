---
layout: page
title: Forest Chase
description: Survive the forest chase across two levels.
permalink: /gamify/forest-chase
---

<style>
  .forest-chase-page {
    max-width: 1100px;
    margin: 0 auto;
    background: #091512;
    color: #f5f1d7;
    padding: 20px;
  }

  .forest-chase-game {
    min-height: min(70vh, 680px);
    border: 2px solid #315d46;
    border-radius: 8px;
    box-shadow: 0 18px 45px rgba(12, 36, 24, 0.28);
    min-width: 0;
  }

  .forest-chase-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    margin: 16px 0;
  }

  .forest-chase-actions button {
    padding: 10px 16px;
    border: 0;
    border-radius: 6px;
    background: #b6532e;
    color: #fff8e7;
    cursor: pointer;
    font-weight: 700;
  }

  .forest-chase-actions button:focus-visible {
    outline: 3px solid #d8ef84;
    outline-offset: 3px;
  }

  .forest-chase-actions span {
    color: #315d46;
  }
</style>

<main class="forest-chase-page">
  <p>Run for 60 seconds in each level. Use WASD or the arrow keys. Press R after a round ends.</p>
  <div class="forest-chase-actions">
    <button id="forest-chase-start" type="button">Start Chase</button>
    <span>Level 2 adds arrows, speed, and a larger hitbox.</span>
  </div>
  <div id="forest-chase-game" class="forest-chase-game"></div>
</main>

<script type="module">
  import ForestChaseGame from '{{ site.baseurl }}/assets/js/projects/gamify/ForestChaseGame.js';

  const boot = () => {
    const container = document.getElementById('forest-chase-game');
    const startButton = document.getElementById('forest-chase-start');
    if (!container || !startButton || startButton.dataset.bound) return;

    const game = new ForestChaseGame(container);
    startButton.dataset.bound = 'true';
    startButton.addEventListener('click', () => game.start());
    window.addEventListener('beforeunload', () => game.destroy(), { once: true });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
</script>