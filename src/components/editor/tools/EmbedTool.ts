import type { API } from '@editorjs/editorjs'

export interface EmbedBlockData {
  service?: string
  source?: string
  embed?: string
  caption?: string
}

function parseEmbedUrl(url: string): { embedUrl: string; service: string } {
  const cleanUrl = url.trim()

  // YouTube match
  const ytMatch = cleanUrl.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
  )
  if (ytMatch) {
    return {
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}`,
      service: 'youtube'
    }
  }

  // Vimeo match
  const vimeoMatch = cleanUrl.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^/]*)\/videos\/|)(\d+)/)
  if (vimeoMatch) {
    return {
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[2]}`,
      service: 'vimeo'
    }
  }

  // Generic fallback
  return {
    embedUrl: cleanUrl,
    service: 'generic'
  }
}

export class EmbedTool {
  static get toolbox(): { icon: string; title: string } {
    return {
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
      title: 'Embed'
    }
  }

  static get isReadOnlySupported(): boolean {
    return true
  }

  protected api?: API
  private data: EmbedBlockData
  private wrapper: HTMLElement | null = null

  constructor({ data, api }: { data: EmbedBlockData; api?: API }) {
    this.api = api
    this.data = data || {}
  }

  render(): HTMLElement {
    this.wrapper = document.createElement('div')
    this.wrapper.classList.add('oink-embed-block')

    if (this.data && (this.data.embed || this.data.source)) {
      const url = this.data.embed || this.data.source || ''
      this.renderEmbed(url, this.data.caption || '')
    } else {
      this.renderInputForm()
    }

    return this.wrapper
  }

  renderInputForm(): void {
    if (!this.wrapper) return
    this.wrapper.replaceChildren()

    const form = document.createElement('div')
    form.className = 'oink-media-input-wrapper'

    const input = document.createElement('input')
    input.type = 'text'
    input.className = 'oink-media-url-input'
    input.placeholder = 'Paste a YouTube, Vimeo, or web link to embed...'

    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'oink-media-submit-btn'
    btn.textContent = 'Embed'

    form.appendChild(input)
    form.appendChild(btn)
    this.wrapper.appendChild(form)

    const handleSubmit = (): void => {
      const raw = input.value?.trim()
      if (raw) {
        const { embedUrl, service } = parseEmbedUrl(raw)
        this.data.source = raw
        this.data.embed = embedUrl
        this.data.service = service
        this.renderEmbed(embedUrl, '')
      }
    }

    btn.addEventListener('click', handleSubmit)
    input.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') handleSubmit()
    })
  }

  renderEmbed(url: string, caption: string): void {
    if (!this.wrapper) return
    this.wrapper.replaceChildren()

    // Validate URL scheme: only allow http: or https:
    let safeUrl = ''
    try {
      const parsed = new URL(url, window.location.origin)
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
        safeUrl = parsed.href
      }
    } catch {
      safeUrl = ''
    }

    if (!safeUrl) {
      const errorDiv = document.createElement('div')
      errorDiv.className = 'text-xs text-rose-400 p-3 bg-rose-500/10 rounded border border-rose-500/20'
      errorDiv.textContent = 'Invalid embed URL. Only secure http:// and https:// URLs are supported.'
      this.wrapper.appendChild(errorDiv)
      return
    }

    const container = document.createElement('div')
    container.className = 'oink-embed-container group'

    const iframe = document.createElement('iframe')
    iframe.src = safeUrl
    iframe.className = 'oink-embed-iframe'
    iframe.allowFullscreen = true
    iframe.setAttribute(
      'allow',
      'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
    )
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-forms')

    const captionInput = document.createElement('input')
    captionInput.type = 'text'
    captionInput.className = 'oink-media-caption-input'
    captionInput.placeholder = 'Add a caption...'
    captionInput.value = caption || ''
    captionInput.addEventListener('input', () => {
      this.data.caption = captionInput.value
    })

    container.appendChild(iframe)
    container.appendChild(captionInput)
    this.wrapper.appendChild(container)
  }

  save(blockContent?: HTMLElement): EmbedBlockData {
    if (blockContent) {
      const input = blockContent.querySelector('.oink-media-url-input') as HTMLInputElement
      const captionInput = blockContent.querySelector(
        '.oink-media-caption-input'
      ) as HTMLInputElement
      if (input && input.value) {
        const raw = input.value.trim()
        const { embedUrl, service } = parseEmbedUrl(raw)
        this.data.source = raw
        this.data.embed = embedUrl
        this.data.service = service
      }
      if (captionInput) {
        this.data.caption = captionInput.value.trim()
      }
    }
    return {
      service: this.data.service || 'generic',
      source: this.data.source || '',
      embed: this.data.embed || '',
      caption: this.data.caption || ''
    }
  }
}
