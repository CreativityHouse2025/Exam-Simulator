import type { ThemedStyles } from '../../types'
import { SessionActionTypes, SessionDataContext, SessionNavigationContext } from '../../session'

import React from 'react'
import styled from 'styled-components'
import { Bookmark } from '@styled-icons/material/Bookmark'
import { BookmarkBorder } from '@styled-icons/material/BookmarkBorder'

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

  const onBookmarkQuestion = React.useCallback(() => {
    if (bookmarked) {
      const indexToRemove = bookmarks.indexOf(index)
      if (indexToRemove > -1) {
        bookmarks.splice(indexToRemove, 1)
      }
    } else {
      if (!bookmarks.includes(index)) {
        bookmarks.push(index)
      }
    }

    update!([SessionActionTypes.SET_BOOKMARKS, [...bookmarks]])
  }, [bookmarked, bookmarks, index, update])

  return (
    <BookmarkStyles $bookmarked={bookmarked}>
      {React.createElement(bookmarked ? Bookmark : BookmarkBorder, { size: 40, onClick: onBookmarkQuestion })}
    </BookmarkStyles>
  )
}

export default BookmarkButton

export interface BookmarkStylesProps extends ThemedStyles {
  $bookmarked: boolean
}
