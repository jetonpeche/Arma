import { GradeLeger } from "./Grade"

export type PersonnageReserve =
{
    id: number,
    nom: string,
    grade: GradeLeger | null,
    nomSpecialite: string | null,
    dateDerniereParticipation: Date | null
}