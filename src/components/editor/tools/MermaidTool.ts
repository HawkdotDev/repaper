import type { API } from '@editorjs/editorjs'
import type MermaidType from 'mermaid'

export interface MermaidBlockData {
  code?: string
}

let mermaidInstance: typeof MermaidType | null = null

async function getMermaid(): Promise<typeof MermaidType> {
  if (mermaidInstance) return mermaidInstance
  const mod = await import('mermaid')
  mermaidInstance = mod.default
  try {
    mermaidInstance.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose'
    })
  } catch (err) {
    console.warn('Failed initializing mermaid:', err)
  }
  return mermaidInstance
}

export class MermaidTool {
  static get toolbox(): { icon: string; title: string } {
    return {
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M18 15v-5a3 3 0 0 0-3-3H9"/><path d="m15 12-3-3 3-3"/></svg>',
      title: 'Mermaid Diagram'
    }
  }

  static get isReadOnlySupported(): boolean {
    return true
  }

  protected api?: API
  private data: MermaidBlockData
  private readOnly: boolean
  private wrapper: HTMLElement | null = null
  private inputEl: HTMLTextAreaElement | null = null
  private previewEl: HTMLElement | null = null
  private renderId: string

  constructor({
    data,
    api,
    readOnly
  }: {
    data: MermaidBlockData
    api?: API
    readOnly?: boolean
  }) {
    this.api = api
    this.data = data || { code: 'graph TD;\n  A[Start] --> B[Process];\n  B --> C[End];' }
    this.readOnly = Boolean(readOnly)
    this.renderId = `mermaid_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  }

  public render(): HTMLElement {
    this.wrapper = document.createElement('div')
    this.wrapper.className =
      'oink-mermaid-block my-3 p-3 rounded-lg border border-zinc-700/50 bg-zinc-900/40 text-zinc-100 font-mono text-sm'

    this.previewEl = document.createElement('div')
    this.previewEl.className =
      'oink-mermaid-preview flex items-center justify-center p-3 min-h-[60px] overflow-x-auto'

    this.updatePreview()
    this.wrapper.appendChild(this.previewEl)

    if (!this.readOnly) {
      this.inputEl = document.createElement('textarea')
      this.inputEl.className =
        'oink-mermaid-input w-full mt-2 p-2 rounded bg-zinc-800/80 border border-zinc-700 text-xs text-zinc-200 outline-none focus:border-zinc-500 font-mono resize-y'
      this.inputEl.rows = 4
      this.inputEl.placeholder = 'graph TD;\n  A --> B;'
      this.inputEl.value = this.data.code || ''

      let debounceTimer: ReturnType<typeof setTimeout> | null = null
      this.inputEl.addEventListener('input', () => {
        this.data.code = this.inputEl?.value || ''
        if (debounceTimer) clearTimeout(debounceTimer)
        debounceTimer = setTimeout(() => {
          this.updatePreview()
        }, 300)
      })

      this.wrapper.appendChild(this.inputEl)
    }

    return this.wrapper
  }

  private updatePreview(): void {
    if (!this.previewEl) return
    const code = (this.data.code || '').trim()
    if (!code) {
      this.previewEl.innerHTML = '<span class="text-zinc-500 text-xs italic">Empty Mermaid diagram</span>'
      return
    }

    const preview = this.previewEl
    const containerId = `${this.renderId}_${Date.now()}`

    if (!mermaidInstance) {
      preview.innerHTML =
        '<div class="flex items-center justify-center gap-2 text-xs text-zinc-400 py-4 select-none"><svg class="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path></svg><span>Loading Mermaid renderer...</span></div>'
    }

    getMermaid()
      .then((m) => {
        return m.render(containerId, code)
      })
      .then(({ svg }) => {
        if (preview) {
          preview.innerHTML = svg
        }
      })
      .catch((err) => {
        if (preview) {
          preview.innerHTML = `<span class="text-red-400 text-xs">Diagram syntax error: ${String(err)}</span>`
        }
      })
  }

  public save(): MermaidBlockData {
    return {
      code: this.data.code || ''
    }
  }
}
