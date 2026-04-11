export type Pagination<T> =
{
    page: number,
    total: number,
    liste: T[],
    aUnePageSuivante: boolean
}