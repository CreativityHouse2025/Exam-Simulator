import categories from "../data/exam-data/categories.json"
import { GENERAL_CATEGORY_ID } from "../constants";
import { translate } from "../utils/translation";
import type { DropdownItem } from "../types";
import useSettings from "./useSettings";

/**
 * Custom hook to get a category label from its ID
 * @param id - Category id
 */
export default function useCategoryLabel(id: DropdownItem['id']): string {
    const { settings } = useSettings();
    const langCode = settings.language;

    if (id === GENERAL_CATEGORY_ID) {
        return translate('cover.general')
    } else {
        const categoryLabel = (categories.find(c => c.id === id))?.name[langCode]
        if (categoryLabel) {
            return categoryLabel;
        }
        throw new Error(`category with id ${id} does not exist`)
    }
}