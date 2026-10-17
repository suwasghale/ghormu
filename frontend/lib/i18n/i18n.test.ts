import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'

import { footerColumns, linkedPages, mainNav, placeholderPages, publishedPages } from '@/config/navigation'
import { proxy } from '@/proxy'
import { defaultLocale, isLocale, localizePath, otherLocale, stripLocale } from './config'
import en from './dictionaries/en'
import ne from './dictionaries/ne'
import { alternatesFor } from './metadata'

describe('locales', () => {
  it('defaults to Nepali', () => {
    expect(defaultLocale).toBe('ne')
  })

  it.each(['ne', 'en'])('accepts %s', value => expect(isLocale(value)).toBe(true))
  it.each(['fr', 'np', 'NE', '', null, undefined])('rejects %s', value => expect(isLocale(value)).toBe(false))

  it('adds and removes the locale prefix', () => {
    expect(localizePath('ne', '/')).toBe('/ne')
    expect(localizePath('en', '/about/history')).toBe('/en/about/history')
    expect(stripLocale('/ne')).toBe('/')
    expect(stripLocale('/en/about/history')).toBe('/about/history')
    expect(stripLocale('/login')).toBe('/login')
  })

  it('switches between the two languages', () => {
    expect(otherLocale('ne')).toBe('en')
    expect(otherLocale('en')).toBe('ne')
  })

  it('declares every language and Nepali as x-default', () => {
    expect(alternatesFor('en', '/about')).toEqual({
      canonical: '/en/about',
      languages: { ne: '/ne/about', en: '/en/about', 'x-default': '/ne/about' },
    })
  })
})

describe('dictionaries', () => {
  // The types already force the same keys; this catches a key left empty.
  const leaves = (value: unknown, path = ''): [string, unknown][] =>
    value && typeof value === 'object'
      ? Object.entries(value).flatMap(([key, child]) => leaves(child, path ? `${path}.${key}` : key))
      : [[path, value]]

  it.each([['ne', ne], ['en', en]])('%s has no empty strings', (_, dict) => {
    for (const [path, value] of leaves(dict)) expect(value, path).toMatch(/\S/)
  })
})

describe('navigation', () => {
  it('keeps the navbar to six items', () => {
    expect(mainNav.map(item => item.key)).toEqual(['home', 'about', 'explore', 'community', 'updates', 'contact'])
  })

  it('keeps legal and utility pages out of the navbar', () => {
    const navbar = new Set(mainNav.flatMap(item => [item, ...(item.children ?? [])]).map(link => link.href))
    for (const href of ['/privacy', '/terms', '/accessibility', '/faq', '/sitemap']) {
      expect(navbar.has(href), href).toBe(false)
      expect(footerColumns.some(column => column.links.some(link => link.href === href)), href).toBe(true)
    }
  })

  it('gives every linked page a placeholder, but not home or sign-in', () => {
    expect(linkedPages.get('/about/history')).toBe('history')
    expect(linkedPages.get('/privacy')).toBe('privacy')
    expect(linkedPages.has('/')).toBe(false)
    expect(linkedPages.has('/login')).toBe(false)
  })

  it('builds a placeholder only for pages without their own route', () => {
    for (const path of publishedPages) expect(placeholderPages.has(path), path).toBe(false)
    expect(placeholderPages.has('/about/history')).toBe(true)
  })

  it('has a route file for every published page', () => {
    for (const path of publishedPages) {
      const file = path === '/' ? 'app/[locale]/page.tsx' : `app/[locale]${path}/page.tsx`
      expect(existsSync(file), file).toBe(true)
    }
  })
})

describe('root redirect', () => {
  const visit = (cookie?: string) =>
    proxy(new NextRequest('https://ghormu.com/?utm_source=qr', { headers: cookie ? { cookie } : {} }))

  it('sends first-time visitors to Nepali', () => {
    expect(visit().headers.get('location')).toBe('https://ghormu.com/ne?utm_source=qr')
  })

  it('remembers an explicit choice', () => {
    expect(visit('locale=en').headers.get('location')).toBe('https://ghormu.com/en?utm_source=qr')
  })

  it('ignores a language the site does not have', () => {
    expect(visit('locale=fr').headers.get('location')).toBe('https://ghormu.com/ne?utm_source=qr')
  })
})
