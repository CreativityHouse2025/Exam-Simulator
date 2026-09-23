/** A bare route handler, and the shape every middleware in the chain returns. */
export type ApiHandler = (req: Request) => Promise<Response>
