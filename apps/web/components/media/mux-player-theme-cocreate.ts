'use client'

/**
 * Registers a Media Chrome theme template for Mux Player.
 * Mux resolves `theme="cocreate"` via `<template id="cocreate">` in the document
 * (see Mux Player themeTemplate lookup).
 */

export const COCREATE_MUX_THEME = 'cocreate'

const TEMPLATE_ID = COCREATE_MUX_THEME

const THEME_HTML = /* html */ `
  <style>
    :host {
      --_bar-bg: #0a0a0a;
      --_icon: #fff;
      --_track: #3a3a3a;
      --_progress: #fff;
      --_bar-height: 44px;
      --_bar-radius: 6px;

      --media-primary-color: var(--_icon);
      --media-secondary-color: var(--_bar-bg);
      --media-icon-color: var(--_icon);
      --media-text-color: #fff;
      --media-control-background: transparent;
      --media-control-hover-background: rgb(255 255 255 / 0.12);
      --media-range-bar-color: var(--_progress);
      --media-range-track-background: var(--_track);
      --media-range-track-border-radius: 2px;
      --media-range-track-height: 3px;
      --media-time-range-buffered-color: rgb(255 255 255 / 0.28);
      --media-range-thumb-background: transparent;
      --media-range-thumb-width: 0;
      --media-range-thumb-height: 0;
      --media-range-thumb-opacity: 0;
      --media-tooltip-display: none;
      --media-font-family: inherit;
      --media-font-weight: 500;
      --media-font-size: 12px;
      --media-preview-time-background: #fff;
      --media-preview-time-text-shadow: none;
      --media-preview-time-border-radius: 4px;
      --media-box-arrow-background: #fff;
      --media-current-box-display: flex;
      --media-current-box-margin: 0 0 6px;

      color: var(--_icon);
    }

    .controls-row {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      box-sizing: border-box;
      padding: 0 10px 10px;
      pointer-events: auto;
    }

    media-control-bar {
      display: inline-flex;
      align-items: center;
      background: var(--_bar-bg);
      border-radius: var(--_bar-radius);
      height: var(--_bar-height);
      min-height: var(--_bar-height);
      padding: 0 4px;
      box-sizing: border-box;
    }

    media-control-bar.play-bar {
      flex: none;
      width: var(--_bar-height);
      justify-content: center;
      padding: 0;
    }

    media-control-bar.main-bar {
      flex: 1;
      min-width: 0;
      gap: 2px;
      padding-inline: 10px 6px;
    }

    media-time-range {
      flex: 1;
      min-width: 0;
      height: 100%;
      --media-control-padding: 0 8px;
      --media-control-hover-background: transparent;
      --media-text-color: #0a0a0a;
      color: #0a0a0a;
    }

    media-time-range::part(current-box) {
      visibility: visible;
    }

    media-time-display {
      background: #fff;
      color: #0a0a0a;
      border-radius: 4px;
      padding: 2px 6px;
      font-size: 11px;
      font-variant-numeric: tabular-nums;
      line-height: 1.3;
      box-shadow: 0 1px 2px rgb(0 0 0 / 0.2);
    }

    media-play-button,
    media-mute-button,
    media-settings-menu-button,
    media-fullscreen-button {
      --media-control-height: 36px;
      --media-control-padding: 0;
      width: 36px;
      height: 36px;
      border-radius: 4px;
    }

    media-play-button {
      width: 100%;
      height: 100%;
      border-radius: var(--_bar-radius);
    }

    media-settings-menu,
    media-playback-rate-menu,
    media-rendition-menu {
      border-radius: 8px;
      --media-settings-menu-min-width: 180px;
      --media-menu-background: #141414;
      --media-menu-item-background-hover: rgb(255 255 255 / 0.1);
      --media-text-color: #fff;
      --media-icon-color: #fff;
      --media-primary-color: #fff;
      color: #fff;
    }

    media-settings-menu-item,
    media-chrome-menu-item {
      color: #fff;
      --media-text-color: #fff;
    }

    @media (max-width: 640px) {
      :host {
        --_bar-height: 40px;
      }

      .controls-row {
        gap: 6px;
        padding: 0 8px 8px;
      }

      media-control-bar.main-bar {
        padding-inline: 6px 4px;
      }
    }
  </style>

  <media-controller
    defaultsubtitles="{{defaultsubtitles}}"
    defaultduration="{{defaultduration}}"
    gesturesdisabled="{{disabled}}"
    hotkeys="{{hotkeys}}"
    nohotkeys="{{nohotkeys}}"
    defaultstreamtype="on-demand"
  >
    <slot name="media" slot="media"></slot>
    <slot name="poster" slot="poster"></slot>
    <media-loading-indicator slot="centered-chrome" noautohide></media-loading-indicator>
    <media-error-dialog slot="dialog"></media-error-dialog>

    <media-settings-menu hidden anchor="auto">
      <media-settings-menu-item>
        Speed
        <media-playback-rate-menu slot="submenu" hidden>
          <div slot="title">Speed</div>
        </media-playback-rate-menu>
      </media-settings-menu-item>
      <media-settings-menu-item>
        Quality
        <media-rendition-menu slot="submenu" hidden>
          <div slot="title">Quality</div>
        </media-rendition-menu>
      </media-settings-menu-item>
    </media-settings-menu>

    <div class="controls-row">
      <media-control-bar class="play-bar">
        <media-play-button part="play button" disabled="{{disabled}}" aria-disabled="{{disabled}}">
          <svg aria-hidden="true" viewBox="0 0 24 24" slot="play" fill="currentColor">
            <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86a1 1 0 0 0-1.5.86Z" />
          </svg>
          <svg aria-hidden="true" viewBox="0 0 24 24" slot="pause" fill="currentColor">
            <path d="M7 5h3v14H7V5Zm7 0h3v14h-3V5Z" />
          </svg>
        </media-play-button>
      </media-control-bar>

      <media-control-bar class="main-bar">
        <media-time-range part="time range" disabled="{{disabled}}" aria-disabled="{{disabled}}">
          <media-time-display slot="current"></media-time-display>
        </media-time-range>

        <media-mute-button part="mute button" disabled="{{disabled}}" aria-disabled="{{disabled}}"></media-mute-button>

        <media-settings-menu-button part="button">
          <svg aria-hidden="true" viewBox="0 0 24 24" slot="icon" fill="currentColor">
            <path
              d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a7.15 7.15 0 0 0-1.62-.94l-.36-2.54a.48.48 0 0 0-.48-.41h-3.84a.48.48 0 0 0-.48.41l-.36 2.54c-.59.24-1.13.56-1.62.94l-2.39-.96a.49.49 0 0 0-.59.22L2.77 8.87a.48.48 0 0 0 .12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.48-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.49.49 0 0 0-.12-.61l-2.03-1.58ZM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2Z"
            />
          </svg>
        </media-settings-menu-button>

        <media-fullscreen-button part="fullscreen button" disabled="{{disabled}}" aria-disabled="{{disabled}}"></media-fullscreen-button>
      </media-control-bar>
    </div>

    <slot></slot>
  </media-controller>
`

export function ensureCocreateMuxTheme() {
  if (typeof document === 'undefined') return

  let template = document.getElementById(TEMPLATE_ID) as HTMLTemplateElement | null
  if (template instanceof HTMLTemplateElement) {
    template.innerHTML = THEME_HTML
    return
  }

  template = document.createElement('template')
  template.id = TEMPLATE_ID
  template.innerHTML = THEME_HTML
  document.head.appendChild(template)
}

if (typeof window !== 'undefined') {
  ensureCocreateMuxTheme()
}

export default COCREATE_MUX_THEME
