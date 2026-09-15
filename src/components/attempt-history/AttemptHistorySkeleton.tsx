import React from "react"
import { translate } from "../../utils/translation"
import { Tr, Td } from "./AttemptHistoryStyles"

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
      <Tr key={i} index={i}>
        {CELLS.map(({ labelKey, rects }) => (
          <Td key={labelKey} data-label={translate(labelKey)}>
            <div className="flex gap-1.5 flex-wrap">
              {rects.map((rect, j) => (
                <span
                  key={j}
                  className="skeleton-shimmer inline-block"
                  style={{
                    width: rect.width,
                    height: rect.height ?? "14px",
                    borderRadius: rect.radius ?? "4px",
                  }}
                />
              ))}
            </div>
          </Td>
        ))}
      </Tr>
    ))}
  </>
)

export default AttemptHistorySkeleton
