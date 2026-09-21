import type { API } from '@editorjs/editorjs'

export interface VideoBlockData {
  url?: string
  caption?: string
}

export class VideoTool {
  static get toolbox(): { icon: string; title: string } {
    return {
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2"/></svg>',
      title: 'Video'
    }
  }

  static get isReadOnlySupported(): boolean {
    return true
  }

  protected api?: API
  private data: VideoBlockData
  private wrapper: HTMLElement | null = null

  constructor({ data, api }: { data: VideoBlockData; api?: API }) {
    this.api = api
    this.data = data || {}
  }

  render(): HTMLElement {
    this.wrapper = document.createElement('div')
    this.wrapper.classList.add('oink-video-block')

    if (this.data && this.data.url) {
      this.renderVideo(this.data.url, this.data.caption || '')
    } else {
      this.renderInput()
    }

    return this.wrapper
  }

  renderInput(): void {
    if (!this.wrapper) return
    this.wrapper.replaceChildren()

    const box = document.createElement('div')
    box.className = 'oink-media-input-box'

    const header = document.createElement('div')
    header.className = 'flex items-center justify-between mb-2'

    const titleGroup = document.createElement('div')
    titleGroup.className = 'flex items-center gap-2 text-xs text-zinc-300 font-medium'
    titleGroup.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2"/></svg>
      <span>Embed or Upload Video</span>
    `

    const uploadLabel = document.createElement('label')
    uploadLabel.className = 'oink-media-upload-label'
    uploadLabel.style.cursor = 'pointer'

    const uploadText = document.createElement('span')
    uploadText.textContent = 'Upload file'

    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = 'video/*'
    fileInput.style.display = 'none'

    uploadLabel.appendChild(uploadText)
    uploadLabel.appendChild(fileInput)

    header.appendChild(titleGroup)
    header.appendChild(uploadLabel)

    const inputRow = document.createElement('div')
    inputRow.className = 'flex gap-2'

    const urlInput = document.createElement('input')
    urlInput.type = 'text'
    urlInput.className = 'oink-media-url-input'
    urlInput.placeholder = 'Paste video URL (.mp4, .webm, direct link)...'

    const submitBtn = document.createElement('button')
    submitBtn.type = 'button'
    submitBtn.className = 'oink-media-submit-btn'
    submitBtn.textContent = 'Embed'

    inputRow.appendChild(urlInput)
    inputRow.appendChild(submitBtn)

    box.appendChild(header)
    box.appendChild(inputRow)
    this.wrapper.appendChild(box)

    const handleSubmit = (): void => {
      const url = urlInput.value?.trim()
      if (url) {
        this.data.url = url
        this.renderVideo(url, '')
      }
    }

    submitBtn.addEventListener('click', handleSubmit)
    urlInput.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') handleSubmit()
    })

    fileInput.addEventListener('change', () => {
      const file = fileInput.files?.[0]
      if (file) {
        // Warning if video is > 25MB to prevent memory bloat
        if (file.size > 25 * 1024 * 1024) {
          const proceed = confirm(
            `This video file is ${(file.size / (1024 * 1024)).toFixed(1)}MB. Storing large local videos may cause memory pressure. Would you like to proceed anyway?`
          )
          if (!proceed) return
        }

        const reader = new FileReader()
        reader.onload = (e) => {
          const result = e.target?.result as string
          if (result) {
            this.data.url = result
            this.renderVideo(result, file.name)
          }
        }
        reader.readAsDataURL(file)
      }
    })
  }

  renderVideo(url: string, caption: string): void {
    if (!this.wrapper) return
    this.wrapper.replaceChildren()

    const container = document.createElement('div')
    container.className = 'oink-video-container group'

    const video = document.createElement('video')
    video.controls = true
    video.src = url
    video.className = 'oink-video-player'

    const captionInput = document.createElement('input')
    captionInput.type = 'text'
    captionInput.className = 'oink-media-caption-input'
    captionInput.placeholder = 'Add a caption...'
    captionInput.value = caption || ''
    captionInput.addEventListener('input', () => {
      this.data.caption = captionInput.value
    })

    container.appendChild(video)
    container.appendChild(captionInput)
    this.wrapper.appendChild(container)
  }

  save(blockContent?: HTMLElement): VideoBlockData {
    if (blockContent) {
      const input = blockContent.querySelector('.oink-media-url-input') as HTMLInputElement
      const captionInput = blockContent.querySelector(
        '.oink-media-caption-input'
      ) as HTMLInputElement
      if (input && input.value) {
        this.data.url = input.value.trim()
      }
      if (captionInput) {
        this.data.caption = captionInput.value.trim()
      }
    }
    return {
      url: this.data.url || '',
      caption: this.data.caption || ''
    }
  }
}
