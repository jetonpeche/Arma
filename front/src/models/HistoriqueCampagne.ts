import { PlaneteOrigineLeger } from "./PlaneteOrigine"

export type HistoriqueCampagne =
{
    id: number,
    date: string,
    titre: string,
    texte: string,
    codeOperation: string,
    planete: PlaneteOrigineLeger | null,
    listeUrlImage: string[]
}

export type HistoriqueCampagneRequete =
{
    date: string,
    titre: string,
    codeOperation: string,
    texte: string,
    idPlanete: number
}