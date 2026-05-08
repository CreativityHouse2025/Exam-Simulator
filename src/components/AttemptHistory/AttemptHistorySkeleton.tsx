import React from "react"
import styled, { keyframes } from "styled-components"
import { translate } from "../../utils/translation"
import { Tr, Td } from "./AttemptHistoryRow"

const wave = keyframes`
  0%   { background-position: -600px 0; }
  100% { background-position:  600px 0; }
`

const SkeletonRect = styled.span<{ $width: string; $height?: string; $radius?: string }>`
  display: inline-block;
  width: ${({ $width }) => $width};
  height: ${({ $height }) => $height ?? "14px"};
  border-radius: ${({ $radius }) => $radius ?? "4px"};
  background: linear-gradient(90deg, #ebebeb 25%, #d6d6d6 50%, #ebebeb 75%);
  background-size: 1200px 100%;
  animation: ${wave} 1.5s infinite linear;
`

const SkeletonRects = styled.div`
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
`

type Rect = { width: string; height?: string; radius?: string }

type CellDef = {
  labelKey: string
  rects: Rect[]
}

const CELLS: CellDef[] = [
  { labelKey: "history.table.type",        rects: [{ width: "50px",  height: "22px", radius: "4px"  }] },
  { labelKey: "history.table.exam-domain", rects: [{ width: "150px"                                  }] },
  { labelKey: "history.table.state",       rects: [{ width: "90px"                                   }] },
  { labelKey: "history.table.score",       rects: [{ width: "38px"                                   }] },
  { labelKey: "history.table.status",      rects: [{ width: "56px",  height: "22px", radius: "20px" }] },
  { labelKey: "history.table.date",        rects: [{ width: "84px"                                   }] },
  {
    labelKey: "history.table.action",
    rects: [
      { width: "74px", height: "30px", radius: "6px" },
      { width: "74px", height: "30px", radius: "6px" },
    ],
  },
]

const ROWS = 5

/** Shimmer placeholder rows shown while attempts are loading. Reuses Tr/Td so mobile card layout is automatic. */
const AttemptHistorySkeleton: React.FC = () => (
  <>
    {Array.from({ length: ROWS }, (_, i) => (
      <Tr key={i} $index={i}>
        {CELLS.map(({ labelKey, rects }) => (
          <Td key={labelKey} data-label={translate(labelKey)}>
            <SkeletonRects>
              {rects.map((rect, j) => (
                <SkeletonRect key={j} $width={rect.width} $height={rect.height} $radius={rect.radius} />
              ))}
            </SkeletonRects>
          </Td>
        ))}
      </Tr>
    ))}
  </>
)

export default AttemptHistorySkeleton
