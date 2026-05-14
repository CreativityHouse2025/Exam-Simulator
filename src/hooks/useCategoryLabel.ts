import categories from "../data/exam/categories.json"
import useSettings from "./useSettings";

/**
 * Custom hook to get a category label from its ID.
 * Returns undefined when id is null (e.g. full exam sessions have no category).
 */
export default function useCategoryLabel(id: number): string | undefined {
    const { settings } = useSettings();
    const langCode = settings.language;

    const categoryLabel = categories.find(c => c.id === id)?.name[langCode]
    return categoryLabel
}