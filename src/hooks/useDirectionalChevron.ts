import { ChevronLeft, ChevronRight } from "lucide-react"
import useSettings from "./useSettings"
import { LANGUAGES } from "../constants"

/** Chevron icons that flip direction under RTL languages. */
export default function useDirectionalChevron() {
	const { settings } = useSettings()
	const isRtl = LANGUAGES[settings.language].dir === "rtl"

	return {
		isRtl,
		PrevIcon: isRtl ? ChevronRight : ChevronLeft,
		NextIcon: isRtl ? ChevronLeft : ChevronRight,
	}
}
