import type { API } from '@editorjs/editorjs'
import katex from 'katex'

export interface MathBlockData {
  math?: string
}

export class MathTool {
  static get toolbox(): { icon: string; title: string } {
    return {
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 4H6l6 8-6 8h12"/></svg>',
      title: 'Math Formula'
    }
  }

  static get isReadOnlySupported(): boolean {
    return true
  }

  protected api?: API
  private data: MathBlockData
  private readOnly: boolean
  private wrapper: HTMLElement | null = null
  private inputEl: HTMLTextAreaElement | null = null
  private previewEl: HTMLElement | null = null

  constructor({
    data,
    api,
    readOnly
  }: {
    data: MathBlockData
    api?: API
    readOnly?: boolean
  }) {
    this.api = api
    this.data = data || { math: '' }
    this.readOnly = Boolean(readOnly)
  }

  public render(): HTMLElement {
    this.wrapper = document.createElement('div')
    this.wrapper.className =
      'oink-math-block my-2 p-3 rounded-lg border border-zinc-700/50 bg-zinc-900/40 text-zinc-100 font-mono text-sm'

    this.previewEl = document.createElement('div')
    this.previewEl.className =
      'oink-math-preview flex items-center justify-center p-3 min-h-[40px] text-base overflow-x-auto'

    this.updatePreview()
    this.wrapper.appendChild(this.previewEl)

    if (!this.readOnly) {
      this.inputEl = document.createElement('textarea')
      this.inputEl.className =
        'oink-math-input w-full mt-2 p-2 rounded bg-zinc-800/80 border border-zinc-700 text-xs text-zinc-200 outline-none focus:border-zinc-500 font-mono resize-y'
      this.inputEl.rows = 2
      this.inputEl.placeholder = 'Type LaTeX formula, e.g. E = mc^2 or \\int_0^1 x^2 dx'
      this.inputEl.value = this.data.math || ''

      this.inputEl.addEventListener('input', () => {
        this.data.math = this.inputEl?.value || ''
        this.updatePreview()
      })

      this.wrapper.appendChild(this.inputEl)
    }

    return this.wrapper
  }

  private updatePreview(): void {
    if (!this.previewEl) return
    const formula = (this.data.math || '').trim()
    if (!formula) {
      this.previewEl.innerHTML = '<span class="text-zinc-500 text-xs italic">Empty LaTeX formula</span>'
      return
    }

    try {
      this.previewEl.innerHTML = katex.renderToString(formula, {
        displayMode: true,
        throwOnError: false
      })
    } catch (err) {
      this.previewEl.innerHTML = `<span class="text-red-400 text-xs">LaTeX error: ${String(err)}</span>`
    }
  }

  public save(): MathBlockData {
    return {
      math: this.data.math || ''
    }
  }
}
