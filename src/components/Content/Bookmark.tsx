import type { ThemedStyles } from '../../types'
import { SessionActionTypes, type Session } from '../../session'

import React, { createElement } from 'react'
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

const BookmarkButton: React.FC<BookmarkButtonProps> = ({ session: { index, bookmarks, update } }) => {
  const bookmarked = bookmarks.includes(index)

  const onBookmarkQuestion = React.useCallback(() => {
    if (bookmarked) {
      bookmarks.splice(bookmarks.indexOf(index), 1)
    } else {
      bookmarks.push(index)
    }

    update!(SessionActionTypes.SET_BOOKMARKS, bookmarks)
  }, [bookmarked, bookmarks, index, update])

  return (
    <BookmarkStyles $bookmarked={bookmarked}>
      {createElement(bookmarked ? Bookmark : BookmarkBorder, { size: 40, onClick: onBookmarkQuestion })}
    </BookmarkStyles>
  )
}

export default BookmarkButton

export interface BookmarkButtonProps {
  session: Session
}

export interface BookmarkStylesProps extends ThemedStyles {
  $bookmarked: boolean
}
