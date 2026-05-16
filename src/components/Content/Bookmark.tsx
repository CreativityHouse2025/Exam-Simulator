import type { ThemedStyles } from '../../types'
import { useSessionNavigation, useSessionData } from '../../contexts'

import React from 'react'
import styled from 'styled-components'
import { Bookmark } from '@styled-icons/material/Bookmark'
import { BookmarkBorder } from '@styled-icons/material/BookmarkBorder'
import { SESSION_ACTION_TYPES } from '../../constants'

const BookmarkStyles = styled.div<BookmarkStylesProps>`
  color: ${({ $bookmarked, theme }) => ($bookmarked ? theme.tertiary : theme.grey[10])};
  transition: 0.3s;
  cursor: pointer;
  &:hover {
    color: ${({ theme }) => theme.tertiary};
  }
`

const BookmarkButton: React.FC = () => {
  const { index, update } = useSessionNavigation()
  const { bookmarks } = useSessionData()

  const bookmarked = bookmarks.includes(index)

  const toggleBookmark = React.useCallback(() => {
    const newBookmarks = bookmarked ? bookmarks.filter((i) => i !== index) : [...bookmarks, index]

    update!([SESSION_ACTION_TYPES.SET_BOOKMARKS, newBookmarks], [SESSION_ACTION_TYPES.MARK_DIRTY, index])
  }, [bookmarked, bookmarks, index, update])

  const IconComponent = bookmarked ? Bookmark : BookmarkBorder

  return (
    <BookmarkStyles $bookmarked={bookmarked} className="no-select">
      <IconComponent size={40} onClick={toggleBookmark} />
    </BookmarkStyles>
  )
}

export default BookmarkButton

export interface BookmarkStylesProps extends ThemedStyles {
  $bookmarked: boolean
}
