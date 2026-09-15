import React from 'react'
import { Bookmark } from 'lucide-react'
import { useExamSessionCore } from '../../../hooks/examSession/useExamSessionCore'

const BookmarkButton: React.FC = () => {
  const { index, bookmarks, toggleBookmark } = useExamSessionCore()
  const bookmarked = bookmarks.includes(index)

  return (
    <div className={`no-select transition-colors duration-300 cursor-pointer hover:text-tertiary ${bookmarked ? "text-tertiary" : "text-grey-950"}`}>
      <Bookmark size={35} fill={bookmarked ? "currentColor" : "none"} onClick={toggleBookmark} />
    </div>
  )
}

export default BookmarkButton
