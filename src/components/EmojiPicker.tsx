import React, { useEffect, useRef, useState } from 'react'

interface EmojiPickerProps {
  onSelect: (emoji: string) => void
  onClose: () => void
  onRemove?: () => void
}

const emojiKeywords: Record<string, string> = {
  '✦': 'sparkle star 4-point sparkle ai magic bw black white',
  '✧': 'sparkle star outline magic bw black white',
  '★': 'star favorite solid bw black white',
  '☆': 'star favorite outline bw black white',
  '❖': 'diamond emblem floral craft bw black white',
  '◈': 'diamond pattern square bw black white',
  '◆': 'diamond black solid bw black white',
  '◇': 'diamond white outline bw black white',
  '●': 'circle black bullet dot round bw black white',
  '○': 'circle white outline ring bw black white',
  '■': 'square black solid block stop bw black white',
  '□': 'square white outline box check bw black white',
  '▲': 'triangle up black arrow bw black white',
  '△': 'triangle up white outline bw black white',
  '⬢': 'hexagon black polygon cube bw black white',
  '⬡': 'hexagon white outline bw black white',
  '⌘': 'command mac apple cmd shortcut bw black white',
  '⌥': 'option alt keyboard symbol bw black white',
  '⚡': 'lightning bolt electric thunder energy bw black white',
  '⚙': 'gear settings config cog wrench bw black white',
  '✎': 'pencil edit write draw pen bw black white',
  '✓': 'check checkmark done success approve bw black white',
  '✕': 'cross x cancel remove close error bw black white',
  '∞': 'infinity loop forever eternal bw black white',
  '☕': 'coffee tea cup mug drink cafe bw black white',
  '♟': 'pawn chess strategy piece game bw black white',
  '⚓': 'anchor marine ship ocean sea bw black white',
  '✿': 'flower floral blossom nature bw black white',
  '☽': 'moon crescent night dark bw black white',
  '☀': 'sun sunshine summer light warm day bw black white',
  '📝': 'memo write note document text pencil page',
  '🚀': 'rocket launch ship speed fast space',
  '💡': 'bulb light idea brainstorm insight',
  '🔥': 'fire hot trend flame burn lit',
  '⭐': 'star favorite gold rate bookmark',
  '🎯': 'target goal aim bullseye focus okr',
  '🎨': 'art palette paint design creative color',
  '💻': 'laptop computer tech pc code programming',
  '⚙️': 'gear settings config options',
  '📌': 'pin pinboard pushpin location clip',
  '📅': 'calendar date schedule event planner',
  '📄': 'file page document paper text',
  '📁': 'folder directory documents files archive',
  '📂': 'folder open directory browse',
  '📓': 'notebook journal diary booklet',
  '📕': 'book closed red study read guide',
  '📗': 'book green learn study doc',
  '📘': 'book blue manual reference',
  '📙': 'book orange textbook read',
  '🔑': 'key access security password auth',
  '🔒': 'lock secure privacy private secret',
  '🔔': 'bell notification alert chime reminder',
  '📊': 'chart bar analytics graph statistics stats',
  '📈': 'chart trend growth profit stock up',
  '✉️': 'mail envelope email letter message inbox',
  '💬': 'chat speech bubble comment discuss talk',
  '🛠️': 'tools hammer wrench fix build repair',
  '🧭': 'compass guide explore direction navigation',
  '🌱': 'seedling plant grow leaf sprout nature',
  '🍀': 'clover lucky four leaf fortune good',
  '🌸': 'cherry blossom flower spring sakura bloom',
  '☀️': 'sun weather sunny bright warm summer',
  '🌙': 'moon crescent night sleep dark evening',
  '🌈': 'rainbow pride color sky beauty hope',
  '🍔': 'burger hamburger food fast food eat',
  '🐱': 'cat pet animal kitten feline meow',
  '🐶': 'dog pet animal puppy canine bark',
  '🏆': 'trophy cup win winner prize award victory',
  '✈️': 'airplane flight travel vacation fly plane',
  '🏠': 'house home building apartment residence',
  '💼': 'briefcase work job business office career'
}

const emojiCategories = [
  {
    category: 'Black & White',
    emojis: [
      '✦', '✧', '★', '☆', '❖', '◈',
      '◆', '◇', '●', '○', '■', '□',
      '▲', '△', '⬢', '⬡', '⌘', '⌥',
      '⚡', '⚙', '✎', '✓', '✕', '∞',
      '☕', '♟', '⚓', '✿', '☽', '☀'
    ]
  },
  {
    category: 'Popular',
    emojis: ['📝', '🚀', '💡', '🔥', '⭐', '⚡', '🎯', '🎨', '💻', '⚙️', '📌', '📅']
  },
  {
    category: 'Objects & Tech',
    emojis: [
      '📄',
      '📁',
      '📂',
      '📓',
      '📕',
      '📗',
      '📘',
      '📙',
      '🔑',
      '🔒',
      '🔔',
      '📊',
      '📈',
      '✉️',
      '💬',
      '🛠️',
      '🧭'
    ]
  },
  {
    category: 'Nature & Food',
    emojis: ['🌱', '🍀', '🌸', '☀️', '🌙', '🌈', '☕', '🍔', '🐱', '🐶', '🏆', '✈️', '🏠', '💼']
  }
]

export default function EmojiPicker({
  onSelect,
  onClose,
  onRemove
}: EmojiPickerProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose])

  const handleRandom = (): void => {
    const all = emojiCategories.flatMap((c) => c.emojis)
    const random = all[Math.floor(Math.random() * all.length)]
    onSelect(random)
    onClose()
  }

  return (
    <div ref={containerRef} className="emoji-picker-popover">
      <div className="emoji-picker-header">
        <input
          type="text"
          className="emoji-picker-search"
          placeholder="Search icon..."
          value={searchQuery}
          onChange={(e): void => setSearchQuery(e.target.value)}
          autoFocus
        />
        <div className="emoji-picker-actions">
          <button className="emoji-picker-action-btn" onClick={handleRandom}>
            Random
          </button>
          {onRemove && (
            <button
              className="emoji-picker-action-btn remove"
              onClick={(): void => {
                onRemove()
                onClose()
              }}
            >
              Remove
            </button>
          )}
          <button className="emoji-picker-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>
      </div>

      <div className="emoji-picker-scroll-area">
        {emojiCategories.map((cat) => {
          const query = searchQuery.trim().toLowerCase()
          const filtered = query
            ? cat.emojis.filter((e) => {
                if (e.includes(query)) return true
                const kw = emojiKeywords[e]
                return kw ? kw.toLowerCase().includes(query) : false
              })
            : cat.emojis

          if (filtered.length === 0) return null

          return (
            <div key={cat.category} className="emoji-category-block mb-2">
              <div className="emoji-category-title">{cat.category}</div>
              <div className="emoji-picker-grid">
                {filtered.map((emoji) => (
                  <button
                    key={emoji}
                    className="emoji-picker-btn"
                    onClick={(): void => {
                      onSelect(emoji)
                      onClose()
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
