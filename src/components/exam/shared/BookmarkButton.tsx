import type { ThemedStyles } from '../../../types'
import React from 'react'
import styled from 'styled-components'
import { Bookmark } from '@styled-icons/material/Bookmark'
import { BookmarkBorder } from '@styled-icons/material/BookmarkBorder'
import { useExamSessionCore } from '../../../hooks/examSession/useExamSessionCore'

const BookmarkStyles = styled.div<BookmarkStylesProps>`
  color: ${({ $bookmarked, theme }) => ($bookmarked ? theme.tertiary : theme.grey[10])};
  transition: 0.3s;
  cursor: pointer;
  &:hover {
    color: ${({ theme }) => theme.tertiary};
  }
`

const BookmarkButton: React.FC = () => {
  const { index, bookmarks, toggleBookmark } = useExamSessionCore()
  const bookmarked = bookmarks.includes(index)
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
