import categories from "../data/exam-data/categories.json"
import useSettings from "./useSettings";

/**
 * Custom hook to get a category label from its ID.
 * Returns undefined when id is null (e.g. full exam sessions have no category).
 */
export default function useCategoryLabel(id: number | null): string | undefined {
    const { settings } = useSettings();
    const langCode = settings.language;

    if (id === null) return undefined

    const categoryLabel = categories.find(c => c.id === id)?.name[langCode]
    if (categoryLabel) return categoryLabel

    throw new Error(`category with id ${id} does not exist`)
}