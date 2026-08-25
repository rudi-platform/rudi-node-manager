'use strict'

// JavaScript
// const DOMPurify = require('dompurify')
import DOMPurify from '../dependencies/dompurify/purify.es.mjs'

const purifier = DOMPurify

// JavaScript
// A_HREF_URI: ensures an href starts with an allowed scheme/path (case-insensitive):
// - "http:" or "https:" (web URLs)
// - "mailto:" (email links)
// - "tel:" (telephone links)
const A_HREF_URI = /^(?:https?:|mailto:|tel:)/i

// CITE_URI: ensures a cite attribute starts with an allowed scheme/path (case-insensitive):
// - "http:" or "https:" (web URLs)
const CITE_URI = /^(?:https?:)/i

// Allowed tags, aligned with backend Safelist (basic)
const ALLOWED_TAGS = [
  'a',
  'b',
  'blockquote',
  'br',
  'cite',
  'code',
  'dd',
  'dl',
  'dt',
  'em',
  'i',
  'li',
  'ol',
  'p',
  'pre',
  'q',
  'small',
  'span',
  'strike',
  'strong',
  'sub',
  'sup',
  'u',
  'ul',
]

// Allowed attributes (broad, legacy-friendly, close to backend additions).
// Note: DOMPurify applies this list globally; fine-grained checks (per-tag/per-protocol)
// are enforced in the hook above to mirror backend behavior.
const ALLOWED_ATTR = [
  // anchors/URLs
  'href',
  'title',
  'target',
  'rel',
  'ref',
  // legacy alignment/presentation
  'align',
  'alink',
  'vlink',
  'bgcolor',
  'border',
  'cellpadding',
  'cellspacing',
  'color',
  // tables
  'cols',
  'colspan',
  'rows',
  'rowspan',
  'width',
  'height',
  'span',
  'summary',
  // image/map/link related
  'alt',
  'coords',
  'shape',
  'usemap',
  'ismap',
  'hspace',
  'vspace',
  // assorted legacy/common
  'class',
  'dir',
  'face',
  'lang',
  'marginheight',
  'marginwidth',
  'multiple',
  'nohref',
  'noresize',
  'noshade',
  'nowrap',
  'rev',
  'scrolling',
  'tabindex',
  'title',
  'valign',
  'value',
  // inline styles (filtered to safe properties in the hook below)
  'style',
]

// DOMPurify post-processing hook (runs AFTER attribute sanitization).
// Purpose:
// - Enforce/adjust attributes depending on the tag (links and citations).
// - Align front behavior with backend Safelist policies.
// Security notes:
// - We validate allowed URL schemes for href/cite via regexes (A_HREF_URI / CITE_URI).
// - We add target and rel on <a> for UX and tabnabbing protection.
purifier.addHook('afterSanitizeAttributes', (node) => {
  // Node tag name (uppercase by DOM API, e.g. 'A', 'BLOCKQUOTE', 'Q')
  const tag = node.tagName

  // Case 1: <a> links
  if (tag === 'A') {
    // Potentially sanitized href (may be removed by DOMPurify already)
    const href = node.getAttribute('href')

    // If missing or using a non-allowed scheme (checked via A_HREF_URI),
    // remove href to avoid dangerous links (e.g. javascript:, data:, etc.).
    if (!href || !A_HREF_URI.test(href)) {
      node.removeAttribute('href')
    } else {
      // Otherwise, valid link: open in new tab for consistent UX
      node.setAttribute('target', '_blank')
      // Enforce rel:
      // - "nofollow": mirrors backend Safelist hint
      // - "noopener noreferrer": prevents tabnabbing and referrer leakage
      node.setAttribute('rel', 'nofollow noopener noreferrer')
    }

    // Case 2: inline style — only allow text-align
  } else if (node.hasAttribute('style')) {
    const style = node.getAttribute('style')
    const textAlignMatch = style.match(/text-align\s*:\s*(left|center|right|justify)/i)
    if (textAlignMatch) {
      node.setAttribute('style', `text-align: ${textAlignMatch[1].toLowerCase()}`)
    } else {
      node.removeAttribute('style')
    }

    // Case 3: <blockquote> and <q> (citations)
  } else if (tag === 'BLOCKQUOTE' || tag === 'Q') {
    // The citation source URL
    const cite = node.getAttribute('cite')

    // If cite exists but scheme is not allowed (CITE_URI allows http/https),
    // strip it to keep only safe protocols.
    if (cite && !CITE_URI.test(cite)) {
      node.removeAttribute('cite')
    }
  }
})

// Sanitize to allowed HTML; KEEP_CONTENT preserves text inside removed tags.
export function sanitizeHtml(input) {
  return purifier.sanitize(input || '', {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    KEEP_CONTENT: true,
  })
}

// Convert sanitized HTML into plain text (safe round-trip).
export function toPlainTextFromHtml(html) {
  const doc = new DOMParser().parseFromString(html || '', 'text/html')
  return doc.body.textContent || ''
}

// Convenience helper: return both sanitized HTML and extracted text.
export function sanitizeBoth(input) {
  const html = sanitizeHtml(input)
  const text = toPlainTextFromHtml(html)
  return { html, text }
}
