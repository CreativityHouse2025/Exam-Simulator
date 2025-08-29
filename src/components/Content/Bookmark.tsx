import type { ThemedStyles } from '../../types'
import { SessionDataContext, SessionNavigationContext } from '../../contexts'

import React from 'react'
import styled from 'styled-components'
import { Bookmark } from '@styled-icons/material/Bookmark'
import { BookmarkBorder } from '@styled-icons/material/BookmarkBorder'
import { SESSION_ACTION_TYPES } from '../../constants'

const BookmarkStyles = styled.div<BookmarkStylesProps>`
  margin-right: 5rem;
  color: ${({ $bookmarked, theme }) => ($bookmarked ? theme.tertiary : theme.grey[10])};
  transition: 0.3s;
  cursor: pointer;
  &:hover {
    color: ${({ theme }) => theme.tertiary};
  }
`

const BookmarkButton: React.FC = () => {
  const { index, update } = React.useContext(SessionNavigationContext)
  const { bookmarks } = React.useContext(SessionDataContext)

  const bookmarked = bookmarks.includes(index)

  const toggleBookmark = React.useCallback(() => {
    const newBookmarks = bookmarked ? bookmarks.filter((i) => i !== index) : [...bookmarks, index]

    update!([SESSION_ACTION_TYPES.SET_BOOKMARKS, newBookmarks])
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
